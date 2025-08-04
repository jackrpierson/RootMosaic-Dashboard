import os
import pathlib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables safely
env_path = pathlib.Path(__file__).parent / ".env"
if not env_path.exists():
    env_path = pathlib.Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SHOP_ID = os.getenv("SHOP_ID")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(f"❌ SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env at {env_path}")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_service_data(shop_id=None, limit=None, csv_path="data/service_data.csv"):
    print(f"Loading raw service data from CSV: {csv_path}")
    try:
        df = pd.read_csv(csv_path)
        print(f"SUCCESS: Loaded {len(df)} service records from CSV")
        
        # Apply shop_id filter if specified
        if shop_id:
            df = df[df["shop_id"] == shop_id]
            print(f"Filtered to {len(df)} records for shop_id: {shop_id}")
        
        # Apply limit if specified
        if limit:
            df = df.head(limit)
            print(f"Limited to {len(df)} records")
            
        if df.empty:
            print("WARNING: No service data found in CSV after filtering")
            return pd.DataFrame()
            
        return df
        
    except Exception as e:
        print(f"ERROR: Could not load CSV file: {e}")
        return pd.DataFrame()

def build_transformed_service_data(shop_id=None, batch_size=1000, labor_rate=80, csv_path="data/service_data.csv"):
    """
    Build transformed service data with realistic calculations
    
    Args:
        shop_id: Specific shop ID to process
        batch_size: Number of records to process in each batch
        labor_rate: Hourly labor rate for loss calculations (default: $80/hour)
        csv_path: Path to CSV file to read from (default: data/service_data.csv)
    """
    df = load_service_data(shop_id or SHOP_ID, csv_path=csv_path)
    if df.empty:
        print("ERROR: No data to process")
        return

    # Ensure numeric columns
    for col in ["invoice_total", "labor_hours_billed", "odometer_reading"]:
        if col not in df.columns:
            df[col] = 0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # Feature Engineering - More Realistic Calculations
    # Group by complaint type to get realistic benchmarks
    if "complaint" in df.columns:
        # Calculate average labor hours by complaint type
        complaint_avg_hours = df.groupby("complaint")["labor_hours_billed"].mean()
        df["expected_hours"] = df["complaint"].map(complaint_avg_hours).fillna(df["labor_hours_billed"].mean())
    else:
        df["expected_hours"] = df["labor_hours_billed"].mean()
    
    # Calculate efficiency deviation based on complaint type, not overall average
    df["efficiency_deviation"] = df["labor_hours_billed"] - df["expected_hours"]
    
    # Only flag as efficiency loss if significantly over expected time (more than 20% over)
    efficiency_threshold = df["expected_hours"] * 0.2
    df["efficiency_loss"] = np.where(
        df["efficiency_deviation"] > efficiency_threshold,
        df["efficiency_deviation"] - efficiency_threshold,
        0
    )
    
    # Repeat visits within 45 days (more realistic misdiagnosis indicator)
    df["repeat_45d"] = df.duplicated(subset=["vin"], keep=False).astype(int)
    
    # Calculate days since last visit for same VIN (for internal use only, not saved to DB)
    if "service_date" in df.columns:
        df["service_date"] = pd.to_datetime(df["service_date"], errors="coerce")
        df_temp = df.sort_values(["vin", "service_date"])
        df_temp["days_since_last"] = df_temp.groupby("vin")["service_date"].diff().dt.days
        # Update repeat_45d based on actual days since last visit
        df["repeat_45d"] = np.where(df_temp["days_since_last"] <= 45, 1, 0)

    # Complaint Similarity
    if "complaint" in df.columns and not df["complaint"].isnull().all():
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(df["complaint"].fillna(""))
        similarity_matrix = cosine_similarity(tfidf_matrix)
        df["complaint_similarity"] = similarity_matrix.mean(axis=1)
    else:
        df["complaint_similarity"] = 0

    # KMeans clustering
    try:
        kmeans = KMeans(n_clusters=3, random_state=42, n_init="auto")
        df["cluster_id"] = kmeans.fit_predict(df[["efficiency_loss", "complaint_similarity"]])
    except Exception as e:
        print(f"WARNING: Clustering failed ({e}), defaulting cluster_id=0.")
        df["cluster_id"] = 0

    # Enhanced Feature Engineering for More Powerful Insights
    
    # 1. Technician Performance Features
    if "technician" in df.columns:
        # Technician efficiency by complaint type
        tech_complaint_efficiency = df.groupby(["technician", "complaint"])["labor_hours_billed"].mean().reset_index()
        tech_complaint_efficiency.columns = ["technician", "complaint", "tech_complaint_avg"]
        df = df.merge(tech_complaint_efficiency, on=["technician", "complaint"], how="left")
        
        # Technician overall efficiency
        tech_overall_efficiency = df.groupby("technician")["labor_hours_billed"].mean().reset_index()
        tech_overall_efficiency.columns = ["technician", "tech_overall_avg"]
        df = df.merge(tech_overall_efficiency, on="technician", how="left")
        
        # Technician experience (number of jobs)
        tech_experience = df.groupby("technician").size().reset_index(name="tech_job_count")
        df = df.merge(tech_experience, on="technician", how="left")
        
        # Technician specialization (most common complaint type)
        tech_specialization = df.groupby("technician")["complaint"].agg(lambda x: x.mode()[0] if len(x.mode()) > 0 else "General").reset_index()
        tech_specialization.columns = ["technician", "tech_specialization"]
        df = df.merge(tech_specialization, on="technician", how="left")
    else:
        df["tech_complaint_avg"] = df["expected_hours"]
        df["tech_overall_avg"] = df["labor_hours_billed"].mean()
        df["tech_job_count"] = 1
        df["tech_specialization"] = "General"
    
    # 2. Vehicle-Specific Features
    # Vehicle age
    df["vehicle_age"] = pd.Timestamp.now().year - df["year"]
    
    # Vehicle complexity (based on make/model patterns)
    vehicle_complexity = df.groupby(["make", "model"])["labor_hours_billed"].mean().reset_index()
    vehicle_complexity.columns = ["make", "model", "vehicle_complexity_score"]
    df = df.merge(vehicle_complexity, on=["make", "model"], how="left")
    
    # 3. Temporal Features
    if "service_date" in df.columns:
        df["service_date"] = pd.to_datetime(df["service_date"], errors="coerce")
        df["day_of_week"] = df["service_date"].dt.dayofweek
        df["month"] = df["service_date"].dt.month
        df["quarter"] = df["service_date"].dt.quarter
        df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
        
        # Seasonal patterns
        df["is_summer"] = df["month"].isin([6, 7, 8]).astype(int)
        df["is_winter"] = df["month"].isin([12, 1, 2]).astype(int)
    else:
        df["day_of_week"] = 0
        df["month"] = 1
        df["quarter"] = 1
        df["is_weekend"] = 0
        df["is_summer"] = 0
        df["is_winter"] = 0
    
    # 4. Business Context Features
    # Job complexity (based on labor hours)
    df["job_complexity"] = pd.cut(df["labor_hours_billed"], 
                                 bins=[0, 1, 2, 4, 8, 100], 
                                 labels=["Quick", "Standard", "Complex", "Major", "Overhaul"],
                                 include_lowest=True)
    
    # Revenue efficiency
    df["revenue_per_hour"] = df["invoice_total"] / df["labor_hours_billed"]
    df["revenue_per_hour"] = df["revenue_per_hour"].replace([np.inf, -np.inf], 0)
    
    # 5. Advanced Efficiency Metrics
    # Technician vs expected performance
    df["tech_vs_expected"] = df["labor_hours_billed"] - df["expected_hours"]
    df["tech_vs_expected_pct"] = (df["tech_vs_expected"] / df["expected_hours"]) * 100
    
    # Technician vs complaint average
    df["tech_vs_complaint_avg"] = df["labor_hours_billed"] - df["tech_complaint_avg"]
    df["tech_vs_complaint_pct"] = (df["tech_vs_complaint_avg"] / df["tech_complaint_avg"]) * 100
    
    # 6. Risk Scoring
    # Calculate risk factors
    risk_factors = []
    
    # Efficiency risk
    efficiency_risk = np.where(df["tech_vs_expected_pct"] > 20, 1, 0)
    risk_factors.append(efficiency_risk)
    
    # Repeat visit risk
    repeat_risk = df["repeat_45d"]
    risk_factors.append(repeat_risk)
    
    # Vehicle complexity risk
    complexity_risk = np.where(df["vehicle_complexity_score"] > df["vehicle_complexity_score"].quantile(0.8), 1, 0)
    risk_factors.append(complexity_risk)
    
    # Weekend risk
    weekend_risk = df["is_weekend"]
    risk_factors.append(weekend_risk)
    
    # Combine risk factors
    df["risk_score"] = np.sum(risk_factors, axis=0)
    df["high_risk"] = (df["risk_score"] >= 2).astype(int)

    # Enhanced Misdiagnosis Detection with Multi-Factor Analysis
    
    # Create a more sophisticated misdiagnosis score
    misdiagnosis_factors = []
    
    # Factor 1: Repeat visits (weight: 0.4)
    repeat_factor = df["repeat_45d"] * 0.4
    misdiagnosis_factors.append(repeat_factor)
    
    # Factor 2: Efficiency deviation (weight: 0.3)
    efficiency_factor = np.where(df["tech_vs_expected_pct"] > 50, 0.3, 0)
    misdiagnosis_factors.append(efficiency_factor)
    
    # Factor 3: High risk jobs (weight: 0.2)
    risk_factor = df["high_risk"] * 0.2
    misdiagnosis_factors.append(risk_factor)
    
    # Factor 4: Complaint similarity (weight: 0.1)
    similarity_factor = np.where(df["complaint_similarity"] > 0.7, 0.1, 0)
    misdiagnosis_factors.append(similarity_factor)
    
    # Calculate misdiagnosis probability (0-1 scale)
    df["misdiagnosis_probability"] = np.sum(misdiagnosis_factors, axis=0)
    df["misdiagnosis_probability"] = np.clip(df["misdiagnosis_probability"], 0, 1)
    
    # Flag as suspected misdiagnosis if probability > 0.3
    df["suspected_misdiagnosis"] = (df["misdiagnosis_probability"] > 0.3).astype(int)
    
    # Add confidence levels
    df["confidence_level"] = pd.cut(df["misdiagnosis_probability"], 
                                   bins=[0, 0.3, 0.5, 0.7, 1.0], 
                                   labels=["Low", "Medium", "High", "Very High"],
                                   include_lowest=True)

    # ===== ENHANCED DATA-DRIVEN FINANCIAL MODEL =====
    # Import the enhanced financial model
    from enhanced_financial_model import integrate_enhanced_financial_model
    
    # Apply data-driven financial calculations
    df, savings_analysis = integrate_enhanced_financial_model(df, labor_rate)
    
    # Store savings analysis for reporting
    print(f"\n=== SAVINGS ANALYSIS SUMMARY ===")
    print(f"Conservative Savings Potential: ${savings_analysis['conservative_savings']:,.0f}")
    print(f"Hour Savings Potential: {savings_analysis['hour_savings_potential']:.1f} hours")
    print(f"Comeback Improvement Potential: {savings_analysis['comeback_improvement_potential']:.1%}")
    
    # Legacy calculations for backward compatibility (replaced by data-driven model above)
    """
    OLD ASSUMPTION-BASED MODEL (REPLACED):
    
    # 1. Labor Inefficiency Loss
    df["labor_inefficiency_loss"] = df["efficiency_loss"] * labor_rate
    
    # 2. Parts Waste (assumption-based)
    estimated_parts_cost = df["invoice_total"] * 0.5  # ASSUMPTION: 50% parts
    parts_waste_factor = df["misdiagnosis_probability"] * 0.3  # ASSUMPTION: 30% waste
    df["parts_waste_loss"] = estimated_parts_cost * parts_waste_factor
    """
    
    # OLD FINANCIAL CALCULATIONS (REPLACED BY DATA-DRIVEN MODEL)
    # Keeping for reference but commented out to avoid conflicts
    """
    
    # 4. Customer Satisfaction Impact (Future Revenue Loss)
    # Calculate potential future revenue loss due to poor service
    if "repeat_45d" in df.columns and "invoice_total" in df.columns:
        # High repeat rate indicates customer dissatisfaction
        customer_satisfaction_factor = df["repeat_45d"] * 0.5  # 50% chance of losing customer
        # Average customer lifetime value (3 years × 2 visits/year × average invoice)
        avg_customer_lifetime_value = 6 * df["invoice_total"].mean()
        df["customer_satisfaction_loss"] = customer_satisfaction_factor * avg_customer_lifetime_value
    else:
        df["customer_satisfaction_loss"] = 0
    
    # 5. Warranty and Comeback Costs
    # Calculate warranty costs for jobs that need rework
    if "suspected_misdiagnosis" in df.columns and "invoice_total" in df.columns:
        # Warranty cost = full job cost for misdiagnosed jobs
        warranty_cost_factor = df["suspected_misdiagnosis"] * 1.0  # Full cost for warranty work
        df["warranty_loss"] = df["invoice_total"] * warranty_cost_factor
    else:
        df["warranty_loss"] = 0
    
    # 6. Technician Training and Supervision Costs
    # Calculate additional supervision time for inefficient technicians
    if "tech_vs_expected_pct" in df.columns and "labor_hours_billed" in df.columns:
        # Additional supervision time for jobs over 50% expected time
        supervision_factor = np.where(df["tech_vs_expected_pct"] > 50, 0.2, 0)  # 20% additional supervision
        supervision_hours = df["labor_hours_billed"] * supervision_factor
        df["supervision_loss"] = supervision_hours * labor_rate
    else:
        df["supervision_loss"] = 0
    
    # 7. Equipment and Tool Wear
    # Calculate additional wear on equipment from inefficient work
    if "labor_hours_billed" in df.columns and "expected_hours" in df.columns:
        # Equipment wear factor based on excess time
        excess_time_factor = np.maximum(0, df["labor_hours_billed"] - df["expected_hours"]) / df["expected_hours"]
        # Equipment cost per hour (estimated at 5% of labor rate)
        equipment_cost_per_hour = labor_rate * 0.05
        df["equipment_wear_loss"] = excess_time_factor * df["labor_hours_billed"] * equipment_cost_per_hour
    else:
        df["equipment_wear_loss"] = 0
    
    # 8. Administrative and Documentation Costs
    # Additional paperwork and follow-up for problematic jobs
    if "high_risk" in df.columns and "suspected_misdiagnosis" in df.columns:
        # Administrative overhead for high-risk and misdiagnosed jobs
        admin_factor = (df["high_risk"] + df["suspected_misdiagnosis"]) * 0.5  # 0.5 hours additional admin
        df["administrative_loss"] = admin_factor * (labor_rate * 0.6)  # Admin rate is 60% of labor rate
    else:
        df["administrative_loss"] = 0
    
    # 9. Insurance and Liability Costs
    # Increased insurance costs due to poor work quality
    if "suspected_misdiagnosis" in df.columns and "invoice_total" in df.columns:
        # Insurance premium increase for misdiagnosed jobs
        insurance_factor = df["suspected_misdiagnosis"] * 0.1  # 10% of job cost for insurance
        df["insurance_loss"] = df["invoice_total"] * insurance_factor
    else:
        df["insurance_loss"] = 0
    
    # 10. Reputation and Marketing Costs
    # Cost to repair reputation damage from poor service
    if "repeat_45d" in df.columns and "suspected_misdiagnosis" in df.columns:
        # Reputation damage factor
        reputation_factor = (df["repeat_45d"] + df["suspected_misdiagnosis"]) * 0.3
        # Cost to acquire new customer to replace lost one
        customer_acquisition_cost = 200  # Estimated marketing cost per customer
        df["reputation_loss"] = reputation_factor * customer_acquisition_cost
    else:
        df["reputation_loss"] = 0
    
    # Calculate Total Comprehensive Loss
    loss_components = [
        "labor_inefficiency_loss",
        "parts_waste_loss", 
        "opportunity_cost_loss",
        "customer_satisfaction_loss",
        "warranty_loss",
        "supervision_loss",
        "equipment_wear_loss",
        "administrative_loss",
        "insurance_loss",
        "reputation_loss"
    ]
    
    # Sum all loss components (OLD MODEL - REPLACED)
    # df["total_comprehensive_loss"] = df[loss_components].sum(axis=1)
    # df["estimated_loss"] = df["total_comprehensive_loss"]
    """
    
    # END OF OLD FINANCIAL MODEL - NOW USING DATA-DRIVEN MODEL
    # The estimated_loss column is set by the enhanced financial model above

    # Prepare records for Supabase
    records = df.to_dict(orient="records")
    
    # Filter columns to only include those that exist in both CSV and should be in transformed table
    # Based on the check_nulls.py output, these are the columns that exist in the table:
    schema_columns = [
        'vin', 'service_date', 'invoice_total', 'labor_hours_billed', 'odometer_reading',
        'make', 'model', 'year', 'complaint', 'customer_name', 'customer_contact',
        'diagnosis', 'recommended', 'parts_used', 'technician',
        'efficiency_deviation', 'efficiency_loss', 'estimated_loss', 'repeat_45d', 
        'complaint_similarity', 'cluster_id', 'suspected_misdiagnosis', 'shop_id'
    ]
    
    # Filter records to only include schema columns
    filtered_records = []
    for record in records:
        filtered_record = {k: v for k, v in record.items() if k in schema_columns}
        filtered_records.append(filtered_record)
    
    # Convert datetime objects to strings for JSON serialization
    for record in filtered_records:
        for key, value in record.items():
            if isinstance(value, pd.Timestamp):
                record[key] = value.isoformat()
            elif pd.isna(value):
                record[key] = None
    
    save_transformed_data(filtered_records, shop_id or SHOP_ID, batch_size)

    print("\n=== Label Distribution ===")
    print(df["suspected_misdiagnosis"].value_counts())
    
    print("\n=== Calculation Summary ===")
    print(f"Total Records: {len(df)}")
    print(f"Average Labor Hours: {df['labor_hours_billed'].mean():.2f}")
    print(f"Average Efficiency Deviation: {df['efficiency_deviation'].mean():.2f}")
    print(f"Total Efficiency Loss Hours: {df['efficiency_loss'].sum():.2f}")
    print(f"Total Estimated Loss: ${df['estimated_loss'].sum():,.2f}")
    print(f"Repeat Visits (45d): {df['repeat_45d'].sum()}")
    print(f"Suspected Misdiagnosis: {df['suspected_misdiagnosis'].sum()}")
    
    # Show top complaint types and their expected hours
    if "complaint" in df.columns:
        print("\n=== Top Complaint Types ===")
        complaint_summary = df.groupby("complaint").agg({
            "labor_hours_billed": ["count", "mean", "std"],
            "efficiency_deviation": "mean",
            "suspected_misdiagnosis": "sum"
        }).round(2)
        print(complaint_summary.head(10))

    # Generate Actionable Insights and Recommendations
    
    print("\n=== Enhanced ML Insights ===")
    
    # 1. Technician Performance Analysis
    if "technician" in df.columns:
        tech_performance = df.groupby("technician").agg({
            "tech_vs_expected_pct": "mean",
            "misdiagnosis_probability": "mean",
            "tech_job_count": "first",
            "tech_specialization": "first",
            "high_risk": "sum"
        }).round(2)
        
        print("\nTechnician Performance Analysis:")
        print(tech_performance.sort_values("misdiagnosis_probability", ascending=False))
        
        # Identify technicians needing training
        techs_needing_training = tech_performance[tech_performance["misdiagnosis_probability"] > 0.3]
        if not techs_needing_training.empty:
            print(f"\nWARNING: Technicians Needing Training: {len(techs_needing_training)}")
            for tech in techs_needing_training.index:
                print(f"  • {tech}: {techs_needing_training.loc[tech, 'misdiagnosis_probability']:.2f} misdiagnosis rate")
    
    # 2. Vehicle-Specific Insights
    vehicle_insights = df.groupby(["make", "model"]).agg({
        "misdiagnosis_probability": "mean",
        "tech_vs_expected_pct": "mean",
        "repeat_45d": "sum",
        "vehicle_complexity_score": "first"
    }).round(3)
    
    print("\nVehicle-Specific Insights:")
    problematic_vehicles = vehicle_insights[vehicle_insights["misdiagnosis_probability"] > 0.3]
    if not problematic_vehicles.empty:
        print("Problematic Vehicle Makes/Models:")
        print(problematic_vehicles.sort_values("misdiagnosis_probability", ascending=False).head(5))
    
    # 3. Temporal Patterns
    if "service_date" in df.columns:
        temporal_insights = df.groupby("day_of_week").agg({
            "misdiagnosis_probability": "mean",
            "tech_vs_expected_pct": "mean"
        }).round(3)
        
        print("\nTemporal Patterns:")
        print("Day of Week Performance:")
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for i, day in enumerate(days):
            if i in temporal_insights.index:
                print(f"  • {day}: {temporal_insights.loc[i, 'misdiagnosis_probability']:.3f} misdiagnosis rate")
    
    # 4. Risk Analysis
    risk_analysis = df.groupby("risk_score").agg({
        "misdiagnosis_probability": "mean",
        "tech_vs_expected_pct": "mean",
        "repeat_45d": "sum"
    }).round(3)
    
    print("\nRisk Analysis:")
    print("Risk Score vs Performance:")
    print(risk_analysis)
    
    # 5. Predictive Insights
    high_risk_jobs = df[df["high_risk"] == 1]
    if not high_risk_jobs.empty:
        print(f"\nHigh-Risk Jobs Identified: {len(high_risk_jobs)}")
        print("Common characteristics of high-risk jobs:")
        
        # Most common complaints in high-risk jobs
        high_risk_complaints = high_risk_jobs["complaint"].value_counts().head(3)
        print("  • Top complaints in high-risk jobs:")
        for complaint, count in high_risk_complaints.items():
            print(f"    - {complaint}: {count} cases")
        
        # Most common vehicle makes in high-risk jobs
        high_risk_makes = high_risk_jobs["make"].value_counts().head(3)
        print("  • Top vehicle makes in high-risk jobs:")
        for make, count in high_risk_makes.items():
            print(f"    - {make}: {count} cases")
    
    # 6. Actionable Recommendations
    print("\nActionable Recommendations:")
    
    # Technician recommendations
    if "technician" in df.columns and not techs_needing_training.empty:
        worst_tech = techs_needing_training["misdiagnosis_probability"].idxmax()
        worst_tech_rate = techs_needing_training.loc[worst_tech, "misdiagnosis_probability"]
        print(f"  • IMMEDIATE: Train {worst_tech} (misdiagnosis rate: {worst_tech_rate:.1%})")
    
    # Vehicle recommendations
    if not problematic_vehicles.empty:
        worst_vehicle = problematic_vehicles["misdiagnosis_probability"].idxmax()
        worst_vehicle_rate = problematic_vehicles.loc[worst_vehicle, "misdiagnosis_probability"]
        print(f"  • FOCUS: Create specialized procedures for {worst_vehicle[0]} {worst_vehicle[1]} (rate: {worst_vehicle_rate:.1%})")
    
    # Process recommendations
    if len(high_risk_jobs) > 0:
        print(f"  • PROCESS: Implement quality control checklist for {len(high_risk_jobs)} high-risk job types")
    
    # Seasonal recommendations
    if "service_date" in df.columns:
        seasonal_analysis = df.groupby("is_weekend")["misdiagnosis_probability"].mean()
        if seasonal_analysis.get(1, 0) > seasonal_analysis.get(0, 0):
            print("  • SCHEDULING: Consider reducing weekend work or adding senior technicians")
    
    # Financial impact
    total_high_risk_loss = df[df["high_risk"] == 1]["estimated_loss"].sum()
    print(f"  • FINANCIAL: High-risk jobs cost ${total_high_risk_loss:,.0f} in estimated losses")
    
    # Priority actions
    print("\nPriority Actions (by impact):")
    actions = []
    
    if "technician" in df.columns and not techs_needing_training.empty:
        worst_tech_impact = techs_needing_training["misdiagnosis_probability"].max() * 100
        actions.append(f"1. Train {worst_tech} (Impact: {worst_tech_impact:.0f}% reduction in misdiagnosis)")
    
    if not problematic_vehicles.empty:
        worst_vehicle_impact = problematic_vehicles["misdiagnosis_probability"].max() * 100
        actions.append(f"2. Specialize procedures for problematic vehicles (Impact: {worst_vehicle_impact:.0f}% reduction)")
    
    if len(high_risk_jobs) > 0:
        actions.append(f"3. Implement quality control for high-risk jobs (Impact: ${total_high_risk_loss:,.0f} potential savings)")
    
    for action in actions[:3]:  # Top 3 actions
        print(f"  {action}")

    # Comprehensive Loss Analysis and Reporting
    
    print("\n=== Comprehensive Loss Analysis ===")
    
    # OLD LOSS CALCULATION (COMMENTED OUT - USING DATA-DRIVEN MODEL NOW)
    """
    loss_components = [
        "labor_inefficiency_loss",
        "parts_waste_loss", 
        "opportunity_cost_loss",
        "customer_satisfaction_loss",
        "warranty_loss",
        "supervision_loss",
        "equipment_wear_loss",
        "administrative_loss",
        "insurance_loss",
        "reputation_loss"
    ]
    
    df["total_comprehensive_loss"] = df[loss_components].sum(axis=1)
    df["estimated_loss"] = df["total_comprehensive_loss"]
    """
    
    # Loss by technician (using new data-driven model)
    if "technician" in df.columns:
        tech_losses = df.groupby("technician")["estimated_loss"].sum().sort_values(ascending=False)
        print(f"\nLoss by Technician:")
        for tech, loss in tech_losses.head(3).items():
            print(f"   • {tech}: ${loss:,.0f}")
    
    # Loss by vehicle make (using new data-driven model)
    make_losses = df.groupby("make")["estimated_loss"].sum().sort_values(ascending=False)
    print(f"\nLoss by Vehicle Make:")
    for make, loss in make_losses.head(3).items():
        print(f"   • {make}: ${loss:,.0f}")
    
    # Actionable recommendations based on loss analysis
    print(f"\nActionable Recommendations Based on Loss Analysis:")
    print("=" * 60)
    
    recommendations = []
    
    # Data-driven recommendations based on actual patterns
    if "significant_inefficiency" in df.columns:
        top_inefficient_complaints = df[df["significant_inefficiency"] > 0]["complaint"].value_counts().head(2)
        for complaint, count in top_inefficient_complaints.items():
            complaint_loss = df[df['complaint'] == complaint]['estimated_loss'].sum()
            recommendations.append(f"• Focus on '{complaint}' efficiency (${complaint_loss:,.0f} potential impact)")
    
    # Comeback-based recommendations
    if "repeat_45d" in df.columns and df["repeat_45d"].sum() > 0:
        comeback_loss = df[df["repeat_45d"] == 1]["estimated_loss"].sum()
        recommendations.append(f"• Implement first-time fix protocols (${comeback_loss:,.0f} potential savings)")
    
    # High-confidence improvement recommendations
    if "data_confidence" in df.columns:
        high_conf_high_loss = df[(df["data_confidence"] > 0.7) & (df["estimated_loss"] > df["estimated_loss"].quantile(0.8))]
        if len(high_conf_high_loss) > 0:
            recommendations.append(f"• Target {len(high_conf_high_loss)} high-confidence improvement opportunities (${high_conf_high_loss['estimated_loss'].sum():,.0f} potential)")
    
    # Print top recommendations
    for i, rec in enumerate(recommendations[:5], 1):
        print(f"{i}. {rec}")
    
    # ROI calculation using data-driven totals
    total_potential_savings = df["estimated_loss"].sum()
    print(f"\nROI Analysis:")
    print(f"   • Total comprehensive loss: ${total_potential_savings:,.0f}")
    print(f"   • Potential savings with 70% improvement: ${total_potential_savings * 0.7:,.0f}")
    print(f"   • Investment needed for improvement: ${total_potential_savings * 0.1:,.0f} (10% of losses)")
    print(f"   • Net ROI: {((total_potential_savings * 0.7) / (total_potential_savings * 0.1) - 1) * 100:.0f}%")

def save_transformed_data(records, shop_id, batch_size):
    print(f"Saving {len(records)} transformed records to Supabase...")

    try:
        supabase.table("transformed_service_data").delete().eq("shop_id", shop_id).execute()
        print(f"Cleared existing transformed data")
    except Exception as e:
        print(f"WARNING: Could not clear existing data: {e}")

    total_inserted = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            supabase.table("transformed_service_data").insert(batch).execute()
            total_inserted += len(batch)
            print(f"SUCCESS: Inserted batch {i//batch_size + 1}: {len(batch)} records")
        except Exception as e:
            print(f"ERROR: Error inserting batch {i//batch_size + 1}: {e}")

    print(f"SUCCESS: Total records saved: {total_inserted}/{len(records)}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--shop-id", help="Specific shop ID to process")
    parser.add_argument("--batch-size", type=int, default=1000)
    parser.add_argument("--labor-rate", type=float, default=80.0, help="Hourly labor rate for calculations")
    parser.add_argument("--csv-path", default="data/service_data.csv", help="Path to CSV file to read from")
    parser.add_argument("--clear", action="store_true")
    args = parser.parse_args()

    if args.clear:
        supabase.table("transformed_service_data").delete().execute()
        print("SUCCESS: Cleared transformed data for ALL shops")

    build_transformed_service_data(args.shop_id, args.batch_size, args.labor_rate, args.csv_path)
