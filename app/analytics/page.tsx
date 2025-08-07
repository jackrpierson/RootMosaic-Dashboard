'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import MetricsGrid from '@/components/MetricsGrid'
import DateRangeSlider from '@/components/DateRangeSlider'
import AlertsSection from '@/components/AlertsSection'
import ActionItems from '@/components/ActionItems'
import { useTransformedData } from '@/lib/hooks/useTransformedData'

export default function AnalyticsDashboard() {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    technician: null,
    make: null,
    year: null,
    complaint: null,
    minLoss: 0,
    problemType: null
  })

  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'alerts'>('overview')

  // Load filtered data
  const { data: filteredData, isLoading, error, totalRecords } = useTransformedData({
    dateRange: filters.dateRange,
    technician: filters.technician,
    make: filters.make,
    year: filters.year ? String(filters.year) : null,
    complaint: filters.complaint,
    minLoss: filters.minLoss,
    problemType: filters.problemType,
    limit: 50000
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-32 h-32 mx-auto"></div>
          <p className="mt-4 text-gray-300 text-lg">Loading your business insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Data</h1>
          <p className="text-gray-300 mb-4">There was an error loading your dashboard data.</p>
          <p className="text-sm text-gray-400">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    )
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="min-h-screen">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-200 mb-4">No Data Available</h1>
              <p className="text-gray-400 mb-4">No records match your current filter criteria.</p>
              <p className="text-sm text-gray-500">Try adjusting your filters to see more data.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Simplified Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Your Business Health</h1>
          <p className="text-gray-400">Quick insights to drive real change</p>
        </div>

        {/* Date Range Slider */}
        <div className="mb-8">
          <DateRangeSlider
            value={filters.dateRange}
            onChange={(value) => setFilters({ ...filters, dateRange: value })}
          />
        </div>

        {/* Record Count Display */}
        <div className="glass rounded-xl p-4 mb-8 border-l-4 border-green-400">
          <p className="text-sm text-gray-300">
            Analyzing {filteredData.length} records {totalRecords ? `of ${totalRecords} total` : ''}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="glass rounded-xl p-1 flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'actions'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              🎯 Actions
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'alerts'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              ⚠️ Alerts
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Key Metrics</h2>
              <p className="text-gray-400">Your business performance at a glance</p>
            </div>
            
            <MetricsGrid data={filteredData} />
            
            {/* Quick Summary */}
            <div className="glass rounded-xl p-6 border-l-4 border-blue-400">
              <h3 className="text-xl font-bold text-white mb-4">💡 What This Means</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">🔍 Focus Areas</h4>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Process issues affecting efficiency</li>
                    <li>• Financial impact of current problems</li>
                    <li>• Opportunities for improvement</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">📈 Next Steps</h4>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Review the Actions tab for specific recommendations</li>
                    <li>• Check Alerts for urgent issues</li>
                    <li>• Focus on high-impact, low-effort improvements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Actionable Steps</h2>
              <p className="text-gray-400">Prioritized recommendations to improve your business</p>
            </div>
            
            <ActionItems data={filteredData} />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Critical Alerts</h2>
              <p className="text-gray-400">Issues requiring immediate attention</p>
            </div>
            
            <AlertsSection data={filteredData} />
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="glass rounded-xl p-6 bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30">
            <h3 className="text-xl font-bold text-white mb-2">Ready to take action?</h3>
            <p className="text-gray-300 mb-4">
              Start with the highest impact recommendations to see immediate results
            </p>
            <button 
              onClick={() => setActiveTab('actions')}
              className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              🚀 View Action Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
