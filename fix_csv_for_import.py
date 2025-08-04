import pandas as pd
import os
from datetime import datetime

def fix_csv_for_supabase():
    """Fix CSV format for Supabase import"""
    print("🔧 Fixing CSV for Supabase import...")
    
    # Read the original CSV
    try:
        df = pd.read_csv('data/service_data.csv')
        print(f"✅ Loaded {len(df)} records from service_data.csv")
        print(f"📊 Original columns: {list(df.columns)}")
        
        # Fix date format
        if 'service_date' in df.columns:
            print("📅 Converting date format...")
            # Convert various date formats to YYYY-MM-DD HH:mm:ss
            df['service_date'] = pd.to_datetime(df['service_date'], errors='coerce')
            df['service_date'] = df['service_date'].dt.strftime('%Y-%m-%d %H:%M:%S')
            
            # Show sample dates
            print(f"📅 Sample dates after conversion:")
            for i, date in enumerate(df['service_date'].head(3)):
                print(f"   {i+1}. {date}")
        
        # Ensure all required columns exist
        required_columns = [
            'vin', 'service_date', 'invoice_total', 'labor_hours_billed',
            'odometer_reading', 'make', 'model', 'year', 'complaint',
            'customer_name', 'customer_contact', 'diagnosis', 'recommended',
            'parts_used', 'technician'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print(f"⚠️ Missing columns: {missing_columns}")
            # Add missing columns with default values
            for col in missing_columns:
                if col in ['invoice_total', 'labor_hours_billed', 'odometer_reading', 'year']:
                    df[col] = 0
                else:
                    df[col] = ''
        
        # Ensure numeric columns are numeric
        numeric_columns = ['invoice_total', 'labor_hours_billed', 'odometer_reading', 'year']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Save fixed CSV
        output_file = 'data/service_data_fixed.csv'
        df.to_csv(output_file, index=False)
        print(f"✅ Saved fixed CSV to {output_file}")
        print(f"📊 Final columns: {list(df.columns)}")
        print(f"📊 Total records: {len(df)}")
        
        # Show sample record
        print(f"\n📋 Sample record:")
        sample = df.iloc[0]
        for col in df.columns:
            print(f"   {col}: {sample[col]}")
            
    except FileNotFoundError:
        print("❌ service_data.csv not found in data/ directory")
        print("Please place your CSV file in the data/ directory")
    except Exception as e:
        print(f"❌ Error processing CSV: {e}")

if __name__ == "__main__":
    fix_csv_for_supabase() 