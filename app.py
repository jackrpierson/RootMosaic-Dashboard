import streamlit as st
import pandas as pd
import numpy as np
import os
import datetime as dt
import pathlib
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

# Load environment variables safely
env_path = pathlib.Path(__file__).parent / ".env"
if not env_path.exists():
    env_path = pathlib.Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SHOP_ID = os.getenv("SHOP_ID")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not OPENAI_API_KEY:
    st.error(f"❌ Missing required environment variables. Check your .env file at {env_path}")
    st.stop()

# Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# GPT helpers
from core.gpt_summaries import (
    generate_issue_summary,
    generate_smart_vehicle_summary,
    generate_corrective_action
)

# Load transformed data
def load_transformed_data():
    try:
        response = supabase.table("transformed_service_data").select("*").execute()
        if not response.data:
            st.warning("⚠️ No transformed data found. Please run build_transformed_service_data.py first.")
            return pd.DataFrame()
        return pd.DataFrame(response.data)
    except Exception as e:
        st.error(f"❌ Error loading transformed data: {e}")
        return pd.DataFrame()

# Page configuration
st.set_page_config(
    page_title="RootMosaic - Misdiagnosis & Efficiency Analysis",
    page_icon="🔧",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #d63384;
        text-align: center;
        margin-bottom: 2rem;
    }
    .alert-box {
        background-color: #f8d7da;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #dc3545;
        margin: 1rem 0;
    }
    .insight-box {
        background-color: #e8f4fd;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #0d6efd;
        margin: 1rem 0;
    }
    .success-box {
        background-color: #d1e7dd;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #198754;
        margin: 1rem 0;
    }
    .roadmap-box {
        background-color: #fff3cd;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #ffc107;
        margin: 1rem 0;
    }
    .metric-highlight {
        background-color: #f8f9fa;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border: 2px solid #dee2e6;
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

df = load_transformed_data()

if not df.empty:
    # Data preprocessing - use the actual column names from Supabase
    df["service_date"] = pd.to_datetime(df["service_date"], errors="coerce")
    df["year"] = df["year"].astype(int)
    df["estimated_loss"] = pd.to_numeric(df["estimated_loss"], errors="coerce").fillna(0)
    df["invoice_total"] = pd.to_numeric(df["invoice_total"], errors="coerce").fillna(0)
    df["labor_hours_billed"] = pd.to_numeric(df["labor_hours_billed"], errors="coerce").fillna(0)
    df["efficiency_deviation"] = pd.to_numeric(df["efficiency_deviation"], errors="coerce").fillna(0)
    df["efficiency_loss"] = pd.to_numeric(df["efficiency_loss"], errors="coerce").fillna(0)
    
    # Date range filter
    min_date = df["service_date"].min()
    max_date = df["service_date"].max()
    
    # Calculate a more flexible default range
    if pd.notna(max_date) and pd.notna(min_date):
        date_range_days = (max_date - min_date).days
        if date_range_days > 365:
            # If we have more than a year of data, default to last 6 months
            default_start = max_date - pd.DateOffset(months=6)
        else:
            # If less than a year, default to all available data
            default_start = min_date
    else:
        default_start = dt.datetime.today() - pd.DateOffset(months=6)

    st.sidebar.markdown("## 📅 Date Range Filter")
    st.sidebar.markdown("Select the time period to analyze:")
    
    # Add info about available data
    if pd.notna(min_date) and pd.notna(max_date):
        total_days = (max_date - min_date).days
        st.sidebar.info(f"📊 **Available Data:** {min_date.strftime('%b %Y')} to {max_date.strftime('%b %Y')} ({total_days} days)")
    
    # Quick selection buttons
    col1, col2 = st.sidebar.columns(2)
    with col1:
        if st.button("📅 Last 30 Days", use_container_width=True):
            st.session_state.date_range = "30d"
        if st.button("📅 Last 6 Months", use_container_width=True):
            st.session_state.date_range = "6m"
        if st.button("📅 Last Year", use_container_width=True):
            st.session_state.date_range = "1y"
    
    with col2:
        if st.button("📅 All Data", use_container_width=True):
            st.session_state.date_range = "all"
        if st.button("📅 Custom Range", use_container_width=True):
            st.session_state.date_range = "custom"
    
    # Initialize session state if not exists
    if 'date_range' not in st.session_state:
        st.session_state.date_range = "1y"
    
    # Handle quick selections
    if st.session_state.date_range == "30d":
        start_date = max_date - pd.DateOffset(days=30) if pd.notna(max_date) else dt.datetime.today() - pd.DateOffset(days=30)
        end_date = max_date if pd.notna(max_date) else dt.datetime.today()
    elif st.session_state.date_range == "6m":
        start_date = max_date - pd.DateOffset(months=6) if pd.notna(max_date) else dt.datetime.today() - pd.DateOffset(months=6)
        end_date = max_date if pd.notna(max_date) else dt.datetime.today()
    elif st.session_state.date_range == "1y":
        start_date = max_date - pd.DateOffset(years=1) if pd.notna(max_date) else dt.datetime.today() - pd.DateOffset(years=1)
        end_date = max_date if pd.notna(max_date) else dt.datetime.today()
    elif st.session_state.date_range == "all":
        start_date = min_date if pd.notna(min_date) else dt.datetime.today() - pd.DateOffset(years=10)
        end_date = max_date if pd.notna(max_date) else dt.datetime.today()
    else:  # custom
        # Enhanced slider with better styling
        st.sidebar.markdown("---")
        st.sidebar.markdown("**Custom Date Range:**")
        
        # Calculate slider bounds with more flexibility
        slider_min = min_date.to_pydatetime() if pd.notna(min_date) else dt.datetime.today() - dt.timedelta(days=365*5)
        slider_max = max_date.to_pydatetime() if pd.notna(max_date) else dt.datetime.today()
        
        # Use a more flexible default for custom range
        custom_default_start = max_date - pd.DateOffset(months=3) if pd.notna(max_date) else dt.datetime.today() - pd.DateOffset(months=3)
        custom_default_end = max_date if pd.notna(max_date) else dt.datetime.today()
        
    start_date, end_date = st.sidebar.slider(
        "Select Date Range",
            min_value=slider_min,
            max_value=slider_max,
            value=(custom_default_start.to_pydatetime(), custom_default_end.to_pydatetime()),
            step=dt.timedelta(days=1),
            format="MMM DD, YYYY",
            help="Drag the sliders to select your desired date range"
        )
    
    # Display selected range info
    if 'date_range' in st.session_state and st.session_state.date_range != "custom":
        selected_days = (end_date - start_date).days
        st.sidebar.success(f"✅ **Selected:** {start_date.strftime('%b %d, %Y')} to {end_date.strftime('%b %d, %Y')} ({selected_days} days)")
    else:
        selected_days = (end_date - start_date).days
        st.sidebar.success(f"✅ **Custom Range:** {start_date.strftime('%b %d, %Y')} to {end_date.strftime('%b %d, %Y')} ({selected_days} days)")
    
    # Add data summary for selected period
    df_filtered = df[(df["service_date"] >= start_date) & (df["service_date"] <= end_date)]
    records_in_period = len(df_filtered)
    total_records = len(df)
    percentage = (records_in_period / total_records * 100) if total_records > 0 else 0
    
    st.sidebar.markdown("---")
    st.sidebar.markdown(f"**📈 Data Summary:**")
    st.sidebar.markdown(f"• **Records in period:** {records_in_period:,}")
    st.sidebar.markdown(f"• **Percentage of total:** {percentage:.1f}%")
    
    if records_in_period == 0:
        st.sidebar.warning("⚠️ No data found in selected period")
    elif records_in_period < 10:
        st.sidebar.warning("⚠️ Limited data in selected period")
    elif percentage < 20:
        st.sidebar.info("ℹ️ Small sample size - consider expanding date range")

    # Interactive Filters Section
    st.sidebar.markdown("---")
    st.sidebar.markdown("**🔍 Interactive Filters**")
    
    # Technician Filter
    if "technician" in df_filtered.columns:
        all_technicians = ["All Technicians"] + sorted(df_filtered["technician"].unique().tolist())
        selected_technicians = st.sidebar.multiselect(
            "👨‍🔧 Filter by Technician:",
            all_technicians,
            default=["All Technicians"]
        )
        
        if "All Technicians" not in selected_technicians:
            df_filtered = df_filtered[df_filtered["technician"].isin(selected_technicians)]
    
    # Vehicle Make Filter
    if "make" in df_filtered.columns:
        all_makes = ["All Makes"] + sorted(df_filtered["make"].unique().tolist())
        selected_makes = st.sidebar.multiselect(
            "🚗 Filter by Vehicle Make:",
            all_makes,
            default=["All Makes"]
        )
        
        if "All Makes" not in selected_makes:
            df_filtered = df_filtered[df_filtered["make"].isin(selected_makes)]
    
    # Complaint Type Filter
    if "complaint" in df_filtered.columns:
        all_complaints = ["All Complaints"] + sorted(df_filtered["complaint"].unique().tolist())
        selected_complaints = st.sidebar.multiselect(
            "🔧 Filter by Complaint Type:",
            all_complaints,
            default=["All Complaints"]
        )
        
        if "All Complaints" not in selected_complaints:
            df_filtered = df_filtered[df_filtered["complaint"].isin(selected_complaints)]
    
    # Loss Threshold Filter
    st.sidebar.markdown("**💰 Loss Threshold Filter**")
    min_loss_threshold = st.sidebar.slider(
        "Minimum Loss Amount ($):",
        min_value=0,
        max_value=int(df["estimated_loss"].max()) if len(df) > 0 else 1000,
        value=0,
        step=100
    )
    
    if min_loss_threshold > 0:
        df_filtered = df_filtered[df_filtered["estimated_loss"] >= min_loss_threshold]
    
    # Update records count after filtering
    records_after_filter = len(df_filtered)
    st.sidebar.markdown(f"**📊 Filtered Records:** {records_after_filter:,}")

    # Main dashboard
    st.markdown('<h1 class="main-header">🔧 RootMosaic - Misdiagnosis & Efficiency Analysis</h1>', unsafe_allow_html=True)
    st.markdown("### *AI-Powered Detection of Mechanical Misdiagnosis & Technician Inefficiency*")
    
    # Add calculation explanation
    with st.expander("📊 How These Numbers Are Calculated"):
        st.markdown("""
        **🔍 Calculation Methodology:**
        
        **Efficiency Loss:**
        - Compares actual labor hours to expected hours for each complaint type
        - Only flags jobs that took 20%+ longer than expected
        - Uses $80/hour labor rate (configurable)
        
        **Misdiagnosis Detection:**
        - Vehicles returning within 45 days with similar complaints
        - Jobs taking 50%+ longer than expected for that complaint type
        - High similarity to other complaints (potential pattern issues)
        
        **Estimated Loss:**
        - Efficiency Loss Hours × Labor Rate ($80/hour)
        - Only includes jobs significantly over expected time
        
        **Potential Savings:**
        - Total of efficiency losses and misdiagnosis-related costs
        - Assumes 70% of issues can be resolved with proper training/processes
        """)
    
    # Enhanced Executive Summary Metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        total_misdiagnosis = len(df_filtered[df_filtered["suspected_misdiagnosis"] == 1])
        misdiagnosis_rate = (total_misdiagnosis / len(df_filtered)) * 100 if len(df_filtered) > 0 else 0
        st.markdown(f"""
        <div class="metric-highlight">
            <h3>🚨 Misdiagnosis Rate</h3>
            <h2 style="color: #dc3545;">{misdiagnosis_rate:.1f}%</h2>
            <p>{total_misdiagnosis} cases detected</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        total_efficiency_loss = df_filtered["efficiency_loss"].sum()
        st.markdown(f"""
        <div class="metric-highlight">
            <h3>⏱️ Efficiency Loss</h3>
            <h2 style="color: #fd7e14;">${total_efficiency_loss:,.2f}</h2>
            <p>Lost due to inefficiency</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        total_estimated_loss = df_filtered["estimated_loss"].sum()
        st.markdown(f"""
        <div class="metric-highlight">
            <h3>💰 Total Estimated Loss</h3>
            <h2 style="color: #dc3545;">${total_estimated_loss:,.2f}</h2>
            <p>Combined impact</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        potential_savings = total_estimated_loss + total_efficiency_loss
        st.markdown(f"""
        <div class="metric-highlight">
            <h3>🎯 Potential Savings</h3>
            <h2 style="color: #198754;">${potential_savings:,.2f}</h2>
            <p>With corrective action</p>
        </div>
        """, unsafe_allow_html=True)

    # Enhanced KPI Metrics
    st.markdown("## 📊 Enhanced Performance Metrics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        # First-time fix rate
        total_jobs = len(df_filtered)
        repeat_jobs = df_filtered["repeat_45d"].sum()
        first_time_fix_rate = ((total_jobs - repeat_jobs) / total_jobs * 100) if total_jobs > 0 else 0
        st.metric(
            label="🎯 First-Time Fix Rate",
            value=f"{first_time_fix_rate:.1f}%",
            delta=f"{first_time_fix_rate - 85:.1f}%" if first_time_fix_rate > 0 else None,
            delta_color="normal" if first_time_fix_rate >= 85 else "inverse"
        )
    
    with col2:
        # Revenue per hour
        total_revenue = df_filtered["invoice_total"].sum()
        total_hours = df_filtered["labor_hours_billed"].sum()
        revenue_per_hour = total_revenue / total_hours if total_hours > 0 else 0
        st.metric(
            label="💵 Revenue per Hour",
            value=f"${revenue_per_hour:.0f}",
            delta=f"${revenue_per_hour - 120:.0f}" if revenue_per_hour > 0 else None,
            delta_color="normal" if revenue_per_hour >= 120 else "inverse"
        )
    
    with col3:
        # Technician productivity index
        avg_efficiency = df_filtered["efficiency_deviation"].mean()
        productivity_index = max(0, 100 - (avg_efficiency * 20))  # Convert to 0-100 scale
        st.metric(
            label="👨‍🔧 Productivity Index",
            value=f"{productivity_index:.0f}%",
            delta=f"{productivity_index - 80:.0f}%" if productivity_index > 0 else None,
            delta_color="normal" if productivity_index >= 80 else "inverse"
        )
    
    with col4:
        # Customer satisfaction score (based on repeat visits)
        satisfaction_score = max(0, 100 - (repeat_jobs / total_jobs * 100)) if total_jobs > 0 else 0
        st.metric(
            label="😊 Customer Satisfaction",
            value=f"{satisfaction_score:.0f}%",
            delta=f"{satisfaction_score - 90:.0f}%" if satisfaction_score > 0 else None,
            delta_color="normal" if satisfaction_score >= 90 else "inverse"
        )

    # Financial Impact Calculator
    st.markdown("## 💰 Financial Impact Calculator")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**📈 Investment Calculator**")
        
        # Training investment
        training_cost = st.number_input(
            "Training Investment ($):",
            min_value=0,
            max_value=50000,
            value=5000,
            step=500
        )
        
        # Equipment investment
        equipment_cost = st.number_input(
            "Equipment Investment ($):",
            min_value=0,
            max_value=100000,
            value=10000,
            step=1000
        )
        
        # Process improvement investment
        process_cost = st.number_input(
            "Process Improvement ($):",
            min_value=0,
            max_value=25000,
            value=5000,
            step=500
        )
        
        total_investment = training_cost + equipment_cost + process_cost
        
        # Calculate ROI
        annual_savings = potential_savings * 12  # Monthly to annual
        roi_percentage = ((annual_savings - total_investment) / total_investment * 100) if total_investment > 0 else 0
        payback_months = (total_investment / (potential_savings * 12)) if potential_savings > 0 else 0
        
        st.markdown(f"""
        **Investment Summary:**
        - **Total Investment:** ${total_investment:,.0f}
        - **Annual Savings:** ${annual_savings:,.0f}
        - **ROI:** {roi_percentage:.0f}%
        - **Payback Period:** {payback_months:.1f} months
        """)
    
    with col2:
        st.markdown("**🎯 Break-Even Analysis**")
        
        # Break-even calculator
        current_monthly_loss = total_estimated_loss
        improvement_percentage = st.slider(
            "Expected Improvement (%):",
            min_value=10,
            max_value=90,
            value=70,
            step=5
        )
        
        monthly_savings = current_monthly_loss * (improvement_percentage / 100)
        annual_savings_improved = monthly_savings * 12
        
        # Calculate break-even scenarios
        break_even_training = training_cost / monthly_savings if monthly_savings > 0 else 0
        break_even_equipment = equipment_cost / monthly_savings if monthly_savings > 0 else 0
        break_even_total = total_investment / monthly_savings if monthly_savings > 0 else 0
        
        st.markdown(f"""
        **Break-Even Analysis:**
        - **Monthly Savings:** ${monthly_savings:,.0f}
        - **Training Payback:** {break_even_training:.1f} months
        - **Equipment Payback:** {break_even_equipment:.1f} months
        - **Total Payback:** {break_even_total:.1f} months
        """)
        
        # ROI recommendation
        if roi_percentage > 200:
            st.success("🚀 **Excellent ROI!** Strong case for investment.")
        elif roi_percentage > 100:
            st.info("✅ **Good ROI!** Investment recommended.")
        elif roi_percentage > 50:
            st.warning("⚠️ **Moderate ROI.** Consider phased approach.")
        else:
            st.error("❌ **Low ROI.** Focus on high-impact, low-cost improvements first.")

    # Predictive Analytics Section
    st.markdown("## 🔮 Predictive Analytics & ML Insights")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**🎯 Risk Prediction**")
        
        # Calculate risk factors for current data
        if len(df_filtered) > 0:
            # High-risk job prediction
            high_risk_jobs = df_filtered[df_filtered["suspected_misdiagnosis"] == 1]
            risk_percentage = (len(high_risk_jobs) / len(df_filtered) * 100) if len(df_filtered) > 0 else 0
            
            # Predict future misdiagnosis risk
            avg_misdiagnosis_rate = df_filtered["suspected_misdiagnosis"].mean() * 100
            predicted_risk = avg_misdiagnosis_rate * 1.1  # 10% increase prediction
            
            st.metric(
                label="Current Misdiagnosis Risk",
                value=f"{risk_percentage:.1f}%",
                delta=f"{predicted_risk - risk_percentage:.1f}%",
                delta_color="inverse"
            )
            
            # Risk factors analysis
            st.markdown("**Top Risk Factors:**")
            if "technician" in df_filtered.columns:
                tech_risk = df_filtered.groupby("technician")["suspected_misdiagnosis"].mean().sort_values(ascending=False)
                for tech, risk in tech_risk.head(3).items():
                    st.markdown(f"• **{tech}**: {risk*100:.1f}% misdiagnosis rate")
    
    with col2:
        st.markdown("**📊 Performance Forecasting**")
        
        # Performance trend prediction
        if len(df_filtered) > 10:
            # Calculate trend
            recent_data = df_filtered.tail(10)
            older_data = df_filtered.head(10)
            
            recent_efficiency = recent_data["efficiency_deviation"].mean()
            older_efficiency = older_data["efficiency_deviation"].mean()
            
            efficiency_trend = recent_efficiency - older_efficiency
            
            st.metric(
                label="Efficiency Trend",
                value=f"{recent_efficiency:.2f} hours",
                delta=f"{efficiency_trend:.2f} hours",
                delta_color="normal" if efficiency_trend < 0 else "inverse"
            )
            
            # Predict next month performance
            if efficiency_trend < 0:
                st.success("📈 **Improving Trend** - Performance getting better!")
            else:
                st.warning("📉 **Declining Trend** - Immediate action needed!")
            
            # Predictive recommendations
            st.markdown("**🤖 AI Recommendations:**")
            if efficiency_trend > 0.5:
                st.markdown("• **Immediate:** Schedule technician training")
                st.markdown("• **Short-term:** Implement quality control checklist")
                st.markdown("• **Long-term:** Consider equipment upgrades")
            elif efficiency_trend > 0:
                st.markdown("• **Monitor:** Keep current processes")
                st.markdown("• **Optimize:** Fine-tune existing procedures")
            else:
                st.markdown("• **Maintain:** Current processes working well")
                st.markdown("• **Scale:** Consider expanding successful methods")

    # Critical Alerts Section
    st.markdown("## 🚨 Critical Alerts & Systemic Issues")
    
    # Misdiagnosis Analysis
    misdiagnosis_data = df_filtered[df_filtered["suspected_misdiagnosis"] == 1]
    
    if not misdiagnosis_data.empty:
        col1, col2 = st.columns(2)
        
        st.markdown(f"""
        <div class="alert-box">
            <h4>⚠️ HIGH PRIORITY: Misdiagnosis Detection</h4>
            <p><strong>Impact:</strong> ${misdiagnosis_data['estimated_loss'].sum():,.2f} in potential losses</p>
            <p><strong>Frequency:</strong> {len(misdiagnosis_data)} cases ({misdiagnosis_rate:.1f}% of all service records)</p>
            <p><strong>Risk Level:</strong> {'🔴 CRITICAL' if misdiagnosis_rate > 5 else '🟡 MODERATE' if misdiagnosis_rate > 2 else '🟢 LOW'}</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Top misdiagnosed issues summary
        top_misdiagnosis = misdiagnosis_data['complaint'].value_counts().head(3)
        st.markdown("**Top 3 Misdiagnosed Issues:**")
        for i, (complaint, count) in enumerate(top_misdiagnosis.items(), 1):
            st.markdown(f"{i}. **{complaint}**: {count} cases")
        
        # Technician misdiagnosis summary
        tech_misdiagnosis = misdiagnosis_data.groupby('technician').agg({
            'estimated_loss': 'sum',
            'complaint': 'count'
        }).reset_index()
        tech_misdiagnosis.columns = ['Technician', 'Total_Loss', 'Case_Count']
        tech_misdiagnosis['Avg_Loss_Per_Case'] = tech_misdiagnosis['Total_Loss'] / tech_misdiagnosis['Case_Count']
        
        st.markdown("**Technicians with Misdiagnosis Issues:**")
        for _, tech in tech_misdiagnosis.head(3).iterrows():
            st.markdown(f"• **{tech['Technician']}**: {tech['Case_Count']} cases, ${tech['Total_Loss']:,.0f} total loss")
    else:
        st.success("✅ No suspected misdiagnoses detected in the selected date range.")

    # Technician Efficiency Analysis
    st.markdown("## 👨‍🔧 Technician Efficiency & Performance Analysis")
    
    # Efficiency deviation analysis
    efficiency_analysis = df_filtered.groupby('technician').agg({
        'efficiency_deviation': 'mean',
        'efficiency_loss': 'sum',
        'labor_hours_billed': 'sum',
        'invoice_total': 'sum',
        'estimated_loss': 'sum'
    }).reset_index()
    
    efficiency_analysis['Revenue_per_Hour'] = efficiency_analysis['invoice_total'] / efficiency_analysis['labor_hours_billed']
    efficiency_analysis['Total_Loss_Rate'] = (efficiency_analysis['estimated_loss'] + efficiency_analysis['efficiency_loss']) / efficiency_analysis['invoice_total'] * 100
    
    # Identify inefficient technicians
    inefficient_techs = efficiency_analysis[efficiency_analysis['efficiency_deviation'] > 0.5]
    
    if not inefficient_techs.empty:
        st.markdown(f"""
        <div class="alert-box">
            <h4>⚠️ Technician Efficiency Issues Detected</h4>
            <p><strong>Inefficient Technicians:</strong> {len(inefficient_techs)} out of {len(efficiency_analysis)}</p>
            <p><strong>Total Efficiency Loss:</strong> ${inefficient_techs['efficiency_loss'].sum():,.2f}</p>
            <p><strong>Average Deviation:</strong> {inefficient_techs['efficiency_deviation'].mean():.2f} hours</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Top inefficient technicians summary
        st.markdown("**Top 3 Inefficient Technicians:**")
        for _, tech in inefficient_techs.head(3).iterrows():
            st.markdown(f"• **{tech['technician']}**: {tech['efficiency_deviation']:.2f} hours deviation, ${tech['efficiency_loss']:,.0f} loss")
    else:
        st.success("✅ All technicians are performing within acceptable efficiency ranges.")

    # Systemic Problem Detection
    st.markdown("## 🔍 Systemic Problem Detection & Root Cause Analysis")
    
    # Vehicle-specific issues
    vehicle_issues = df_filtered.groupby(['make', 'model', 'year']).agg({
        'estimated_loss': 'sum',
        'efficiency_loss': 'sum',
        'suspected_misdiagnosis': 'sum',
        'complaint': 'count',
        'repeat_45d': 'sum'
    }).reset_index()
    
    vehicle_issues['Total_Impact'] = vehicle_issues['estimated_loss'] + vehicle_issues['efficiency_loss']
    vehicle_issues['Vehicle'] = vehicle_issues['year'].astype(str) + ' ' + vehicle_issues['make'] + ' ' + vehicle_issues['model']
    
    # Top problematic vehicles
    top_problematic = vehicle_issues.nlargest(5, 'Total_Impact')
    
    st.markdown("**Top 5 Most Problematic Vehicles:**")
    for i, (_, vehicle) in enumerate(top_problematic.iterrows(), 1):
        st.markdown(f"{i}. **{vehicle['Vehicle']}**: ${vehicle['Total_Impact']:,.0f} total impact")
    
    # Repeat issues analysis
    repeat_issues = df_filtered[df_filtered['repeat_45d'] == 1]
    if not repeat_issues.empty:
        repeat_complaints = repeat_issues['complaint'].value_counts().head(5)
        st.markdown("**Top 5 Repeat Issues (Within 45 Days):**")
        for i, (complaint, count) in enumerate(repeat_complaints.items(), 1):
            st.markdown(f"{i}. **{complaint}**: {count} repeat cases")
    else:
        st.info("No repeat issues found within 45 days in the selected date range.")

    # Actionable Insights & Recommendations
    st.markdown("## 💡 Actionable Insights & Strategic Recommendations")
    
    # Calculate key insights
    total_customers = df_filtered['customer_name'].nunique()
    avg_repair_cost = df_filtered['invoice_total'].mean()
    most_problematic_make = vehicle_issues.loc[vehicle_issues['Total_Impact'].idxmax(), 'make'] if not vehicle_issues.empty else "N/A"
    worst_technician = efficiency_analysis.loc[efficiency_analysis['efficiency_deviation'].idxmax(), 'technician'] if not efficiency_analysis.empty else "N/A"
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown(f"""
        <div class="insight-box">
            <h4>🎯 Key Performance Insights</h4>
            <ul>
                <li><strong>Customer Base:</strong> {total_customers} unique customers affected</li>
                <li><strong>Average Repair Cost:</strong> ${avg_repair_cost:.2f}</li>
                <li><strong>Most Problematic Make:</strong> {most_problematic_make}</li>
                <li><strong>Technician Needing Training:</strong> {worst_technician}</li>
                <li><strong>Potential Annual Savings:</strong> ${potential_savings * 12:,.2f}</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="insight-box">
            <h4>🚀 Immediate Action Items</h4>
            <ol>
                <li><strong>Train {worst_technician}</strong> on diagnostic procedures</li>
                <li><strong>Implement quality control</strong> for {most_problematic_make} vehicles</li>
                <li><strong>Review diagnostic protocols</strong> for repeat issues</li>
                <li><strong>Establish technician mentoring</strong> program</li>
                <li><strong>Create preventive maintenance</strong> schedules</li>
            </ol>
        </div>
        """, unsafe_allow_html=True)

    # Implementation Roadmap
    st.markdown("## 🗺️ Implementation Roadmap & Expected Outcomes")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown(f"""
        <div class="roadmap-box">
            <h4>📋 Phase 1: Immediate Actions (Week 1-2)</h4>
            <ul>
                <li>🔧 Review all {len(misdiagnosis_data)} misdiagnosis cases</li>
                <li>👨‍🔧 Schedule training for {worst_technician}</li>
                <li>📊 Implement diagnostic checklist system</li>
                <li>💰 Expected Savings: ${potential_savings * 0.1:,.2f}</li>
            </ul>
        </div>
        
        <div class="roadmap-box">
            <h4>📋 Phase 2: Process Improvement (Month 1-2)</h4>
            <ul>
                <li>🎓 Complete technician training program</li>
                <li>🔍 Implement quality control procedures</li>
                <li>📈 Establish performance monitoring</li>
                <li>💰 Expected Savings: ${potential_savings * 0.3:,.2f}</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="roadmap-box">
            <h4>📋 Phase 3: Systemic Changes (Month 3-6)</h4>
            <ul>
                <li>🏗️ Redesign diagnostic workflows</li>
                <li>🤝 Implement technician mentoring</li>
                <li>📱 Deploy digital diagnostic tools</li>
                <li>💰 Expected Savings: ${potential_savings * 0.5:,.2f}</li>
            </ul>
        </div>
        
        <div class="roadmap-box">
            <h4>📋 Phase 4: Optimization (Month 6-12)</h4>
            <ul>
                <li>📊 Advanced analytics integration</li>
                <li>🎯 Predictive maintenance systems</li>
                <li>🌟 Continuous improvement culture</li>
                <li>💰 Expected Savings: ${potential_savings:,.2f}</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)

    # Detailed Systemic Issues Analysis
    st.markdown("## 🔍 Detailed Systemic Issues Analysis")
    
    if "complaint" in df_filtered.columns:
        # Group by vehicle and analyze patterns
        vehicle_groups = df_filtered.groupby(["make", "model", "year"])
        
        # Create a more sophisticated analysis
        systemic_issues = []
        for (make, model, year), group in vehicle_groups:
            if len(group) >= 2:  # Only vehicles with multiple visits
            complaints = group["complaint"].dropna().tolist()
                total_loss = group["estimated_loss"].sum()
                efficiency_loss = group["efficiency_loss"].sum()
                misdiagnosis_count = group["suspected_misdiagnosis"].sum()
                avg_repair_cost = group["invoice_total"].mean()
                visit_frequency = len(group) / ((group["service_date"].max() - group["service_date"].min()).days / 365)
                
                if total_loss > 0 or efficiency_loss > 0 or misdiagnosis_count > 0:
                    systemic_issues.append({
                        'make': make,
                        'model': model,
                        'year': year,
                        'total_loss': total_loss,
                        'efficiency_loss': efficiency_loss,
                        'misdiagnosis_count': misdiagnosis_count,
                        'avg_repair_cost': avg_repair_cost,
                        'visit_frequency': visit_frequency,
                        'complaints': complaints
                    })
        
        # Sort by total impact
        systemic_issues.sort(key=lambda x: x['total_loss'] + x['efficiency_loss'], reverse=True)
        
        # Display top systemic issues
        for i, issue in enumerate(systemic_issues[:5]):
            total_impact = issue['total_loss'] + issue['efficiency_loss']
            issue_title = f"{issue['year']} {issue['make']} {issue['model']}: ${total_impact:,.2f} total impact"
            
            with st.expander(issue_title):
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown(f"""
                    **Financial Impact Breakdown:**
                    - Estimated Loss: ${issue['total_loss']:,.2f}
                    - Efficiency Loss: ${issue['efficiency_loss']:,.2f}
                    - Misdiagnosis Cases: {issue['misdiagnosis_count']}
                    - Average Repair Cost: ${issue['avg_repair_cost']:,.2f}
                    - Visit Frequency: {issue['visit_frequency']:.1f} visits/year
                    """)
                
                with col2:
                    st.markdown("**Common Complaints:**")
                    complaint_counts = Counter(issue['complaints'])
                    for complaint, count in complaint_counts.most_common(3):
                        st.write(f"• {complaint} ({count} times)")
                
                # Generate AI insights
                try:
                    ai_summary = generate_smart_vehicle_summary(issue['make'], issue['model'], issue['year'], issue['complaints'])
                    st.markdown("**AI Analysis:**")
                    st.info(ai_summary)
                    
                    corrective_action = generate_corrective_action(issue['make'], issue['model'], issue['year'], issue['complaints'])
                    st.markdown("**Recommended Action:**")
                    st.success(corrective_action)
                except:
                    st.warning("AI analysis temporarily unavailable")

else:
    st.warning("⚠️ No data available. Please seed and transform service records first.")
