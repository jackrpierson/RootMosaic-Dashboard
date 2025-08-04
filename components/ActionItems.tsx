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
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

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
      setRecommendations(result.recommendations || [])
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const filteredRecommendations = recommendations.filter(rec => 
    selectedCategory === 'all' || rec.category === selectedCategory
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Action Items & Recommendations</h2>
        <p className="text-gray-600">No data available for generating recommendations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
            💰 Action Items & ROI Recommendations
          </h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({recommendations.length})
            </button>
            {['training', 'process', 'equipment', 'scheduling'].map(category => {
              const count = recommendations.filter(r => r.category === category).length
              if (count === 0) return null
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm capitalize ${
                    selectedCategory === category 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {getCategoryIcon(category)} {category} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Analyzing data and generating recommendations...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(filteredRecommendations.reduce((sum, rec) => sum + rec.expected_monthly_savings, 0))}
                </div>
                <div className="text-sm text-green-600">Monthly Savings Potential</div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(filteredRecommendations.reduce((sum, rec) => sum + rec.estimated_cost, 0))}
                </div>
                <div className="text-sm text-blue-600">Total Investment</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {Math.round(filteredRecommendations.reduce((sum, rec) => sum + rec.payback_period_months, 0) / Math.max(filteredRecommendations.length, 1))} mo
                </div>
                <div className="text-sm text-purple-600">Avg Payback Period</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">
                  {filteredRecommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length}
                </div>
                <div className="text-sm text-orange-600">High Priority Items</div>
              </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
              {filteredRecommendations.map((recommendation, index) => (
                <div
                  key={recommendation.id}
                  className={`border rounded-lg p-6 ${getPriorityColor(recommendation.priority)} border-l-4`}
                >
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getCategoryIcon(recommendation.category)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {recommendation.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                          {recommendation.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{recommendation.description}</p>
                    </div>
                    
                    <div className="flex flex-col md:items-end space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-700">
                            {formatCurrency(recommendation.expected_monthly_savings)}/mo
                          </div>
                          <div className="text-sm text-gray-600">Expected Savings</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-700">
                            {formatCurrency(recommendation.estimated_cost)}
                          </div>
                          <div className="text-sm text-gray-600">Investment</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleExpanded(recommendation.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {expandedItems.has(recommendation.id) ? 'Hide Details ▲' : 'Show Details ▼'}
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Payback Period</div>
                      <div className="font-semibold">
                        {recommendation.payback_period_months} months
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Implementation</div>
                      <div className="font-semibold">
                        {recommendation.implementation_time_hours}h
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Confidence</div>
                      <div className="font-semibold">
                        {(recommendation.confidence_score * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Annual ROI</div>
                      <div className="font-semibold text-green-700">
                        {((recommendation.expected_monthly_savings * 12 / recommendation.estimated_cost - 1) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedItems.has(recommendation.id) && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      {/* Action Steps */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Action Steps:</h4>
                        <ol className="list-decimal list-inside space-y-1">
                          {recommendation.action_steps.map((step, idx) => (
                            <li key={idx} className="text-gray-700">{step}</li>
                          ))}
                        </ol>
                      </div>

                      {/* Success Metrics */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Success Metrics:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {recommendation.success_metrics.map((metric, idx) => (
                            <li key={idx} className="text-gray-700">{metric}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Affected Areas */}
                      {(recommendation.affected_technicians || recommendation.affected_vehicle_types) && (
                        <div className="flex flex-col md:flex-row gap-4">
                          {recommendation.affected_technicians && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Affected Technicians:</h4>
                              <div className="flex flex-wrap gap-2">
                                {recommendation.affected_technicians.map((tech, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {recommendation.affected_vehicle_types && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Affected Vehicle Types:</h4>
                              <div className="flex flex-wrap gap-2">
                                {recommendation.affected_vehicle_types.map((vehicle, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                    {vehicle}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                          ✅ Implement Action
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                          📅 Schedule Review
                        </button>
                        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
                          📋 Export Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredRecommendations.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No recommendations available for the selected category.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Summary Card */}
      {!loading && filteredRecommendations.length > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3">💡 Implementation Summary</h3>
          <p className="mb-4">
            Implementing these {filteredRecommendations.length} recommendations could save your shop{' '}
            <span className="font-bold">
              {formatCurrency(filteredRecommendations.reduce((sum, rec) => sum + rec.expected_monthly_savings, 0))} per month
            </span>
            {' '}with an average payback period of{' '}
            <span className="font-bold">
              {Math.round(filteredRecommendations.reduce((sum, rec) => sum + rec.payback_period_months, 0) / filteredRecommendations.length)} months
            </span>.
          </p>
          <div className="text-sm opacity-90">
            Start with high-priority items to see immediate impact on your bottom line.
          </div>
        </div>
      )}
    </div>
  )
}