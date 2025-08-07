-- Enhanced Multi-Tenant Schema with Performance Optimizations
-- Designed for quality, speed, and scalability

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enhanced Organizations table
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  industry VARCHAR(50) NOT NULL CHECK (industry IN ('auto-repair', 'contractors', 'property-management', 'generic')),
  subscription_tier VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  deployment_status VARCHAR(20) DEFAULT 'active' CHECK (deployment_status IN ('pending', 'active', 'suspended', 'archived')),
  data_retention_days INTEGER DEFAULT 365,
  max_users INTEGER DEFAULT 10,
  max_data_points INTEGER DEFAULT 100000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  branding_config JSONB DEFAULT '{}',
  billing_config JSONB DEFAULT '{}'
);

-- Enhanced Users table with better performance
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'manager', 'analyst', 'viewer')),
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  profile_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partitioned client_data table for better performance
CREATE TABLE client_data (
  id UUID DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  data_type VARCHAR(100) NOT NULL,
  metrics JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  date_range DATERANGE,
  created_month DATE GENERATED ALWAYS AS (date_trunc('month', created_at)::date) STORED,
  tags TEXT[] DEFAULT '{}',
  is_processed BOOLEAN DEFAULT false,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for client_data (last 12 months + next 12 months)
DO $$ 
DECLARE
  start_date DATE := date_trunc('month', NOW() - interval '12 months')::date;
  end_date DATE := date_trunc('month', NOW() + interval '12 months')::date;
  current_date DATE := start_date;
BEGIN
  WHILE current_date < end_date LOOP
    EXECUTE format('CREATE TABLE client_data_%s PARTITION OF client_data FOR VALUES FROM (%L) TO (%L)',
      to_char(current_date, 'YYYY_MM'),
      current_date,
      current_date + interval '1 month'
    );
    current_date := current_date + interval '1 month';
  END LOOP;
END $$;

-- Enhanced client profiles with caching support
CREATE TABLE client_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  dashboard_layout JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '[]',
  data_connections JSONB DEFAULT '[]',
  industry_config JSONB DEFAULT '{}',
  cache_settings JSONB DEFAULT '{"enabled": true, "ttl": 300}',
  performance_settings JSONB DEFAULT '{"auto_refresh": true, "batch_size": 1000}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced data sources with health monitoring
CREATE TABLE data_sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('api', 'database', 'file', 'webhook')),
  connection_config JSONB DEFAULT '{}',
  refresh_interval INTEGER DEFAULT 300,
  last_sync TIMESTAMP WITH TIME ZONE,
  last_successful_sync TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'failed')),
  error_count INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Recommendations table for industry-specific insights
CREATE TABLE ai_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(100) NOT NULL,
  industry_specific_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
  implementation_difficulty VARCHAR(20) CHECK (implementation_difficulty IN ('low', 'medium', 'high')),
  estimated_roi DECIMAL(10,2),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'in_progress', 'completed', 'dismissed')),
  action_items JSONB DEFAULT '[]',
  supporting_data JSONB DEFAULT '{}',
  generated_by VARCHAR(50) DEFAULT 'ai_engine',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Analytics table for monitoring
CREATE TABLE performance_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_unit VARCHAR(50),
  category VARCHAR(100),
  benchmark_value DECIMAL(15,2),
  trend_direction VARCHAR(10) CHECK (trend_direction IN ('up', 'down', 'stable')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (period_start);

-- Create quarterly partitions for performance_analytics
DO $$ 
DECLARE
  start_date DATE := date_trunc('quarter', NOW() - interval '2 years')::date;
  end_date DATE := date_trunc('quarter', NOW() + interval '1 year')::date;
  current_date DATE := start_date;
BEGIN
  WHILE current_date < end_date LOOP
    EXECUTE format('CREATE TABLE performance_analytics_%s PARTITION OF performance_analytics FOR VALUES FROM (%L) TO (%L)',
      to_char(current_date, 'YYYY_Q'),
      current_date,
      current_date + interval '3 months'
    );
    current_date := current_date + interval '3 months';
  END LOOP;
END $$;

-- Enhanced indexes for performance
CREATE INDEX CONCURRENTLY idx_organizations_slug_active ON organizations(slug) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_organizations_industry_active ON organizations(industry) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_users_org_id_active ON users(org_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_users_email_lower ON users(lower(email));
CREATE INDEX CONCURRENTLY idx_client_data_org_id_type ON client_data(org_id, data_type, created_at DESC);
CREATE INDEX CONCURRENTLY idx_client_data_processing ON client_data(org_id, processing_status, created_at) WHERE processing_status != 'completed';
CREATE INDEX CONCURRENTLY idx_client_data_metrics_gin ON client_data USING GIN(metrics);
CREATE INDEX CONCURRENTLY idx_data_sources_org_health ON data_sources(org_id, health_score, last_successful_sync);
CREATE INDEX CONCURRENTLY idx_ai_recommendations_org_priority ON ai_recommendations(org_id, priority, status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_performance_analytics_org_metric ON performance_analytics(org_id, metric_name, period_start DESC);

-- Enhanced Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;

-- Optimized RLS Policies
CREATE POLICY "org_isolation_organizations" ON organizations FOR ALL 
  USING (id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation_users" ON users FOR ALL 
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation_client_data" ON client_data FOR ALL 
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation_client_profiles" ON client_profiles FOR ALL 
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation_data_sources" ON data_sources FOR ALL 
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation_ai_recommendations" ON ai_recommendations FOR ALL 
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org_isolation_performance_analytics" ON performance_analytics FOR ALL 
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Super admin bypass policies
CREATE POLICY "super_admin_full_access_organizations" ON organizations FOR ALL 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- Materialized views for performance
CREATE MATERIALIZED VIEW org_performance_summary AS
SELECT 
  o.id as org_id,
  o.name,
  o.slug,
  o.industry,
  COUNT(DISTINCT u.id) as user_count,
  COUNT(DISTINCT cd.id) as data_points,
  AVG(ds.health_score) as avg_data_source_health,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'new') as pending_recommendations,
  MAX(cd.created_at) as last_data_update
FROM organizations o
LEFT JOIN users u ON o.id = u.org_id AND u.is_active = true
LEFT JOIN client_data cd ON o.id = cd.org_id AND cd.created_at > NOW() - INTERVAL '30 days'
LEFT JOIN data_sources ds ON o.id = ds.org_id AND ds.is_active = true
LEFT JOIN ai_recommendations ar ON o.id = ar.org_id
WHERE o.is_active = true
GROUP BY o.id, o.name, o.slug, o.industry;

-- Refresh the materialized view every hour
CREATE UNIQUE INDEX ON org_performance_summary (org_id);

-- Auto-refresh function
CREATE OR REPLACE FUNCTION refresh_performance_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY org_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_data_updated_at BEFORE UPDATE ON client_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON ai_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Data retention automation
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id, data_retention_days FROM organizations WHERE is_active = true LOOP
    -- Clean up old client_data
    DELETE FROM client_data 
    WHERE org_id = org.id 
    AND created_at < NOW() - (org.data_retention_days || ' days')::INTERVAL;
    
    -- Clean up old performance_analytics
    DELETE FROM performance_analytics 
    WHERE org_id = org.id 
    AND period_start < NOW() - (org.data_retention_days || ' days')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;