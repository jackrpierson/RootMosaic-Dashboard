import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SHOP_ID = os.getenv("SHOP_ID")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing environment variables")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_table_status():
    """Check the current state of both tables"""
    print("🔍 Checking table status...")
    
    # Check service_data
    print("\n📊 SERVICE_DATA TABLE:")
    try:
        service_response = supabase.table("service_data").select("*").execute()
        if service_response.data:
            print(f"✅ Records in service_data: {len(service_response.data)}")
            print(f"✅ Sample record keys: {list(service_response.data[0].keys())}")
            print(f"✅ Sample record: {service_response.data[0]}")
        else:
            print("❌ No data in service_data")
            return False
    except Exception as e:
        print(f"❌ Error reading service_data: {e}")
        return False
    
    # Check transformed_service_data
    print("\n📊 TRANSFORMED_SERVICE_DATA TABLE:")
    try:
        transformed_response = supabase.table("transformed_service_data").select("*").execute()
        if transformed_response.data:
            print(f"✅ Records in transformed_service_data: {len(transformed_response.data)}")
            print(f"✅ Sample record keys: {list(transformed_response.data[0].keys())}")
            print(f"✅ Sample record: {transformed_response.data[0]}")
        else:
            print("❌ No data in transformed_service_data")
    except Exception as e:
        print(f"❌ Error reading transformed_service_data: {e}")
    
    return True

def run_transformation():
    """Run the transformation script"""
    print("\n🔄 Running transformation script...")
    try:
        # Import and run the transformation
        from build_transformed_service_data import build_transformed_service_data
        build_transformed_service_data(SHOP_ID)
        print("✅ Transformation completed")
    except Exception as e:
        print(f"❌ Error during transformation: {e}")
        import traceback
        traceback.print_exc()

def verify_transformation():
    """Verify the transformation worked"""
    print("\n🔍 Verifying transformation...")
    try:
        # Check service_data count
        service_response = supabase.table("service_data").select("*").execute()
        service_count = len(service_response.data) if service_response.data else 0
        
        # Check transformed_service_data count
        transformed_response = supabase.table("transformed_service_data").select("*").execute()
        transformed_count = len(transformed_response.data) if transformed_response.data else 0
        
        print(f"📊 Service data records: {service_count}")
        print(f"📊 Transformed data records: {transformed_count}")
        
        if service_count == transformed_count:
            print("✅ Transformation successful - record counts match!")
        else:
            print(f"❌ Transformation failed - counts don't match ({service_count} vs {transformed_count})")
            
        # Check for key calculated fields
        if transformed_response.data:
            sample = transformed_response.data[0]
            key_fields = ['efficiency_deviation', 'efficiency_loss', 'estimated_loss', 'repeat_45d', 'suspected_misdiagnosis']
            for field in key_fields:
                if field in sample:
                    print(f"✅ {field}: {sample[field]}")
                else:
                    print(f"❌ Missing field: {field}")
                    
    except Exception as e:
        print(f"❌ Error verifying transformation: {e}")

if __name__ == "__main__":
    print("🚀 RootMosaic Transformation Debugger")
    print("=" * 50)
    
    # Check environment
    print(f"🔧 Environment:")
    print(f"   SUPABASE_URL: {'✅ Set' if SUPABASE_URL else '❌ Missing'}")
    print(f"   SUPABASE_KEY: {'✅ Set' if SUPABASE_KEY else '❌ Missing'}")
    print(f"   SHOP_ID: {SHOP_ID or '❌ Missing'}")
    
    # Check tables
    if check_table_status():
        # Run transformation
        run_transformation()
        
        # Verify results
        verify_transformation()
    else:
        print("❌ Cannot proceed - service_data table issues") 