import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_table_schema():
    """Check the schema of service_data table"""
    print("🔍 Checking service_data table schema...")
    
    try:
        # Get table info
        response = supabase.table("service_data").select("*").limit(1).execute()
        
        if response.data:
            print("✅ Table exists and has data")
            print(f"📊 Sample record columns:")
            for key, value in response.data[0].items():
                print(f"   - {key}: {type(value).__name__} = {value}")
        else:
            print("⚠️ Table exists but is empty")
            
        # Try to get schema info
        print("\n📋 Expected columns (from schema):")
        expected_columns = [
            'id', 'vin', 'service_date', 'invoice_total', 'labor_hours_billed',
            'odometer_reading', 'make', 'model', 'year', 'complaint',
            'customer_name', 'customer_contact', 'diagnosis', 'recommended',
            'parts_used', 'technician', 'shop_id', 'created_at'
        ]
        
        for col in expected_columns:
            print(f"   - {col}")
            
    except Exception as e:
        print(f"❌ Error checking schema: {e}")

if __name__ == "__main__":
    check_table_schema() 