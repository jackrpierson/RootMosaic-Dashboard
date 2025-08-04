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

export default function Dashboard() {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    technician: null,
    make: null,
    year: null,
    complaint: null,
    minLoss: 0,
    problemType: null
  })

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

        {/* Main dashboard content */}
        <div className="space-y-8">
          <MetricsGrid data={filteredData} />

          <ActionItems data={filteredData} />

          <AlertsSection data={filteredData} />

          <TechnicianAnalysis data={filteredData} />

          <SystemicIssues data={filteredData} />

          <FinancialCalculator data={filteredData} />

          <PredictiveAnalytics data={filteredData} />
        </div>
      </div>
    </div>
  )
}
