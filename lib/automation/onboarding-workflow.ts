import { createClient } from '@supabase/supabase-js'
import { ClientProvisioningService, ClientProvisioningData } from './client-provisioning'
import { IndustryAIRecommendationEngine } from '../ai/industry-recommendations'

export interface OnboardingStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  estimatedDuration: number // in minutes
  dependencies: string[]
  metadata?: any
}

export interface OnboardingProgress {
  orgId: string
  currentStep: number
  totalSteps: number
  overallStatus: 'not_started' | 'in_progress' | 'completed' | 'failed'
  steps: OnboardingStep[]
  completedAt?: string
  errors: string[]
}

export class ClientOnboardingWorkflow {
  private supabase: any
  private provisioningService: ClientProvisioningService
  private aiEngine: IndustryAIRecommendationEngine

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.provisioningService = new ClientProvisioningService()
    this.aiEngine = new IndustryAIRecommendationEngine()
  }

  async startOnboarding(provisioningData: ClientProvisioningData): Promise<OnboardingProgress> {
    const orgId = `onboarding-${Date.now()}`
    
    const steps = this.generateOnboardingSteps(provisioningData.industry)
    
    const progress: OnboardingProgress = {
      orgId,
      currentStep: 0,
      totalSteps: steps.length,
      overallStatus: 'in_progress',
      steps,
      errors: []
    }

    try {
      // Execute onboarding steps sequentially
      for (let i = 0; i < steps.length; i++) {
        progress.currentStep = i
        progress.steps[i].status = 'in_progress'
        
        await this.executeOnboardingStep(steps[i], provisioningData, progress)
        
        if (progress.steps[i].status === 'failed') {
          progress.overallStatus = 'failed'
          break
        }
        
        progress.steps[i].status = 'completed'
      }

      if (progress.overallStatus !== 'failed') {
        progress.overallStatus = 'completed'
        progress.completedAt = new Date().toISOString()
      }

    } catch (error: any) {
      progress.overallStatus = 'failed'
      progress.errors.push(`Onboarding failed: ${error.message}`)
    }

    return progress
  }

  private generateOnboardingSteps(industry: string): OnboardingStep[] {
    const baseSteps: OnboardingStep[] = [
      {
        id: 'validate_data',
        name: 'Validate Client Data',
        description: 'Validate organization information and admin user details',
        status: 'pending',
        estimatedDuration: 2,
        dependencies: []
      },
      {
        id: 'provision_infrastructure',
        name: 'Provision Infrastructure',
        description: 'Create organization, admin user, and basic infrastructure',
        status: 'pending',
        estimatedDuration: 5,
        dependencies: ['validate_data']
      },
      {
        id: 'setup_database',
        name: 'Initialize Database',
        description: 'Set up client-specific database schema and initial data',
        status: 'pending',
        estimatedDuration: 3,
        dependencies: ['provision_infrastructure']
      },
      {
        id: 'configure_dashboard',
        name: 'Configure Dashboard',
        description: 'Set up industry-specific dashboard layout and components',
        status: 'pending',
        estimatedDuration: 4,
        dependencies: ['setup_database']
      },
      {
        id: 'setup_data_sources',
        name: 'Configure Data Sources',
        description: 'Set up default data connections and import templates',
        status: 'pending',
        estimatedDuration: 6,
        dependencies: ['configure_dashboard']
      },
      {
        id: 'generate_sample_data',
        name: 'Generate Sample Data',
        description: 'Create sample data for demonstration and testing',
        status: 'pending',
        estimatedDuration: 8,
        dependencies: ['setup_data_sources']
      },
      {
        id: 'initialize_ai_recommendations',
        name: 'Initialize AI Engine',
        description: 'Set up AI-powered recommendations and initial insights',
        status: 'pending',
        estimatedDuration: 5,
        dependencies: ['generate_sample_data']
      },
      {
        id: 'configure_branding',
        name: 'Apply Branding',
        description: 'Apply client-specific branding and customization',
        status: 'pending',
        estimatedDuration: 3,
        dependencies: ['initialize_ai_recommendations']
      },
      {
        id: 'setup_notifications',
        name: 'Configure Notifications',
        description: 'Set up email notifications and alerts',
        status: 'pending',
        estimatedDuration: 4,
        dependencies: ['configure_branding']
      },
      {
        id: 'final_validation',
        name: 'Final Validation',
        description: 'Run comprehensive tests and validation checks',
        status: 'pending',
        estimatedDuration: 6,
        dependencies: ['setup_notifications']
      },
      {
        id: 'send_welcome_email',
        name: 'Send Welcome Package',
        description: 'Send welcome email with login credentials and getting started guide',
        status: 'pending',
        estimatedDuration: 2,
        dependencies: ['final_validation']
      }
    ]

    // Add industry-specific steps
    const industrySteps = this.getIndustrySpecificSteps(industry)
    
    return [...baseSteps, ...industrySteps]
  }

  private getIndustrySpecificSteps(industry: string): OnboardingStep[] {
    const industrySteps = {
      'auto-repair': [
        {
          id: 'setup_technician_tracking',
          name: 'Configure Technician Tracking',
          description: 'Set up technician performance tracking and analytics',
          status: 'pending' as const,
          estimatedDuration: 7,
          dependencies: ['configure_dashboard']
        },
        {
          id: 'setup_service_categories',
          name: 'Configure Service Categories',
          description: 'Set up auto repair service types and pricing templates',
          status: 'pending' as const,
          estimatedDuration: 5,
          dependencies: ['setup_technician_tracking']
        }
      ],
      'contractors': [
        {
          id: 'setup_project_tracking',
          name: 'Configure Project Tracking',
          description: 'Set up project management and timeline tracking',
          status: 'pending' as const,
          estimatedDuration: 8,
          dependencies: ['configure_dashboard']
        },
        {
          id: 'setup_bidding_system',
          name: 'Configure Bidding Analytics',
          description: 'Set up bid tracking and success rate analytics',
          status: 'pending' as const,
          estimatedDuration: 6,
          dependencies: ['setup_project_tracking']
        }
      ],
      'property-management': [
        {
          id: 'setup_property_profiles',
          name: 'Configure Property Profiles',
          description: 'Set up property portfolio tracking and analytics',
          status: 'pending' as const,
          estimatedDuration: 9,
          dependencies: ['configure_dashboard']
        },
        {
          id: 'setup_tenant_tracking',
          name: 'Configure Tenant Management',
          description: 'Set up tenant tracking and satisfaction monitoring',
          status: 'pending' as const,
          estimatedDuration: 7,
          dependencies: ['setup_property_profiles']
        }
      ]
    }

    return industrySteps[industry as keyof typeof industrySteps] || []
  }

  private async executeOnboardingStep(
    step: OnboardingStep,
    provisioningData: ClientProvisioningData,
    progress: OnboardingProgress
  ): Promise<void> {
    
    try {
      switch (step.id) {
        case 'validate_data':
          await this.validateClientData(provisioningData)
          break
          
        case 'provision_infrastructure':
          const result = await this.provisioningService.provisionNewClient(provisioningData)
          if (!result.success) {
            throw new Error(result.error)
          }
          progress.orgId = result.organizationId!
          step.metadata = { organizationId: result.organizationId, userId: result.userId }
          break
          
        case 'setup_database':
          await this.initializeDatabase(progress.orgId, provisioningData.industry)
          break
          
        case 'configure_dashboard':
          await this.configureDashboard(progress.orgId, provisioningData.industry)
          break
          
        case 'setup_data_sources':
          await this.setupDataSources(progress.orgId, provisioningData.industry)
          break
          
        case 'generate_sample_data':
          await this.generateSampleData(progress.orgId, provisioningData.industry)
          break
          
        case 'initialize_ai_recommendations':
          await this.initializeAI(progress.orgId, provisioningData.industry)
          break
          
        case 'configure_branding':
          await this.applyBranding(progress.orgId, provisioningData.branding)
          break
          
        case 'setup_notifications':
          await this.setupNotifications(progress.orgId, provisioningData.adminUser.email)
          break
          
        case 'final_validation':
          await this.runFinalValidation(progress.orgId)
          break
          
        case 'send_welcome_email':
          await this.sendWelcomeEmail(progress.orgId, provisioningData)
          break
          
        // Industry-specific steps
        case 'setup_technician_tracking':
          await this.setupTechnicianTracking(progress.orgId)
          break
          
        case 'setup_service_categories':
          await this.setupServiceCategories(progress.orgId)
          break
          
        case 'setup_project_tracking':
          await this.setupProjectTracking(progress.orgId)
          break
          
        case 'setup_bidding_system':
          await this.setupBiddingSystem(progress.orgId)
          break
          
        case 'setup_property_profiles':
          await this.setupPropertyProfiles(progress.orgId)
          break
          
        case 'setup_tenant_tracking':
          await this.setupTenantTracking(progress.orgId)
          break
          
        default:
          console.warn(`Unknown onboarding step: ${step.id}`)
      }
      
    } catch (error: any) {
      step.status = 'failed'
      progress.errors.push(`Step ${step.id} failed: ${error.message}`)
      throw error
    }
  }

  private async validateClientData(data: ClientProvisioningData): Promise<void> {
    const errors: string[] = []
    
    if (!data.organizationName?.trim()) errors.push('Organization name is required')
    if (!data.organizationSlug?.trim()) errors.push('Organization slug is required')
    if (!data.adminUser.email?.trim()) errors.push('Admin email is required')
    if (!data.adminUser.firstName?.trim()) errors.push('Admin first name is required')
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (data.adminUser.email && !emailRegex.test(data.adminUser.email)) {
      errors.push('Invalid email format')
    }
    
    // Check if slug is available
    const { data: existing } = await this.supabase
      .from('organizations')
      .select('id')
      .eq('slug', data.organizationSlug)
      .single()
      
    if (existing) {
      errors.push('Organization slug already exists')
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
  }

  private async initializeDatabase(orgId: string, industry: string): Promise<void> {
    // Set up organization-specific database configurations
    const { error } = await this.supabase
      .from('organizations')
      .update({
        settings: {
          database_initialized: true,
          initialization_date: new Date().toISOString(),
          industry_schema_version: '1.0'
        }
      })
      .eq('id', orgId)
      
    if (error) throw error
  }

  private async configureDashboard(orgId: string, industry: string): Promise<void> {
    // Dashboard configuration is handled in the provisioning service
    // This step validates the configuration was successful
    const { data: profile, error } = await this.supabase
      .from('client_profiles')
      .select('dashboard_layout')
      .eq('org_id', orgId)
      .single()
      
    if (error || !profile?.dashboard_layout) {
      throw new Error('Dashboard configuration failed')
    }
  }

  private async setupDataSources(orgId: string, industry: string): Promise<void> {
    const defaultDataSources = this.getDefaultDataSources(industry)
    
    const { error } = await this.supabase
      .from('data_sources')
      .insert(
        defaultDataSources.map(source => ({
          ...source,
          org_id: orgId
        }))
      )
      
    if (error) throw error
  }

  private getDefaultDataSources(industry: string): any[] {
    const sources = {
      'auto-repair': [
        {
          name: 'Service Records',
          type: 'database',
          connection_config: { table: 'client_data', filter: { data_type: 'service_record' } },
          refresh_interval: 3600
        },
        {
          name: 'Customer Feedback',
          type: 'api',
          connection_config: { endpoint: '/api/feedback', method: 'GET' },
          refresh_interval: 7200
        }
      ],
      'contractors': [
        {
          name: 'Project Data',
          type: 'database',
          connection_config: { table: 'client_data', filter: { data_type: 'project_record' } },
          refresh_interval: 3600
        },
        {
          name: 'Bid Tracking',
          type: 'database',
          connection_config: { table: 'client_data', filter: { data_type: 'bid_record' } },
          refresh_interval: 1800
        }
      ],
      'property-management': [
        {
          name: 'Property Data',
          type: 'database',
          connection_config: { table: 'client_data', filter: { data_type: 'property_record' } },
          refresh_interval: 3600
        },
        {
          name: 'Tenant Records',
          type: 'database',
          connection_config: { table: 'client_data', filter: { data_type: 'tenant_record' } },
          refresh_interval: 7200
        }
      ]
    }
    
    return sources[industry as keyof typeof sources] || sources['auto-repair']
  }

  private async generateSampleData(orgId: string, industry: string): Promise<void> {
    const sampleData = this.generateIndustrySampleData(industry, orgId)
    
    const { error } = await this.supabase
      .from('client_data')
      .insert(sampleData)
      
    if (error) throw error
  }

  private generateIndustrySampleData(industry: string, orgId: string): any[] {
    const now = new Date()
    const sampleData = []
    
    for (let i = 0; i < 10; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      
      let data: any = {
        org_id: orgId,
        created_at: date.toISOString()
      }
      
      switch (industry) {
        case 'auto-repair':
          data.data_type = 'service_record'
          data.metrics = {
            vehicle_make: ['Toyota', 'Honda', 'Ford', 'Chevrolet'][Math.floor(Math.random() * 4)],
            service_type: ['Oil Change', 'Brake Repair', 'Engine Diagnostic'][Math.floor(Math.random() * 3)],
            technician_name: ['John Smith', 'Mike Johnson', 'Sarah Davis'][Math.floor(Math.random() * 3)],
            labor_hours: 1 + Math.random() * 5,
            parts_cost: 50 + Math.random() * 300,
            labor_cost: 80 + Math.random() * 200,
            customer_satisfaction: 4 + Math.random()
          }
          break
          
        case 'contractors':
          data.data_type = 'project_record'
          data.metrics = {
            project_type: ['Residential', 'Commercial', 'Industrial'][Math.floor(Math.random() * 3)],
            project_value: 5000 + Math.random() * 50000,
            completion_days: 1 + Math.random() * 30,
            profit_margin: 10 + Math.random() * 20
          }
          break
          
        case 'property-management':
          data.data_type = 'property_record'
          data.metrics = {
            property_type: ['Apartment', 'House', 'Condo'][Math.floor(Math.random() * 3)],
            monthly_rent: 800 + Math.random() * 2000,
            occupancy_status: Math.random() > 0.1 ? 'occupied' : 'vacant',
            maintenance_cost: Math.random() * 500
          }
          break
      }
      
      data.metrics.total_cost = data.metrics.parts_cost + data.metrics.labor_cost || data.metrics.project_value || data.metrics.monthly_rent
      
      sampleData.push(data)
    }
    
    return sampleData
  }

  private async initializeAI(orgId: string, industry: string): Promise<void> {
    // AI initialization is handled in the provisioning service
    // This validates that recommendations were generated
    const { data: recommendations, error } = await this.supabase
      .from('ai_recommendations')
      .select('id')
      .eq('org_id', orgId)
      .limit(1)
      
    if (error) throw error
    
    if (!recommendations || recommendations.length === 0) {
      throw new Error('AI recommendations initialization failed')
    }
  }

  // Additional implementation methods
  private async applyBranding(orgId: string, branding: any): Promise<void> {
    const { error } = await this.supabase
      .from('organizations')
      .update({ branding_config: branding })
      .eq('id', orgId)
      
    if (error) throw error
  }

  private async setupNotifications(orgId: string, adminEmail: string): Promise<void> {
    // Set up notification preferences
    const { error } = await this.supabase
      .from('users')
      .update({
        profile_data: {
          preferences: {
            email_notifications: true,
            dashboard_notifications: true,
            weekly_reports: true
          }
        }
      })
      .eq('org_id', orgId)
      .eq('email', adminEmail)
      
    if (error) throw error
  }

  private async runFinalValidation(orgId: string): Promise<void> {
    // Run comprehensive validation checks
    const checks = [
      this.validateOrganization(orgId),
      this.validateUserAccess(orgId),
      this.validateDashboardConfig(orgId),
      this.validateDataSources(orgId)
    ]
    
    const results = await Promise.allSettled(checks)
    const failures = results.filter(result => result.status === 'rejected')
    
    if (failures.length > 0) {
      throw new Error(`Validation failed: ${failures.length} checks failed`)
    }
  }

  private async validateOrganization(orgId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, is_active, deployment_status')
      .eq('id', orgId)
      .single()
      
    if (error || !data?.is_active || data.deployment_status !== 'active') {
      throw new Error('Organization validation failed')
    }
  }

  private async validateUserAccess(orgId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('org_id', orgId)
      .eq('role', 'admin')
      .single()
      
    if (error || !data) {
      throw new Error('Admin user validation failed')
    }
  }

  private async validateDashboardConfig(orgId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('client_profiles')
      .select('dashboard_layout')
      .eq('org_id', orgId)
      .single()
      
    if (error || !data?.dashboard_layout || data.dashboard_layout.length === 0) {
      throw new Error('Dashboard configuration validation failed')
    }
  }

  private async validateDataSources(orgId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('data_sources')
      .select('id')
      .eq('org_id', orgId)
      
    if (error || !data || data.length === 0) {
      throw new Error('Data sources validation failed')
    }
  }

  private async sendWelcomeEmail(orgId: string, provisioningData: ClientProvisioningData): Promise<void> {
    // Email sending implementation would go here
    // For now, just log the welcome email details
    console.log(`Welcome email would be sent to: ${provisioningData.adminUser.email}`)
    console.log(`Organization: ${provisioningData.organizationName}`)
    console.log(`Access URL: ${process.env.NEXT_PUBLIC_APP_URL}/${provisioningData.organizationSlug}`)
  }

  // Industry-specific setup methods
  private async setupTechnicianTracking(orgId: string): Promise<void> {
    // Auto-repair specific: technician performance tracking setup
    console.log(`Setting up technician tracking for org: ${orgId}`)
  }

  private async setupServiceCategories(orgId: string): Promise<void> {
    // Auto-repair specific: service category configuration
    console.log(`Setting up service categories for org: ${orgId}`)
  }

  private async setupProjectTracking(orgId: string): Promise<void> {
    // Contractors specific: project management setup
    console.log(`Setting up project tracking for org: ${orgId}`)
  }

  private async setupBiddingSystem(orgId: string): Promise<void> {
    // Contractors specific: bidding analytics setup
    console.log(`Setting up bidding system for org: ${orgId}`)
  }

  private async setupPropertyProfiles(orgId: string): Promise<void> {
    // Property management specific: property portfolio setup
    console.log(`Setting up property profiles for org: ${orgId}`)
  }

  private async setupTenantTracking(orgId: string): Promise<void> {
    // Property management specific: tenant management setup
    console.log(`Setting up tenant tracking for org: ${orgId}`)
  }
}