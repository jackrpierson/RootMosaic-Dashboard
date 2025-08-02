import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SHOP_ID = os.getenv("SHOP_ID")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test what the transformation script would read
print("🔧 Testing data loading...")
response = supabase.table("service_data").select("*").execute()

if response.data:
    df = pd.DataFrame(response.data)
    print(f"✅ Loaded {len(df)} records")
    print(f"Columns: {list(df.columns)}")
    
    # Check for NULL values in key columns
    key_columns = ['technician', 'complaint', 'diagnosis', 'recommended', 'parts_used']
    for col in key_columns:
        if col in df.columns:
            null_count = df[col].isnull().sum()
            total_count = len(df)
            print(f"{col}: {total_count - null_count}/{total_count} records have data ({null_count} NULL)")
        else:
            print(f"{col}: Column not found")
    
    # Show a few sample records
    print("\nSample records:")
    for i, record in enumerate(df.head(3).to_dict('records')):
        print(f"Record {i+1}:")
        for key, value in record.items():
            if key in key_columns:
                print(f"  {key}: {value}")
else:
    print("❌ No data found")