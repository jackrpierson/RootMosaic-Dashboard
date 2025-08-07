import { createClient } from '@supabase/supabase-js'
import { Organization, User, ClientProfile } from '../types/client'

export interface ClientProvisioningData {
  organizationName: string
  organizationSlug: string
  industry: 'auto-repair' | 'contractors' | 'property-management'
  subscriptionTier: 'basic' | 'pro' | 'enterprise'
  adminUser: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  }
  branding: {
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string
    customCss?: string
  }
  settings: {
    timezone: string
    currency: string
    dataRetentionDays?: number
  }
}

export interface ProvisioningResult {
  success: boolean
  organizationId?: string
  userId?: string
  profileId?: string
  accessUrl?: string
  error?: string
  warnings?: string[]
}

export class ClientProvisioningService {
  private supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async provisionNewClient(data: ClientProvisioningData): Promise<ProvisioningResult> {
    const warnings: string[] = []
    
    try {
      // Step 1: Validate unique slug
      const { data: existingOrg } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('slug', data.organizationSlug)
        .single()

      if (existingOrg) {
        return {
          success: false,
          error: `Organization slug '${data.organizationSlug}' already exists`
        }
      }

      // Step 2: Check if email already exists
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id, email')
        .eq('email', data.adminUser.email)
        .single()

      if (existingUser) {
        warnings.push(`Email ${data.adminUser.email} already exists in system`)
      }

      // Step 3: Create organization
      const organizationData = {
        name: data.organizationName,
        slug: data.organizationSlug,
        industry: data.industry,
        subscription_tier: data.subscriptionTier,
        is_active: true,
        deployment_status: 'pending',
        max_users: this.getMaxUsers(data.subscriptionTier),
        max_data_points: this.getMaxDataPoints(data.subscriptionTier),
        settings: {
          timezone: data.settings.timezone,
          currency: data.settings.currency,
          date_format: 'MM/DD/YYYY',
          data_retention_days: data.settings.dataRetentionDays || this.getDefaultRetention(data.subscriptionTier),
          features_enabled: this.getEnabledFeatures(data.subscriptionTier)
        },
        branding_config: {
          primary_color: data.branding.primaryColor || this.getDefaultPrimaryColor(data.industry),
          secondary_color: data.branding.secondaryColor || this.getDefaultSecondaryColor(data.industry),
          logo_url: data.branding.logoUrl,
          custom_css: data.branding.customCss
        }
      }

      const { data: organization, error: orgError } = await this.supabase
        .from('organizations')
        .insert([organizationData])
        .select()
        .single()

      if (orgError) {
        return {
          success: false,
          error: `Failed to create organization: ${orgError.message}`
        }
      }

      // Step 4: Create admin user
      let userId: string | undefined
      
      if (!existingUser) {
        // Create new Supabase auth user
        const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
          email: data.adminUser.email,
          email_confirm: true,
          user_metadata: {
            first_name: data.adminUser.firstName,
            last_name: data.adminUser.lastName,
            organization_id: organization.id,
            role: 'admin'
          }
        })

        if (authError) {
          // Cleanup: delete organization if user creation fails
          await this.supabase.from('organizations').delete().eq('id', organization.id)
          return {
            success: false,
            error: `Failed to create user: ${authError.message}`
          }
        }

        userId = authUser.user.id
      } else {
        userId = existingUser.id
      }

      // Create user record in our users table
      const userData = {
        id: userId,
        email: data.adminUser.email,
        org_id: organization.id,
        role: 'admin',
        permissions: ['admin', 'analytics', 'reports', 'settings', 'users'],
        is_active: true,
        profile_data: {
          first_name: data.adminUser.firstName,
          last_name: data.adminUser.lastName,
          phone: data.adminUser.phone,
          preferences: {
            theme: 'dark',
            notifications: true,
            dashboard_refresh_rate: 300
          }
        }
      }

      const { error: userError } = await this.supabase
        .from('users')
        .upsert([userData])

      if (userError) {
        warnings.push(`User record creation warning: ${userError.message}`)
      }

      // Step 5: Create client profile with industry defaults
      const profileData = await this.createDefaultProfile(organization.id, data.industry)
      
      const { data: profile, error: profileError } = await this.supabase
        .from('client_profiles')
        .insert([profileData])
        .select()
        .single()

      if (profileError) {
        warnings.push(`Profile creation warning: ${profileError.message}`)
      }

      // Step 6: Initialize AI recommendations
      await this.initializeAIRecommendations(organization.id, data.industry)

      // Step 7: Update organization status to active
      await this.supabase
        .from('organizations')
        .update({ deployment_status: 'active' })
        .eq('id', organization.id)

      // Step 8: Send welcome email (implement later)
      // await this.sendWelcomeEmail(data.adminUser.email, organization.slug)

      return {
        success: true,
        organizationId: organization.id,
        userId,
        profileId: profile?.id,
        accessUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${organization.slug}`,
        warnings: warnings.length > 0 ? warnings : undefined
      }

    } catch (error: any) {
      console.error('Client provisioning error:', error)
      return {
        success: false,
        error: `Unexpected error during provisioning: ${error.message}`
      }
    }
  }

  private async createDefaultProfile(orgId: string, industry: string): Promise<any> {
    const industryConfigs = {
      'auto-repair': {
        default_components: [
          'auto-repair-metrics',
          'technician-analysis',
          'financial-calculator',
          'systemic-issues',
          'predictive-analytics'
        ],
        available_metrics: [
          'repair_completion_time',
          'customer_satisfaction',
          'revenue_per_repair',
          'technician_efficiency',
          'parts_cost_ratio',
          'comeback_rate',
          'labor_productivity'
        ]
      },
      'contractors': {
        default_components: [
          'contractor-jobs',
          'contractor-revenue',
          'contractor-leads',
          'project-timeline',
          'resource-allocation'
        ],
        available_metrics: [
          'project_completion_rate',
          'average_project_value',
          'lead_conversion_rate',
          'customer_acquisition_cost',
          'profit_margin'
        ]
      },
      'property-management': {
        default_components: [
          'property-occupancy',
          'property-maintenance',
          'property-financials',
          'tenant-satisfaction',
          'maintenance-tracking'
        ],
        available_metrics: [
          'occupancy_rate',
          'rent_collection_rate',
          'maintenance_response_time',
          'tenant_satisfaction',
          'property_value_growth'
        ]
      }
    }

    const config = industryConfigs[industry]
    
    return {
      org_id: orgId,
      dashboard_layout: config.default_components.map((componentType, index) => ({
        id: `${componentType}-${index}`,
        type: componentType,
        position: { x: (index % 2) * 6, y: Math.floor(index / 2) * 4, w: 6, h: 4 },
        props: {},
        permissions: ['viewer']
      })),
      metrics: config.available_metrics.map(metric => ({
        id: metric,
        name: metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'kpi',
        data_source: 'default',
        calculation: 'avg',
        format: 'number'
      })),
      data_connections: [],
      industry_config: {
        industry,
        ...config,
        terminology: this.getIndustryTerminology(industry)
      }
    }
  }

  private async initializeAIRecommendations(orgId: string, industry: string): Promise<void> {
    const initialRecommendations = this.getInitialRecommendations(industry)
    
    const recommendationsData = initialRecommendations.map(rec => ({
      ...rec,
      org_id: orgId,
      status: 'new',
      created_at: new Date().toISOString()
    }))

    await this.supabase
      .from('ai_recommendations')
      .insert(recommendationsData)
  }

  private getInitialRecommendations(industry: string) {
    const recommendations = {
      'auto-repair': [
        {
          recommendation_type: 'efficiency',
          industry_specific_type: 'technician_productivity',
          title: 'Optimize Technician Scheduling',
          description: 'Analyze peak hours and technician availability to improve scheduling efficiency and reduce customer wait times.',
          impact_score: 85,
          implementation_difficulty: 'medium',
          estimated_roi: 15000,
          priority: 'high',
          action_items: [
            'Review current scheduling patterns',
            'Identify peak demand periods',
            'Implement dynamic scheduling system'
          ]
        }
      ],
      'contractors': [
        {
          recommendation_type: 'revenue',
          industry_specific_type: 'project_optimization',
          title: 'Improve Project Bidding Strategy',
          description: 'Analyze successful project patterns to optimize bidding and increase win rates.',
          impact_score: 78,
          implementation_difficulty: 'medium',
          estimated_roi: 25000,
          priority: 'high',
          action_items: [
            'Analyze historical bid data',
            'Identify winning bid patterns',
            'Develop pricing optimization model'
          ]
        }
      ],
      'property-management': [
        {
          recommendation_type: 'occupancy',
          industry_specific_type: 'tenant_retention',
          title: 'Enhance Tenant Retention Program',
          description: 'Implement proactive tenant engagement strategies to reduce turnover and increase occupancy rates.',
          impact_score: 82,
          implementation_difficulty: 'low',
          estimated_roi: 18000,
          priority: 'high',
          action_items: [
            'Survey current tenants',
            'Identify retention factors',
            'Implement engagement program'
          ]
        }
      ]
    }

    return recommendations[industry] || []
  }

  private getMaxUsers(tier: string): number {
    const limits = { basic: 5, pro: 25, enterprise: 100 }
    return limits[tier as keyof typeof limits] || 5
  }

  private getMaxDataPoints(tier: string): number {
    const limits = { basic: 10000, pro: 100000, enterprise: 1000000 }
    return limits[tier as keyof typeof limits] || 10000
  }

  private getDefaultRetention(tier: string): number {
    const retention = { basic: 90, pro: 365, enterprise: 1095 }
    return retention[tier as keyof typeof retention] || 90
  }

  private getEnabledFeatures(tier: string): string[] {
    const features = {
      basic: ['analytics', 'basic_reports'],
      pro: ['analytics', 'reports', 'predictions', 'api_access'],
      enterprise: ['analytics', 'reports', 'predictions', 'api_access', 'custom_integrations', 'priority_support']
    }
    return features[tier as keyof typeof features] || features.basic
  }

  private getDefaultPrimaryColor(industry: string): string {
    const colors = {
      'auto-repair': '#1976d2',
      'contractors': '#ff9800',
      'property-management': '#4caf50'
    }
    return colors[industry as keyof typeof colors] || '#1976d2'
  }

  private getDefaultSecondaryColor(industry: string): string {
    const colors = {
      'auto-repair': '#42a5f5',
      'contractors': '#ffb74d',
      'property-management': '#81c784'
    }
    return colors[industry as keyof typeof colors] || '#42a5f5'
  }

  private getIndustryTerminology(industry: string): Record<string, string> {
    const terminology = {
      'auto-repair': {
        'clients': 'Customers',
        'projects': 'Repairs',
        'workers': 'Technicians',
        'revenue': 'Service Revenue'
      },
      'contractors': {
        'clients': 'Clients',
        'projects': 'Jobs',
        'workers': 'Contractors',
        'revenue': 'Project Revenue'
      },
      'property-management': {
        'clients': 'Tenants',
        'projects': 'Properties',
        'workers': 'Staff',
        'revenue': 'Rental Income'
      }
    }
    return terminology[industry as keyof typeof terminology] || terminology['auto-repair']
  }
}