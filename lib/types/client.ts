export interface Organization {
  id: string
  name: string
  slug: string
  industry: 'auto-repair' | 'contractors' | 'property-management' | 'generic'
  subscription_tier: 'basic' | 'pro' | 'enterprise'
  created_at: string
  settings: OrganizationSettings
  branding_config: BrandingConfig
}

export interface User {
  id: string
  email: string
  org_id: string
  role: 'admin' | 'manager' | 'analyst' | 'viewer'
  permissions: string[]
  last_login?: string
  profile_data: UserProfile
}

export interface ClientProfile {
  id: string
  org_id: string
  dashboard_layout: ComponentConfig[]
  metrics: MetricDefinition[]
  data_connections: DataSource[]
  industry_config: IndustryConfig
}

export interface ComponentConfig {
  id: string
  type: string
  position: { x: number; y: number; w: number; h: number }
  props: Record<string, any>
  permissions: string[]
}

export interface MetricDefinition {
  id: string
  name: string
  type: 'kpi' | 'chart' | 'table' | 'gauge'
  data_source: string
  calculation: string
  format: 'number' | 'currency' | 'percentage' | 'date'
}

export interface DataSource {
  id: string
  name: string
  type: 'api' | 'database' | 'file'
  connection_config: Record<string, any>
  refresh_interval: number
}

export interface OrganizationSettings {
  timezone: string
  date_format: string
  currency: string
  data_retention_days: number
  features_enabled: string[]
}

export interface BrandingConfig {
  primary_color: string
  secondary_color: string
  logo_url?: string
  favicon_url?: string
  custom_css?: string
}

export interface UserProfile {
  first_name: string
  last_name: string
  avatar_url?: string
  phone?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
  dashboard_refresh_rate: number
}

export interface IndustryConfig {
  industry: Organization['industry']
  default_components: string[]
  available_metrics: string[]
  data_schemas: Record<string, any>
  terminology: Record<string, string>
}