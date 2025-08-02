import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Check what's in transformed_service_data
print("🔧 Checking transformed_service_data table...")
response = supabase.table("transformed_service_data").select("*").limit(1).execute()

if response.data:
    print(f"✅ Found data in transformed_service_data")
    print("Columns in transformed_service_data:")
    for key in response.data[0].keys():
        print(f"  - {key}")
    print(f"\nSample record:")
    for key, value in response.data[0].items():
        print(f"  {key}: {value}")
else:
    print("❌ No data in transformed_service_data table")