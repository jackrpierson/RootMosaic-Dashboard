'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import MetricsGrid from '@/components/MetricsGrid'
import FiltersPanel from '@/components/FiltersPanel'
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

  // For getting filter options, we need to load all data once
  const { data: allData, isLoading: allDataLoading } = useTransformedData({ limit: 10000 })
  
  // For the actual filtered data, use server-side filtering
  const { data: filteredData, isLoading, error, totalRecords } = useTransformedData({
    dateRange: filters.dateRange,
    technician: filters.technician,
    make: filters.make,
    year: filters.year ? String(filters.year) : null,
    complaint: filters.complaint,
    minLoss: filters.minLoss,
    problemType: filters.problemType,
    limit: 10000 // Load all data for comprehensive analysis
  })

  // Memoize the loading state to avoid unnecessary re-renders
  const loading = useMemo(() => isLoading || allDataLoading, [isLoading, allDataLoading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading RootMosaic Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
          <p className="text-gray-600 mb-4">There was an error loading your dashboard data.</p>
          <p className="text-sm text-gray-500">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    )
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <FiltersPanel
                data={allData}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
            <div className="lg:col-span-3 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">No Data Available</h1>
                <p className="text-gray-600 mb-4">No records match your current filter criteria.</p>
                <p className="text-sm text-gray-500">Try adjusting your filters to see more data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
          {/* Sidebar with filters */}
          <div className="lg:col-span-1">
            <FiltersPanel
              data={allData}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Main dashboard content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Status Bar */}
            <div className="glass p-4 rounded-xl border-l-4 border-l-emerald-400 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-slate-700">
                    Active Analysis: {filteredData.length} records {totalRecords ? `of ${totalRecords} total` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Real-time
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Synced
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
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
      </div>
    </div>
  )
}
