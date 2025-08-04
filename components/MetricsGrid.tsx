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
      console.log('MetricsGrid received data:', data.length, 'records')
      console.log('First record fields:', Object.keys(data[0] || {}))
      
      try {
        const calculatedMetrics = loadMetrics(data)
        console.log('Calculated metrics:', calculatedMetrics)
        setMetrics(calculatedMetrics)
      } catch (error) {
        console.error('Error calculating metrics:', error)
      }
    }
  }, [data])

  if (!metrics) {
    return (
      <div className="glass rounded-xl p-6">
        <p className="text-gray-300">Loading metrics...</p>
        <p className="text-gray-400 text-sm">Data received: {data?.length || 0} records</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Process Issues Detected */}
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="metric-label">Process Issues Detected</p>
            <p className="metric-value text-red-400">{metrics.misdiagnosisRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-400">{metrics.totalMisdiagnosis} cases requiring attention</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <button className="action-btn w-full mt-4">Needs Attention</button>
      </div>

      {/* Efficiency Impact */}
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="metric-label">Efficiency Impact</p>
            <p className="metric-value text-orange-400">${metrics.totalEfficiencyLoss.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Process optimization potential</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <button className="action-btn secondary w-full mt-4">Optimize</button>
      </div>

      {/* Total System Loss */}
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="metric-label">Total System Loss</p>
            <p className="metric-value text-red-400">${metrics.totalEstimatedLoss.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Comprehensive impact analysis</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <button className="action-btn w-full mt-4">Needs Attention</button>
      </div>

      {/* Improvement Potential */}
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="metric-label">Improvement Potential</p>
            <p className="metric-value text-green-400">${metrics.potentialSavings.toLocaleString()}</p>
            <p className="text-sm text-gray-400">With systematic corrections</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <button className="action-btn w-full mt-4">Opportunity</button>
      </div>
    </div>
  )
}
