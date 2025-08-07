'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import MetricsGrid from '@/components/MetricsGrid'
import DateRangeSlider from '@/components/DateRangeSlider'
import AlertsSection from '@/components/AlertsSection'
import TechnicianAnalysis from '@/components/TechnicianAnalysis'
import SystemicIssues from '@/components/SystemicIssues'
import FinancialCalculator from '@/components/FinancialCalculator'
import PredictiveAnalytics from '@/components/PredictiveAnalytics'
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

  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false)

  // Load all data for comprehensive analysis
  const { data: allData, isLoading: allDataLoading } = useTransformedData({ limit: 50000 })
  
  // For the actual filtered data, use server-side filtering
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

  // Memoize the loading state to avoid unnecessary re-renders
  const loading = useMemo(() => isLoading || allDataLoading, [isLoading, allDataLoading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-32 h-32 mx-auto"></div>
          <p className="mt-4 text-gray-300 text-lg">Loading RootMosaic Dashboard...</p>
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
            Showing {filteredData.length} records {totalRecords ? `of ${totalRecords} total` : ''}
          </p>
        </div>

        {/* HERO SECTION - Most Critical Insights */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Your Business Health</h1>
            <p className="text-gray-400">Here's what needs your attention right now</p>
          </div>
          
          <MetricsGrid data={filteredData} />
        </div>

        {/* IMMEDIATE ACTIONS SECTION */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Immediate Actions</h2>
            <p className="text-gray-400">Start here to see the biggest impact</p>
          </div>
          
          <ActionItems data={filteredData} />
        </div>

        {/* CRITICAL ALERTS */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Critical Alerts</h2>
            <p className="text-gray-400">Issues requiring immediate attention</p>
          </div>
          
          <AlertsSection data={filteredData} />
        </div>

        {/* DETAILED ANALYTICS TOGGLE */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowDetailedAnalytics(!showDetailedAnalytics)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center mx-auto space-x-2"
          >
            <span>{showDetailedAnalytics ? 'Hide' : 'Show'} Detailed Analytics</span>
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${showDetailedAnalytics ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <p className="text-sm text-gray-500 mt-2">
            {showDetailedAnalytics ? 'Hide detailed breakdowns and predictions' : 'View technician analysis, systemic issues, and predictions'}
          </p>
        </div>

        {/* DETAILED ANALYTICS - Collapsible */}
        {showDetailedAnalytics && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Deep Dive Analytics</h2>
              <p className="text-gray-400">Detailed insights for optimization</p>
            </div>

            <TechnicianAnalysis data={filteredData} />

            <SystemicIssues data={filteredData} />

            <FinancialCalculator data={filteredData} />

            <PredictiveAnalytics data={filteredData} />
          </div>
        )}
      </div>
    </div>
  )
} // Force deployment
