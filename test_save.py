import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SHOP_ID = os.getenv("SHOP_ID")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test the save process directly
print("🔧 Testing direct save to transformed_service_data...")

# Get one record from service_data
response = supabase.table("service_data").select("*").limit(1).execute()

if response.data:
    record = response.data[0]
    print(f"✅ Got record from service_data:")
    print(f"  VIN: {record.get('vin')}")
    print(f"  Technician: {record.get('technician')}")
    print(f"  Complaint: {record.get('complaint')}")
    
    # Try to save this record to transformed_service_data
    try:
        # Clear existing data first
        supabase.table("transformed_service_data").delete().eq("shop_id", SHOP_ID).execute()
        print("🧹 Cleared existing data")
        
        # Add some calculated fields
        test_record = {
            'vin': record.get('vin'),
            'service_date': record.get('service_date'),
            'invoice_total': record.get('invoice_total'),
            'labor_hours_billed': record.get('labor_hours_billed'),
            'odometer_reading': record.get('odometer_reading'),
            'make': record.get('make'),
            'model': record.get('model'),
            'year': record.get('year'),
            'complaint': record.get('complaint'),
            'customer_name': record.get('customer_name'),
            'customer_contact': record.get('customer_contact'),
            'diagnosis': record.get('diagnosis'),
            'recommended': record.get('recommended'),
            'parts_used': record.get('parts_used'),
            'technician': record.get('technician'),
            'efficiency_deviation': 0.5,
            'efficiency_loss': 40.0,
            'estimated_loss': 100.0,
            'repeat_45d': 0,
            'complaint_similarity': 0.1,
            'cluster_id': 1,
            'suspected_misdiagnosis': 0,
            'shop_id': SHOP_ID
        }
        
        # Try to insert
        result = supabase.table("transformed_service_data").insert(test_record).execute()
        print(f"✅ Successfully inserted test record: {result.data}")
        
        # Check if it was actually saved
        check_response = supabase.table("transformed_service_data").select("*").execute()
        print(f"✅ Records in transformed_service_data: {len(check_response.data)}")
        if check_response.data:
            print(f"✅ Sample record: {check_response.data[0]}")
        
    except Exception as e:
        print(f"❌ Error saving: {e}")
else:
    print("❌ No data in service_data table")