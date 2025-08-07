'use client'

import { useState, useEffect } from 'react'

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

interface ActionItemsProps {
  data: any[] | null
}

export default function ActionItems({ data }: ActionItemsProps) {
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (data && data.length > 0) {
      loadRecommendations()
    }
  }, [data])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/action-recommendations')
      const result = await response.json()
      // Sort by priority and expected savings, take top 3
      const sortedRecommendations = (result.recommendations || [])
        .sort((a: ActionRecommendation, b: ActionRecommendation) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          const aScore = priorityOrder[a.priority as keyof typeof priorityOrder] * a.expected_monthly_savings
          const bScore = priorityOrder[b.priority as keyof typeof priorityOrder] * b.expected_monthly_savings
          return bScore - aScore
        })
        .slice(0, 3)
      setRecommendations(sortedRecommendations)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training': return '🎓'
      case 'process': return '⚙️'
      case 'equipment': return '🔧'
      case 'scheduling': return '📅'
      case 'customer_communication': return '📞'
      default: return '💡'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-xl p-6">
        <p className="text-gray-300">No data available for generating recommendations.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto"></div>
          <p className="text-gray-300 mt-4">Analyzing your data...</p>
        </div>
      </div>
    )
  }

  const totalMonthlySavings = recommendations.reduce((sum, rec) => sum + rec.expected_monthly_savings, 0)
  const totalInvestment = recommendations.reduce((sum, rec) => sum + rec.estimated_cost, 0)

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {recommendations.length > 0 && (
        <div className="glass rounded-xl p-6 border-l-4 border-green-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">💰 Quick Win Summary</h3>
            <span className="text-sm text-green-400 font-medium">
              {recommendations.length} actions selected
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(totalMonthlySavings)}</div>
              <div className="text-sm text-gray-400">Monthly savings potential</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{formatCurrency(totalInvestment)}</div>
              <div className="text-sm text-gray-400">Total investment needed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {totalInvestment > 0 ? Math.round(totalInvestment / totalMonthlySavings) : 0} mo
              </div>
              <div className="text-sm text-gray-400">Average payback period</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Actions */}
      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div
            key={recommendation.id}
            className="glass rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <span className="text-lg">{getCategoryIcon(recommendation.category)}</span>
                  <h3 className="text-lg font-bold text-white">{recommendation.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority}
                  </span>
                </div>
                <p className="text-gray-300 mb-4">{recommendation.description}</p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Monthly Savings</div>
                    <div className="text-lg font-bold text-green-400">
                      {formatCurrency(recommendation.expected_monthly_savings)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Investment</div>
                    <div className="text-lg font-bold text-blue-400">
                      {formatCurrency(recommendation.estimated_cost)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Payback</div>
                    <div className="text-lg font-bold text-purple-400">
                      {recommendation.payback_period_months} mo
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2">Next Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                    {recommendation.action_steps.slice(0, 3).map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button className="action-btn bg-green-600 hover:bg-green-700">
                ✅ Start Implementation
              </button>
              <button className="action-btn secondary">
                📅 Schedule Review
              </button>
              <button className="action-btn secondary">
                📋 Get Full Details
              </button>
            </div>
          </div>
        ))}

        {recommendations.length === 0 && (
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-gray-300">No actionable recommendations found for your current data.</p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      {recommendations.length > 0 && (
        <div className="glass rounded-xl p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to boost your profits?</h3>
            <p className="text-gray-300 mb-4">
              These {recommendations.length} actions could save you{' '}
              <span className="font-bold text-green-400">{formatCurrency(totalMonthlySavings)} per month</span>
            </p>
            <button className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              🚀 Start Implementation Plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}