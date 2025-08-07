'use client'

import { useEffect, useState } from 'react'
import { loadMetrics } from '@/lib/dataLoader'

interface MetricsGridProps {
  data: any[] | null
}

export default function MetricsGrid({ data }: MetricsGridProps) {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    if (data) {
      try {
        const calculatedMetrics = loadMetrics(data)
        setMetrics(calculatedMetrics)
      } catch (error) {
        console.error('Error calculating metrics:', error)
      }
    }
  }, [data])

  if (!metrics) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto"></div>
          <p className="text-gray-300 mt-4">Calculating your metrics...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Primary Metric - Most Important */}
      <div className="glass rounded-xl p-6 border-l-4 border-red-400">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">🚨 Critical Issue</h3>
            <p className="text-gray-400">Process problems affecting your bottom line</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-red-400">{metrics.misdiagnosisRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Misdiagnosis Rate</div>
          </div>
        </div>
        <div className="bg-red-500/10 rounded-lg p-4 mb-4">
          <p className="text-gray-300 text-sm">
            <strong>{metrics.totalMisdiagnosis} cases</strong> are costing you money and time. 
            Each misdiagnosis impacts customer satisfaction and your reputation.
          </p>
        </div>
        <button className="action-btn w-full bg-red-600 hover:bg-red-700">
          🔧 Fix Process Issues
        </button>
      </div>

      {/* Financial Impact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Losses */}
        <div className="metric-card border-l-4 border-orange-400">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="metric-label">💰 Current Losses</p>
              <p className="metric-value text-orange-400">{formatCurrency(metrics.totalEstimatedLoss)}</p>
              <p className="text-sm text-gray-400">Money being lost monthly</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <button className="action-btn secondary w-full">📊 View Details</button>
        </div>

        {/* Potential Savings */}
        <div className="metric-card border-l-4 border-green-400">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="metric-label">💎 Potential Savings</p>
              <p className="metric-value text-green-400">{formatCurrency(metrics.potentialSavings)}</p>
              <p className="text-sm text-gray-400">With systematic improvements</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <button className="action-btn w-full bg-green-600 hover:bg-green-700">🎯 See Opportunities</button>
        </div>
      </div>

      {/* Efficiency Impact */}
      <div className="metric-card border-l-4 border-blue-400">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="metric-label">⚡ Efficiency Impact</p>
            <p className="metric-value text-blue-400">{formatCurrency(metrics.totalEfficiencyLoss)}</p>
            <p className="text-sm text-gray-400">Lost productivity and time</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-4 mb-4">
          <p className="text-gray-300 text-sm">
            Your team is spending <strong>{Math.round(metrics.totalEfficiencyLoss / 100)} hours</strong> per month 
            on inefficient processes that could be optimized.
          </p>
        </div>
        <button className="action-btn secondary w-full">⚙️ Optimize Processes</button>
      </div>

      {/* Quick Summary */}
      <div className="glass rounded-xl p-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30">
        <h3 className="text-lg font-bold text-white mb-3">📋 Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-400">{metrics.misdiagnosisRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Issues to Fix</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400">{formatCurrency(metrics.totalEstimatedLoss)}</div>
            <div className="text-sm text-gray-400">Monthly Losses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{formatCurrency(metrics.potentialSavings)}</div>
            <div className="text-sm text-gray-400">Potential Savings</div>
          </div>
        </div>
      </div>
    </div>
  )
}
