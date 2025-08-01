import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env vars
load_dotenv(".env")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SHOP_ID = os.getenv("SHOP_ID", "dev_shop_001")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load CSV
df = pd.read_csv("data/service_data.csv")

# Handle combined name/contact field if present
if "Customer name and contact info" in df.columns:
    split_cols = df["Customer name and contact info"].str.split("|", n=1, expand=True)
    df["customer_name"] = split_cols[0].str.strip()
    df["customer_contact"] = split_cols[1].str.strip() if split_cols.shape[1] > 1 else None
    df = df.drop(columns=["Customer name and contact info"])

# Standardize column names
column_mapping = {
    "VIN": "vin",
    "Date": "service_date",
    "Odometer reading": "odometer_reading",
    "Complaint": "complaint",
    "Diagnosis": "diagnosis",
    "Recommended": "recommended",
    "ServicePerformed": "service_performed",  # <-- fix here
    "Service performed": "service_performed", # <-- also add this in case CSV uses space
    "Parts used": "parts_used",
    "Labor hours billed": "labor_hours_billed",
    "Technician": "technician",
    "Invoice total": "invoice_total",
    "Make": "make",
    "Model": "model",
    "Year": "year",
}

df = df.rename(columns=column_mapping)

# Add shop_id
df["shop_id"] = SHOP_ID

# Replace NaN with None for Supabase compatibility
df = df.where(pd.notnull(df), None)

# Convert to dict records
records = df.to_dict(orient="records")

# Insert into Supabase in batches
batch_size = 500
for i in range(0, len(records), batch_size):
    batch = records[i:i+batch_size]
    try:
        supabase.table("service_data").insert(batch).execute()
        print(f"✅ Inserted batch {i//batch_size + 1}: {len(batch)} records")
    except Exception as e:
        print(f"❌ Failed batch {i//batch_size + 1}: {e}")
