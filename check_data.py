import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Check what's in service_data
response = supabase.table("service_data").select("*").limit(1).execute()
if response.data:
    print("Columns in service_data:")
    for key in response.data[0].keys():
        print(f"  - {key}")
    print(f"\nSample record:")
    print(response.data[0])
else:
    print("No data in service_data table")