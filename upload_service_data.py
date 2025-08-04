import os
import pathlib
import pandas as pd
import numpy as np
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
env_path = pathlib.Path(__file__).parent / ".env"
if not env_path.exists():
    env_path = pathlib.Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SHOP_ID = os.getenv("SHOP_ID")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_and_upload_csv(csv_path, batch_size=100, clear_existing=True):
    """
    Clean and upload CSV data to Supabase service_data table
    """
    print(f"Loading CSV from: {csv_path}")
    
    # Read CSV
    try:
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} records from CSV")
    except Exception as e:
        print(f"ERROR loading CSV: {e}")
        return
    
    print(f"Original columns: {list(df.columns)}")
    
    # Clean the data
    print("Cleaning data...")
    
    # 1. Fix date columns
    date_columns = ['service_date', 'created_at']
    for col in date_columns:
        if col in df.columns:
            # Handle various date formats
            df[col] = pd.to_datetime(df[col], errors='coerce')
            # Convert to ISO string format for JSON serialization
            df[col] = df[col].dt.strftime('%Y-%m-%d')
    
    # 2. Fix numeric columns
    numeric_columns = ['odometer_reading', 'labor_hours_billed', 'invoice_total', 'year']
    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            # Replace NaN with appropriate defaults
            if col == 'year':
                df[col] = df[col].fillna(2020).astype(int)
            else:
                df[col] = df[col].fillna(0)
    
    # 3. Clean text columns
    text_columns = ['vin', 'customer_name', 'customer_contact', 'complaint', 'diagnosis', 
                   'recommended', 'service_performed', 'parts_used', 'technician', 'make', 'model', 'shop_id']
    for col in text_columns:
        if col in df.columns:
            # Replace 'nan' strings and NaN values with None for proper NULL handling
            df[col] = df[col].astype(str)
            df[col] = df[col].replace(['nan', 'NaN', 'null', ''], None)
    
    # 4. Ensure shop_id is set
    if 'shop_id' not in df.columns or df['shop_id'].isna().all():
        df['shop_id'] = SHOP_ID
        print(f"Set shop_id to: {SHOP_ID}")
    
    # 5. Remove any completely empty rows
    df = df.dropna(how='all')
    
    print(f"Cleaned data: {len(df)} records")
    print(f"Sample record after cleaning:")
    print(df.iloc[0].to_dict())
    
    # Clear existing data if requested
    if clear_existing:
        try:
            print(f"Clearing existing service_data for shop_id: {SHOP_ID}")
            supabase.table("service_data").delete().eq("shop_id", SHOP_ID).execute()
            print("Successfully cleared existing data")
        except Exception as e:
            print(f"WARNING: Could not clear existing data: {e}")
    
    # Convert DataFrame to records
    records = df.to_dict(orient='records')
    
    # Upload in batches
    total_uploaded = 0
    total_errors = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        
        try:
            print(f"Uploading batch {batch_num}: {len(batch)} records...")
            response = supabase.table("service_data").insert(batch).execute()
            total_uploaded += len(batch)
            print(f"SUCCESS: Batch {batch_num} uploaded")
            
        except Exception as e:
            print(f"ERROR in batch {batch_num}: {e}")
            total_errors += len(batch)
            
            # Try individual records in failed batch
            print(f"Trying individual records in batch {batch_num}...")
            for j, record in enumerate(batch):
                try:
                    supabase.table("service_data").insert([record]).execute()
                    total_uploaded += 1
                except Exception as record_error:
                    print(f"  Record {j+1} failed: {record_error}")
                    print(f"  Failed record: {record}")
                    total_errors += 1
    
    print(f"\n=== UPLOAD SUMMARY ===")
    print(f"Total records processed: {len(records)}")
    print(f"Successfully uploaded: {total_uploaded}")
    print(f"Failed uploads: {total_errors}")
    print(f"Success rate: {(total_uploaded/len(records)*100):.1f}%")
    
    if total_uploaded > 0:
        print(f"\nVerifying upload...")
        try:
            response = supabase.table("service_data").select("*").eq("shop_id", SHOP_ID).limit(5).execute()
            print(f"Verification: Found {len(response.data)} records in database")
        except Exception as e:
            print(f"Verification failed: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Upload service_data.csv to Supabase")
    parser.add_argument("--csv", default="data/service_data.csv", help="Path to CSV file")
    parser.add_argument("--batch-size", type=int, default=100, help="Batch size for uploads")
    parser.add_argument("--keep-existing", action="store_true", help="Don't clear existing data")
    args = parser.parse_args()
    
    csv_path = pathlib.Path(args.csv)
    if not csv_path.exists():
        print(f"ERROR: CSV file not found: {csv_path}")
        exit(1)
    
    clean_and_upload_csv(csv_path, args.batch_size, not args.keep_existing)