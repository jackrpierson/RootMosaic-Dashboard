-- RootMosaic Multi-Tenant Migration Script
-- Run this AFTER creating the new schema

-- Step 1: Create your first organization (replace with your actual data)
INSERT INTO organizations (name, slug, industry, subscription_tier, settings, branding_config) 
VALUES (
  'Demo Auto Shop', 
  'demo-auto', 
  'auto-repair', 
  'pro',
  '{"timezone": "America/New_York", "date_format": "MM/DD/YYYY", "currency": "USD", "data_retention_days": 365, "features_enabled": ["analytics", "predictions", "reports"]}',
  '{"primary_color": "#1976d2", "secondary_color": "#42a5f5"}'
);

-- Step 2: Create your first user (replace email with your actual email)
INSERT INTO users (email, org_id, role, permissions, profile_data)
VALUES (
  'admin@rootmosaic.com',  -- Replace with your email
  (SELECT id FROM organizations WHERE slug = 'demo-auto'),
  'admin',
  ARRAY['admin', 'analytics', 'reports', 'settings'],
  '{"first_name": "Admin", "last_name": "User", "preferences": {"theme": "dark", "notifications": true, "dashboard_refresh_rate": 300}}'
);

-- Step 3: Migrate existing service data (if you have the 'service_data' table)
-- This assumes your existing table is called 'service_data'
INSERT INTO client_data (org_id, data_type, metrics, created_at)
SELECT 
  (SELECT id FROM organizations WHERE slug = 'demo-auto'),
  'service_record',
  jsonb_build_object(
    'vehicle_make', COALESCE(make, 'Unknown'),
    'vehicle_model', COALESCE(model, 'Unknown'), 
    'service_type', COALESCE(service_type, 'General'),
    'technician_name', COALESCE(technician_name, 'Unknown'),
    'labor_hours', COALESCE(labor_hours, 0),
    'parts_cost', COALESCE(parts_cost, 0),
    'labor_cost', COALESCE(labor_cost, 0),
    'total_cost', COALESCE(total_cost, 0),
    'customer_satisfaction', COALESCE(customer_satisfaction, 5),
    'completion_time_days', COALESCE(completion_time_days, 1),
    'is_comeback', COALESCE(is_comeback, false)
  ),
  COALESCE(service_date, NOW())
FROM service_data
WHERE service_data.id IS NOT NULL
LIMIT 1000;  -- Start with first 1000 records

-- Step 4: Create default client profile for the organization
INSERT INTO client_profiles (org_id, dashboard_layout, metrics, industry_config)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'demo-auto'),
  '[
    {"id": "auto-repair-metrics-1", "type": "auto-repair-metrics", "position": {"x": 0, "y": 0, "w": 6, "h": 4}, "props": {}, "permissions": ["viewer"]},
    {"id": "technician-analysis-1", "type": "technician-analysis", "position": {"x": 6, "y": 0, "w": 6, "h": 4}, "props": {}, "permissions": ["viewer"]},
    {"id": "financial-calculator-1", "type": "financial-calculator", "position": {"x": 0, "y": 4, "w": 6, "h": 4}, "props": {}, "permissions": ["analyst"]},
    {"id": "systemic-issues-1", "type": "systemic-issues", "position": {"x": 6, "y": 4, "w": 6, "h": 4}, "props": {}, "permissions": ["viewer"]}
  ]',
  '[
    {"id": "total_repairs", "name": "Total Repairs", "type": "kpi", "data_source": "service_records", "calculation": "count", "format": "number"},
    {"id": "avg_repair_time", "name": "Average Repair Time", "type": "kpi", "data_source": "service_records", "calculation": "avg", "format": "number"},
    {"id": "customer_satisfaction", "name": "Customer Satisfaction", "type": "kpi", "data_source": "service_records", "calculation": "avg", "format": "number"},
    {"id": "revenue_this_month", "name": "Revenue This Month", "type": "kpi", "data_source": "service_records", "calculation": "sum", "format": "currency"}
  ]',
  '{"industry": "auto-repair", "default_components": ["auto-repair-metrics", "technician-analysis", "financial-calculator"], "available_metrics": ["repair_completion_time", "customer_satisfaction", "revenue_per_repair"], "terminology": {"clients": "Customers", "projects": "Repairs", "workers": "Technicians"}}'
);

-- Step 5: Verify the migration
SELECT 
  o.name as organization_name,
  o.slug,
  o.industry,
  u.email as admin_email,
  (SELECT COUNT(*) FROM client_data WHERE org_id = o.id) as data_records,
  (SELECT COUNT(*) FROM client_profiles WHERE org_id = o.id) as profiles
FROM organizations o
LEFT JOIN users u ON u.org_id = o.id AND u.role = 'admin'
WHERE o.slug = 'demo-auto';

-- Important: Update these values before running:
-- 1. Change 'admin@rootmosaic.com' to your actual email
-- 2. Change 'demo-auto' slug to your preferred organization slug
-- 3. Change organization name from 'Demo Auto Shop' to your business name
-- 4. Verify your existing table name (currently assumes 'service_data')