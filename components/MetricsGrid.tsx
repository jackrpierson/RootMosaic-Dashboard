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
      const calculatedMetrics = loadMetrics(data)
      setMetrics(calculatedMetrics)
    }
  }, [data])

  if (!metrics) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Misdiagnosis Rate */}
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="metric-label">Misdiagnosis Rate</p>
            <p className="metric-value text-red-600">{metrics.misdiagnosisRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">{metrics.totalMisdiagnosis} cases detected</p>
          </div>
          <div className="text-3xl">🚨</div>
        </div>
      </div>

      {/* Efficiency Loss */}
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="metric-label">Efficiency Loss</p>
            <p className="metric-value text-orange-600">${metrics.totalEfficiencyLoss.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Lost due to inefficiency</p>
          </div>
          <div className="text-3xl">⏱️</div>
        </div>
      </div>

      {/* Total Estimated Loss */}
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="metric-label">Total Estimated Loss</p>
            <p className="metric-value text-red-600">${metrics.totalEstimatedLoss.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Combined impact</p>
          </div>
          <div className="text-3xl">💰</div>
        </div>
      </div>

      {/* Potential Savings */}
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="metric-label">Potential Savings</p>
            <p className="metric-value text-green-600">${metrics.potentialSavings.toLocaleString()}</p>
            <p className="text-sm text-gray-500">With corrective action</p>
          </div>
          <div className="text-3xl">🎯</div>
        </div>
      </div>
    </div>
  )
} 