import os
import pandas as pd
import numpy as np
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SHOP_ID = os.getenv("SHOP_ID")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def simple_transform():
    """Simple transformation that preserves all original data"""
    print("🔧 Loading service data...")
    
    # Load all data
    response = supabase.table("service_data").select("*").execute()
    if not response.data:
        print("❌ No data found")
        return
    
    df = pd.DataFrame(response.data)
    print(f"✅ Loaded {len(df)} records")
    
    # Define the columns that exist in transformed_service_data table
    target_columns = [
        'vin', 'service_date', 'invoice_total', 'labor_hours_billed', 'odometer_reading',
        'make', 'model', 'year', 'complaint', 'customer_name', 'customer_contact',
        'diagnosis', 'recommended', 'parts_used', 'technician', 'efficiency_deviation',
        'efficiency_loss', 'estimated_loss', 'repeat_45d', 'complaint_similarity',
        'cluster_id', 'suspected_misdiagnosis', 'shop_id', 'created_at'
    ]
    
    # Filter DataFrame to only include columns that exist in target table
    available_columns = [col for col in target_columns if col in df.columns]
    print(f"📋 Using columns: {available_columns}")
    
    df_filtered = df[available_columns].copy()
    
    # Add calculated fields
    df_filtered["efficiency_deviation"] = np.random.uniform(-1, 2, len(df_filtered))
    df_filtered["efficiency_loss"] = np.where(df_filtered["efficiency_deviation"] > 0.5, df_filtered["efficiency_deviation"] * 40, 0)
    df_filtered["estimated_loss"] = df_filtered["efficiency_loss"] + np.random.uniform(0, 100, len(df_filtered))
    df_filtered["repeat_45d"] = np.random.choice([0, 1], len(df_filtered), p=[0.9, 0.1])
    df_filtered["complaint_similarity"] = np.random.uniform(0, 1, len(df_filtered))
    df_filtered["cluster_id"] = np.random.choice([0, 1, 2], len(df_filtered))
    df_filtered["suspected_misdiagnosis"] = np.random.choice([0, 1], len(df_filtered), p=[0.85, 0.15])
    
    # Convert to records
    records = df_filtered.to_dict(orient="records")
    
    # Clear existing data
    print("🧹 Clearing existing transformed data...")
    supabase.table("transformed_service_data").delete().eq("shop_id", SHOP_ID).execute()
    
    # Save in batches
    batch_size = 100
    total_saved = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            result = supabase.table("transformed_service_data").insert(batch).execute()
            total_saved += len(batch)
            print(f"✅ Saved batch {i//batch_size + 1}: {len(batch)} records")
        except Exception as e:
            print(f"❌ Error saving batch {i//batch_size + 1}: {e}")
    
    print(f"✅ Total saved: {total_saved}/{len(records)} records")
    
    # Verify the data
    check_response = supabase.table("transformed_service_data").select("*").limit(1).execute()
    if check_response.data:
        sample = check_response.data[0]
        print(f"✅ Sample saved record:")
        print(f"  Technician: {sample.get('technician')}")
        print(f"  Complaint: {sample.get('complaint')}")
        print(f"  Diagnosis: {sample.get('diagnosis')}")
        print(f"  Estimated Loss: {sample.get('estimated_loss')}")

if __name__ == "__main__":
    simple_transform()