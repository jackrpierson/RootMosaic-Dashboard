import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ActionRecommendation {
  id: string
  category: 'training' | 'process' | 'equipment' | 'scheduling' | 'customer_communication'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  action_steps: string[]
  estimated_cost: number
  expected_monthly_savings: number
  payback_period_months: number
  confidence_score: number
  affected_technicians?: string[]
  affected_vehicle_types?: string[]
  implementation_time_hours: number
  success_metrics: string[]
}

export async function GET(request: Request) {
  try {
    // Get the data for analysis
    const { data, error } = await supabase
      .from('transformed_service_data')
      .select('*')
      .order('service_date', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    const recommendations = generateActionRecommendations(data)

    return NextResponse.json({ 
      recommendations,
      analysis_date: new Date().toISOString(),
      data_points_analyzed: data.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateActionRecommendations(data: any[]): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = []

  // Analyze technician performance for training recommendations
  const technicianAnalysis = analyzeTechnicianPerformance(data)
  recommendations.push(...generateTrainingRecommendations(technicianAnalysis))

  // Analyze systemic issues for process improvements
  const systemicIssues = analyzeSystemicIssues(data)
  recommendations.push(...generateProcessRecommendations(systemicIssues))

  // Analyze equipment needs
  const equipmentNeeds = analyzeEquipmentNeeds(data)
  recommendations.push(...generateEquipmentRecommendations(equipmentNeeds))

  // Analyze scheduling optimization opportunities
  const schedulingAnalysis = analyzeSchedulingOpportunities(data)
  recommendations.push(...generateSchedulingRecommendations(schedulingAnalysis))

  // Sort by priority and potential impact
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return b.expected_monthly_savings - a.expected_monthly_savings
    })
    .slice(0, 15) // Top 15 recommendations
}

function analyzeTechnicianPerformance(data: any[]) {
  const techStats = data.reduce((acc, item) => {
    if (!item.technician) return acc
    
    if (!acc[item.technician]) {
      acc[item.technician] = {
        totalJobs: 0,
        misdiagnosisCount: 0,
        totalLoss: 0,
        efficiencyDeviation: 0,
        commonIssues: {}
      }
    }
    
    const stats = acc[item.technician]
    stats.totalJobs++
    stats.misdiagnosisCount += item.suspected_misdiagnosis || 0
    stats.totalLoss += item.estimated_loss || 0
    stats.efficiencyDeviation += item.efficiency_deviation || 0
    
    // Track common issue types
    if (item.complaint) {
      stats.commonIssues[item.complaint] = (stats.commonIssues[item.complaint] || 0) + 1
    }
    
    return acc
  }, {} as Record<string, any>)

  // Calculate rates and identify problem areas
  Object.keys(techStats).forEach(tech => {
    const stats = techStats[tech]
    stats.misdiagnosisRate = (stats.misdiagnosisCount / stats.totalJobs) * 100
    stats.avgEfficiencyDeviation = stats.efficiencyDeviation / stats.totalJobs
    stats.avgLossPerJob = stats.totalLoss / stats.totalJobs
    stats.topProblemArea = Object.entries(stats.commonIssues)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'General'
  })

  return techStats
}

function generateTrainingRecommendations(techStats: Record<string, any>): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = []

  Object.entries(techStats).forEach(([technician, stats]) => {
    // High misdiagnosis rate
    if (stats.misdiagnosisRate > 15 && stats.totalJobs >= 5) {
      recommendations.push({
        id: `training-misdiagnosis-${technician}`,
        category: 'training',
        priority: stats.misdiagnosisRate > 25 ? 'critical' : 'high',
        title: `Diagnostic Training for ${technician}`,
        description: `${technician} has a ${stats.misdiagnosisRate.toFixed(1)}% misdiagnosis rate, focusing on ${stats.topProblemArea} issues`,
        action_steps: [
          `Schedule specialized diagnostic training for ${stats.topProblemArea} systems`,
          'Assign mentor for next 10 complex diagnoses',
          'Implement diagnostic checklist for common issues',
          'Review training progress in 30 days'
        ],
        estimated_cost: 800,
        expected_monthly_savings: stats.totalLoss * 0.6, // 60% reduction in losses
        payback_period_months: Math.ceil(800 / (stats.totalLoss * 0.6)),
        confidence_score: 0.85,
        affected_technicians: [technician],
        implementation_time_hours: 16,
        success_metrics: [
          'Reduce misdiagnosis rate to under 10%',
          'Decrease average diagnostic time by 20%',
          'Improve customer satisfaction scores'
        ]
      })
    }

    // Low efficiency
    if (stats.avgEfficiencyDeviation > 1.5 && stats.totalJobs >= 5) {
      recommendations.push({
        id: `training-efficiency-${technician}`,
        category: 'training',
        priority: 'medium',
        title: `Efficiency Training for ${technician}`,
        description: `${technician} shows consistent efficiency issues, averaging ${stats.avgEfficiencyDeviation.toFixed(1)} hours over estimate`,
        action_steps: [
          'Time management and workflow optimization training',
          'Tool organization and workspace setup review',
          'Job estimation accuracy training',
          'Implement time tracking for improvement monitoring'
        ],
        estimated_cost: 400,
        expected_monthly_savings: stats.avgLossPerJob * stats.totalJobs * 0.4,
        payback_period_months: Math.ceil(400 / (stats.avgLossPerJob * stats.totalJobs * 0.4)),
        confidence_score: 0.75,
        affected_technicians: [technician],
        implementation_time_hours: 8,
        success_metrics: [
          'Reduce efficiency deviation to under 1.0 hours',
          'Improve job completion time accuracy',
          'Increase billable hours efficiency'
        ]
      })
    }
  })

  return recommendations
}

function analyzeSystemicIssues(data: any[]) {
  const vehicleIssues = data.reduce((acc, item) => {
    if (!item.make || !item.year) return acc
    
    const vehicleKey = `${item.make} ${item.year}`
    if (!acc[vehicleKey]) {
      acc[vehicleKey] = {
        totalJobs: 0,
        misdiagnosisCount: 0,
        commonComplaints: {},
        avgLoss: 0,
        totalLoss: 0
      }
    }
    
    acc[vehicleKey].totalJobs++
    acc[vehicleKey].misdiagnosisCount += item.suspected_misdiagnosis || 0
    acc[vehicleKey].totalLoss += item.estimated_loss || 0
    
    if (item.complaint) {
      acc[vehicleKey].commonComplaints[item.complaint] = 
        (acc[vehicleKey].commonComplaints[item.complaint] || 0) + 1
    }
    
    return acc
  }, {} as Record<string, any>)

  // Calculate rates and identify problematic vehicles
  Object.keys(vehicleIssues).forEach(vehicle => {
    const stats = vehicleIssues[vehicle]
    stats.misdiagnosisRate = (stats.misdiagnosisCount / stats.totalJobs) * 100
    stats.avgLoss = stats.totalLoss / stats.totalJobs
    stats.topComplaint = Object.entries(stats.commonComplaints)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Unknown'
  })

  return vehicleIssues
}

function generateProcessRecommendations(vehicleIssues: Record<string, any>): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = []

  // Find vehicles with high misdiagnosis rates
  const problematicVehicles = Object.entries(vehicleIssues)
    .filter(([, stats]) => stats.misdiagnosisRate > 20 && stats.totalJobs >= 3)
    .sort(([,a], [,b]) => b.totalLoss - a.totalLoss)
    .slice(0, 5)

  problematicVehicles.forEach(([vehicle, stats]) => {
    recommendations.push({
      id: `process-vehicle-${vehicle.replace(/\s+/g, '-')}`,
      category: 'process',
      priority: stats.misdiagnosisRate > 30 ? 'high' : 'medium',
      title: `Diagnostic Protocol for ${vehicle}`,
      description: `${vehicle} vehicles show ${stats.misdiagnosisRate.toFixed(1)}% misdiagnosis rate, primarily for ${stats.topComplaint} issues`,
      action_steps: [
        `Create specific diagnostic checklist for ${vehicle} ${stats.topComplaint} issues`,
        'Research common failure patterns and TSBs',
        'Establish partnership with specialized ${vehicle} parts supplier',
        'Train technicians on vehicle-specific procedures'
      ],
      estimated_cost: 500,
      expected_monthly_savings: stats.totalLoss * 0.7,
      payback_period_months: Math.ceil(500 / (stats.totalLoss * 0.7)),
      confidence_score: 0.80,
      affected_vehicle_types: [vehicle],
      implementation_time_hours: 12,
      success_metrics: [
        `Reduce ${vehicle} misdiagnosis rate to under 15%`,
        'Decrease comebacks for this vehicle type',
        'Improve first-time fix rate'
      ]
    })
  })

  return recommendations
}

function analyzeEquipmentNeeds(data: any[]): any {
  // Analyze patterns that suggest equipment deficiencies
  const electricalIssues = data.filter(item => 
    item.complaint?.toLowerCase().includes('electrical') ||
    item.complaint?.toLowerCase().includes('battery') ||
    item.complaint?.toLowerCase().includes('charging')
  ).length

  const diagnosticIssues = data.filter(item => 
    (item.efficiency_deviation || 0) > 2 && 
    item.suspected_misdiagnosis === 1
  ).length

  return {
    electricalIssueCount: electricalIssues,
    diagnosticIssueCount: diagnosticIssues,
    totalJobs: data.length
  }
}

function generateEquipmentRecommendations(equipmentNeeds: any): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = []

  // High electrical issues suggest need for better diagnostic equipment
  if (equipmentNeeds.electricalIssueCount > equipmentNeeds.totalJobs * 0.15) {
    recommendations.push({
      id: 'equipment-electrical-diagnostics',
      category: 'equipment',
      priority: 'high',
      title: 'Advanced Electrical Diagnostic Equipment',
      description: `${equipmentNeeds.electricalIssueCount} electrical issues suggest need for upgraded diagnostic tools`,
      action_steps: [
        'Research and purchase advanced electrical diagnostic scanner',
        'Invest in oscilloscope for complex electrical diagnosis',
        'Train technicians on new equipment usage',
        'Create electrical diagnostic procedures manual'
      ],
      estimated_cost: 5000,
      expected_monthly_savings: equipmentNeeds.electricalIssueCount * 150, // Avg savings per electrical job
      payback_period_months: Math.ceil(5000 / (equipmentNeeds.electricalIssueCount * 150)),
      confidence_score: 0.90,
      implementation_time_hours: 40,
      success_metrics: [
        'Reduce electrical misdiagnosis rate by 50%',
        'Decrease diagnostic time for electrical issues',
        'Improve customer satisfaction on electrical repairs'
      ]
    })
  }

  return recommendations
}

function analyzeSchedulingOpportunities(data: any[]): any {
  // Analyze technician specializations
  const technicianSpecialties = data.reduce((acc, item) => {
    if (!item.technician || !item.complaint) return acc
    
    if (!acc[item.technician]) {
      acc[item.technician] = {}
    }
    
    acc[item.technician][item.complaint] = (acc[item.technician][item.complaint] || 0) + 1
    
    return acc
  }, {} as Record<string, Record<string, number>>)

  return { technicianSpecialties }
}

function generateSchedulingRecommendations(schedulingAnalysis: any): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = []

  // Find technicians with clear specializations
  Object.entries(schedulingAnalysis.technicianSpecialties).forEach(([technician, complaints]) => {
    const complaintEntries = Object.entries(complaints as Record<string, number>)
    const totalJobs = complaintEntries.reduce((sum, [, count]) => sum + count, 0)
    
    if (totalJobs >= 10) {
      const topSpecialty = complaintEntries
        .sort(([,a], [,b]) => b - a)[0]
      
      if (topSpecialty && topSpecialty[1] / totalJobs > 0.4) {
        recommendations.push({
          id: `scheduling-specialty-${technician}`,
          category: 'scheduling',
          priority: 'medium',
          title: `Optimize ${technician}'s Specialization`,
          description: `${technician} shows expertise in ${topSpecialty[0]} (${((topSpecialty[1] / totalJobs) * 100).toFixed(1)}% of jobs)`,
          action_steps: [
            `Prioritize ${topSpecialty[0]} jobs for ${technician}`,
            'Track performance improvement with specialized scheduling',
            'Cross-train other technicians in this specialty area',
            'Market specialized expertise to customers'
          ],
          estimated_cost: 100,
          expected_monthly_savings: topSpecialty[1] * 50, // Efficiency savings per job
          payback_period_months: 1,
          confidence_score: 0.70,
          affected_technicians: [technician],
          implementation_time_hours: 4,
          success_metrics: [
            'Increase job completion efficiency by 15%',
            'Reduce comebacks for specialized work',
            'Improve customer satisfaction scores'
          ]
        })
      }
    }
  })

  return recommendations
}