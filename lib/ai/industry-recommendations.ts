import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

export interface AIRecommendation {
  id: string
  org_id: string
  recommendation_type: string
  industry_specific_type: string
  title: string
  description: string
  impact_score: number
  implementation_difficulty: 'low' | 'medium' | 'high'
  estimated_roi?: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  action_items: string[]
  supporting_data: any
  generated_by: string
}

export interface PerformanceMetrics {
  [key: string]: {
    value: number
    trend: 'up' | 'down' | 'stable'
    benchmark?: number
    period: string
  }
}

export class IndustryAIRecommendationEngine {
  private openai: OpenAI
  private supabase: any

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async generateRecommendations(
    orgId: string, 
    industry: string, 
    performanceMetrics: PerformanceMetrics,
    historicalData: any[]
  ): Promise<AIRecommendation[]> {
    
    try {
      // Get organization context
      const { data: org } = await this.supabase
        .from('organizations')
        .select('name, subscription_tier, settings')
        .eq('id', orgId)
        .single()

      // Analyze patterns in historical data
      const patterns = this.analyzeDataPatterns(historicalData, industry)
      
      // Generate industry-specific prompts
      const prompt = this.buildIndustryPrompt(industry, performanceMetrics, patterns, org)
      
      // Call OpenAI for recommendations
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: this.getIndustrySystemPrompt(industry)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })

      const aiResponse = completion.choices[0]?.message?.content
      if (!aiResponse) {
        throw new Error('No response from AI')
      }

      // Parse and structure the recommendations
      const recommendations = this.parseAIResponse(aiResponse, orgId, industry)
      
      // Enhance with industry-specific logic
      const enhancedRecommendations = recommendations.map(rec => 
        this.enhanceWithIndustryLogic(rec, industry, performanceMetrics, patterns)
      )

      return enhancedRecommendations

    } catch (error) {
      console.error('AI recommendation generation error:', error)
      // Fallback to rule-based recommendations
      return this.generateFallbackRecommendations(orgId, industry, performanceMetrics)
    }
  }

  private getIndustrySystemPrompt(industry: string): string {
    const prompts = {
      'auto-repair': `You are an expert business analyst specializing in auto repair shop operations. 
        You analyze performance data to identify opportunities for:
        - Technician productivity and efficiency improvements
        - Customer satisfaction and retention strategies  
        - Parts inventory and cost optimization
        - Service pricing and revenue growth
        - Operational workflow enhancements
        - Quality control and comeback reduction
        
        Provide actionable, specific recommendations with estimated ROI and implementation steps.`,

      'contractors': `You are an expert business analyst specializing in contracting business operations.
        You analyze performance data to identify opportunities for:
        - Project bidding strategy optimization
        - Resource allocation and scheduling efficiency
        - Client acquisition and retention
        - Profit margin improvement
        - Workflow and project management enhancements
        - Material cost optimization
        
        Provide actionable, specific recommendations with estimated ROI and implementation steps.`,

      'property-management': `You are an expert business analyst specializing in property management operations.
        You analyze performance data to identify opportunities for:
        - Occupancy rate optimization and tenant retention
        - Maintenance cost reduction and efficiency
        - Rent pricing strategy optimization
        - Property value enhancement
        - Tenant satisfaction improvements
        - Operational cost management
        
        Provide actionable, specific recommendations with estimated ROI and implementation steps.`
    }

    return prompts[industry as keyof typeof prompts] || prompts['auto-repair']
  }

  private buildIndustryPrompt(
    industry: string, 
    metrics: PerformanceMetrics, 
    patterns: any, 
    org: any
  ): string {
    const industryContext = {
      'auto-repair': {
        keyMetrics: ['repair_completion_time', 'customer_satisfaction', 'technician_efficiency', 'comeback_rate', 'parts_cost_ratio'],
        businessGoals: 'maximize service revenue, improve customer satisfaction, optimize technician productivity'
      },
      'contractors': {
        keyMetrics: ['project_completion_rate', 'bid_win_rate', 'profit_margin', 'client_satisfaction'],
        businessGoals: 'increase project profitability, improve bid success rate, optimize resource utilization'
      },
      'property-management': {
        keyMetrics: ['occupancy_rate', 'rent_collection_rate', 'maintenance_cost', 'tenant_satisfaction'],
        businessGoals: 'maximize occupancy and rental income, minimize maintenance costs, improve tenant retention'
      }
    }

    const context = industryContext[industry as keyof typeof industryContext]
    
    return `
    Business Context:
    - Organization: ${org?.name || 'Unknown'}
    - Industry: ${industry}
    - Subscription: ${org?.subscription_tier || 'basic'}
    - Business Goals: ${context?.businessGoals || 'general business improvement'}

    Current Performance Metrics:
    ${Object.entries(metrics)
      .filter(([key]) => context?.keyMetrics.includes(key))
      .map(([key, data]) => `- ${key}: ${data.value} (trend: ${data.trend})`)
      .join('\n')}

    Data Patterns Identified:
    ${JSON.stringify(patterns, null, 2)}

    Please provide 3-5 specific, actionable recommendations to improve business performance. 
    For each recommendation, include:
    1. Title (concise, action-oriented)
    2. Description (detailed explanation)
    3. Impact Score (0-100)
    4. Implementation Difficulty (low/medium/high)
    5. Estimated ROI in dollars (if applicable)
    6. Priority Level (low/medium/high/urgent)
    7. 3-5 specific action items
    8. Supporting rationale based on the data

    Format as JSON array with this structure:
    [{
      "title": "string",
      "description": "string", 
      "impact_score": number,
      "implementation_difficulty": "low|medium|high",
      "estimated_roi": number,
      "priority": "low|medium|high|urgent",
      "action_items": ["string", "string"],
      "supporting_rationale": "string"
    }]
    `
  }

  private analyzeDataPatterns(historicalData: any[], industry: string): any {
    if (!historicalData || historicalData.length === 0) {
      return { message: 'No historical data available for pattern analysis' }
    }

    const patterns: any = {}

    try {
      // Time-based patterns
      patterns.timePatterns = this.analyzeTimePatterns(historicalData)
      
      // Industry-specific pattern analysis
      switch (industry) {
        case 'auto-repair':
          patterns.technicianPerformance = this.analyzeTechnicianPatterns(historicalData)
          patterns.serviceTypes = this.analyzeServicePatterns(historicalData)
          patterns.customerSatisfaction = this.analyzeCustomerPatterns(historicalData)
          break
          
        case 'contractors':
          patterns.projectTypes = this.analyzeProjectPatterns(historicalData)
          patterns.bidSuccess = this.analyzeBidPatterns(historicalData)
          patterns.profitability = this.analyzeProfitPatterns(historicalData)
          break
          
        case 'property-management':
          patterns.occupancyTrends = this.analyzeOccupancyPatterns(historicalData)
          patterns.maintenancePatterns = this.analyzeMaintenancePatterns(historicalData)
          patterns.tenantBehavior = this.analyzeTenantPatterns(historicalData)
          break
      }

      return patterns
      
    } catch (error) {
      console.error('Pattern analysis error:', error)
      return { error: 'Unable to analyze patterns', dataCount: historicalData.length }
    }
  }

  private analyzeTimePatterns(data: any[]): any {
    const timeData = data.map(item => ({
      date: new Date(item.created_at),
      value: item.metrics?.total_cost || item.metrics?.value || 0
    })).sort((a, b) => a.date.getTime() - b.date.getTime())

    if (timeData.length < 2) return { trend: 'insufficient_data' }

    const recent = timeData.slice(-7) // Last 7 entries
    const previous = timeData.slice(-14, -7) // Previous 7 entries

    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, item) => sum + item.value, 0) / previous.length 
      : recentAvg

    const trendDirection = recentAvg > previousAvg * 1.05 ? 'improving' :
                          recentAvg < previousAvg * 0.95 ? 'declining' : 'stable'

    return {
      trend: trendDirection,
      recentAverage: recentAvg,
      previousAverage: previousAvg,
      changePercent: ((recentAvg - previousAvg) / previousAvg) * 100
    }
  }

  private analyzeTechnicianPatterns(data: any[]): any {
    const technicianData = data
      .filter(item => item.metrics?.technician_name)
      .reduce((acc: any, item) => {
        const tech = item.metrics.technician_name
        if (!acc[tech]) acc[tech] = { jobs: 0, totalTime: 0, satisfaction: [] }
        
        acc[tech].jobs += 1
        acc[tech].totalTime += item.metrics.labor_hours || 0
        if (item.metrics.customer_satisfaction) {
          acc[tech].satisfaction.push(item.metrics.customer_satisfaction)
        }
        
        return acc
      }, {})

    return Object.entries(technicianData)
      .map(([name, data]: [string, any]) => ({
        name,
        averageJobTime: data.totalTime / data.jobs,
        jobCount: data.jobs,
        averageSatisfaction: data.satisfaction.length > 0 
          ? data.satisfaction.reduce((sum: number, rating: number) => sum + rating, 0) / data.satisfaction.length
          : null
      }))
      .sort((a, b) => b.jobCount - a.jobCount)
  }

  private parseAIResponse(response: string, orgId: string, industry: string): AIRecommendation[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response')
      }

      const recommendations = JSON.parse(jsonMatch[0])
      
      return recommendations.map((rec: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        org_id: orgId,
        recommendation_type: this.inferRecommendationType(rec.title, industry),
        industry_specific_type: this.inferIndustryType(rec.title, industry),
        title: rec.title,
        description: rec.description,
        impact_score: Math.min(100, Math.max(0, rec.impact_score)),
        implementation_difficulty: rec.implementation_difficulty,
        estimated_roi: rec.estimated_roi || null,
        priority: rec.priority,
        action_items: Array.isArray(rec.action_items) ? rec.action_items : [],
        supporting_data: { rationale: rec.supporting_rationale },
        generated_by: 'ai_gpt4'
      }))
      
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      return []
    }
  }

  private inferRecommendationType(title: string, industry: string): string {
    const titleLower = title.toLowerCase()
    
    if (titleLower.includes('efficiency') || titleLower.includes('productivity')) return 'efficiency'
    if (titleLower.includes('revenue') || titleLower.includes('profit') || titleLower.includes('income')) return 'revenue'
    if (titleLower.includes('cost') || titleLower.includes('expense')) return 'cost_optimization'
    if (titleLower.includes('customer') || titleLower.includes('satisfaction') || titleLower.includes('retention')) return 'customer_experience'
    if (titleLower.includes('quality') || titleLower.includes('improve')) return 'quality_improvement'
    
    return 'operational'
  }

  private inferIndustryType(title: string, industry: string): string {
    const titleLower = title.toLowerCase()
    
    switch (industry) {
      case 'auto-repair':
        if (titleLower.includes('technician')) return 'technician_optimization'
        if (titleLower.includes('parts') || titleLower.includes('inventory')) return 'inventory_management'
        if (titleLower.includes('scheduling') || titleLower.includes('appointment')) return 'scheduling_optimization'
        return 'service_optimization'
        
      case 'contractors':
        if (titleLower.includes('bid') || titleLower.includes('proposal')) return 'bidding_strategy'
        if (titleLower.includes('project') || titleLower.includes('job')) return 'project_optimization'
        if (titleLower.includes('resource') || titleLower.includes('scheduling')) return 'resource_management'
        return 'business_development'
        
      case 'property-management':
        if (titleLower.includes('occupancy') || titleLower.includes('tenant')) return 'tenant_management'
        if (titleLower.includes('maintenance') || titleLower.includes('repair')) return 'maintenance_optimization'
        if (titleLower.includes('rent') || titleLower.includes('pricing')) return 'pricing_strategy'
        return 'property_optimization'
        
      default:
        return 'general_improvement'
    }
  }

  private enhanceWithIndustryLogic(
    recommendation: AIRecommendation,
    industry: string,
    metrics: PerformanceMetrics,
    patterns: any
  ): AIRecommendation {
    
    // Add industry-specific enhancements
    const enhanced = { ...recommendation }
    
    // Adjust priority based on performance thresholds
    enhanced.priority = this.calculatePriority(recommendation, metrics, industry)
    
    // Add industry-specific metadata
    enhanced.supporting_data = {
      ...enhanced.supporting_data,
      industry_benchmarks: this.getIndustryBenchmarks(industry),
      performance_context: this.getPerformanceContext(metrics, industry),
      implementation_timeline: this.estimateTimeline(recommendation.implementation_difficulty)
    }
    
    return enhanced
  }

  private calculatePriority(
    rec: AIRecommendation,
    metrics: PerformanceMetrics,
    industry: string
  ): 'low' | 'medium' | 'high' | 'urgent' {
    
    let priorityScore = rec.impact_score
    
    // Boost priority for declining metrics
    Object.values(metrics).forEach(metric => {
      if (metric.trend === 'down') priorityScore += 20
    })
    
    // Industry-specific priority adjustments
    if (industry === 'auto-repair' && rec.title.includes('customer satisfaction')) {
      priorityScore += 15
    }
    
    if (priorityScore > 90) return 'urgent'
    if (priorityScore > 75) return 'high'
    if (priorityScore > 50) return 'medium'
    return 'low'
  }

  private getIndustryBenchmarks(industry: string): any {
    const benchmarks = {
      'auto-repair': {
        customer_satisfaction: { good: 4.5, excellent: 4.8 },
        comeback_rate: { good: 5, excellent: 2 }, // percent
        technician_efficiency: { good: 85, excellent: 95 } // percent
      },
      'contractors': {
        bid_win_rate: { good: 25, excellent: 40 }, // percent
        profit_margin: { good: 15, excellent: 25 }, // percent
        project_completion_rate: { good: 90, excellent: 98 } // percent
      },
      'property-management': {
        occupancy_rate: { good: 90, excellent: 95 }, // percent
        rent_collection_rate: { good: 95, excellent: 99 }, // percent
        maintenance_response_time: { good: 24, excellent: 8 } // hours
      }
    }
    
    return benchmarks[industry as keyof typeof benchmarks] || {}
  }

  private getPerformanceContext(metrics: PerformanceMetrics, industry: string): string {
    const trendingUp = Object.values(metrics).filter(m => m.trend === 'up').length
    const trendingDown = Object.values(metrics).filter(m => m.trend === 'down').length
    
    if (trendingDown > trendingUp) {
      return 'Performance showing declining trends - immediate action recommended'
    } else if (trendingUp > trendingDown) {
      return 'Performance trending positively - focus on optimization and growth'
    } else {
      return 'Performance stable - good time for strategic improvements'
    }
  }

  private estimateTimeline(difficulty: string): string {
    switch (difficulty) {
      case 'low': return '1-2 weeks'
      case 'medium': return '1-3 months' 
      case 'high': return '3-6 months'
      default: return '2-4 weeks'
    }
  }

  private generateFallbackRecommendations(
    orgId: string,
    industry: string,
    metrics: PerformanceMetrics
  ): AIRecommendation[] {
    // Rule-based fallback recommendations when AI fails
    const fallbacks = {
      'auto-repair': [
        {
          title: 'Implement Digital Scheduling System',
          description: 'Optimize appointment scheduling to reduce wait times and improve customer satisfaction.',
          impact_score: 75,
          implementation_difficulty: 'medium' as const,
          estimated_roi: 12000,
          priority: 'high' as const,
          action_items: [
            'Research scheduling software options',
            'Train staff on new system',
            'Set up automated reminders',
            'Monitor booking efficiency metrics'
          ]
        }
      ]
    }
    
    const industryFallbacks = fallbacks[industry as keyof typeof fallbacks] || []
    
    return industryFallbacks.map((rec, index) => ({
      id: `fallback-${Date.now()}-${index}`,
      org_id: orgId,
      recommendation_type: 'efficiency',
      industry_specific_type: 'operational',
      supporting_data: { source: 'rule_based_fallback' },
      generated_by: 'rule_engine',
      ...rec
    }))
  }

  // Additional helper methods for pattern analysis
  private analyzeServicePatterns(data: any[]): any {
    return { placeholder: 'Service pattern analysis' }
  }

  private analyzeCustomerPatterns(data: any[]): any {
    return { placeholder: 'Customer pattern analysis' }
  }

  private analyzeProjectPatterns(data: any[]): any {
    return { placeholder: 'Project pattern analysis' }
  }

  private analyzeBidPatterns(data: any[]): any {
    return { placeholder: 'Bid pattern analysis' }
  }

  private analyzeProfitPatterns(data: any[]): any {
    return { placeholder: 'Profit pattern analysis' }
  }

  private analyzeOccupancyPatterns(data: any[]): any {
    return { placeholder: 'Occupancy pattern analysis' }
  }

  private analyzeMaintenancePatterns(data: any[]): any {
    return { placeholder: 'Maintenance pattern analysis' }
  }

  private analyzeTenantPatterns(data: any[]): any {
    return { placeholder: 'Tenant pattern analysis' }
  }
}