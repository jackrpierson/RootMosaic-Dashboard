'use client'

import { useState, useEffect } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import MetricsGrid from '@/components/MetricsGrid'
import FiltersPanel from '@/components/FiltersPanel'
import AlertsSection from '@/components/AlertsSection'
import TechnicianAnalysis from '@/components/TechnicianAnalysis'
import SystemicIssues from '@/components/SystemicIssues'
import FinancialCalculator from '@/components/FinancialCalculator'
import PredictiveAnalytics from '@/components/PredictiveAnalytics'
import { loadTransformedData } from '@/lib/dataLoader'

export default function Dashboard() {
  const [data, setData] = useState<any[] | null>(null)
  const [filteredData, setFilteredData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    dateRange: 'all',
    technician: null,
    make: null,
    year: null,
    complaint: null,
    minLoss: 0,
    problemType: null
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data...')
        const transformedData = await loadTransformedData()
        console.log('Data loaded:', transformedData?.length || 0, 'records')
        setData(transformedData)
        setFilteredData(transformedData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (data) {
      let filtered: any[] = data

      // Apply date range filter
      const now = new Date()
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      const last6Months = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      const thisYear = new Date(now.getFullYear(), 0, 1)

      switch (filters.dateRange) {
        case 'last_30_days':
          filtered = filtered.filter(item => new Date(item.service_date) >= last30Days)
          break
        case 'last_90_days':
          filtered = filtered.filter(item => new Date(item.service_date) >= last90Days)
          break
        case 'last_6_months':
          filtered = filtered.filter(item => new Date(item.service_date) >= last6Months)
          break
        case 'last_year':
          filtered = filtered.filter(item => new Date(item.service_date) >= lastYear)
          break
        case 'this_year':
          filtered = filtered.filter(item => new Date(item.service_date) >= thisYear)
          break
        // 'all' keeps all data
      }

      // Apply technician filter
      if (filters.technician) {
        filtered = filtered.filter(item => item.technician === filters.technician)
      }

      // Apply make filter
      if (filters.make) {
        filtered = filtered.filter(item => item.make === filters.make)
      }

      // Apply year filter
      if (filters.year !== null) {
        const yearValue = parseInt(String(filters.year))
        filtered = filtered.filter(item => item.year === yearValue)
      }

      // Apply complaint filter
      if (filters.complaint) {
        filtered = filtered.filter(item => item.complaint === filters.complaint)
      }

      // Apply minimum loss filter
      if (filters.minLoss > 0) {
        filtered = filtered.filter(item => (item.estimated_loss || 0) >= filters.minLoss)
      }

      // Apply problem type filter
      if (filters.problemType) {
        switch (filters.problemType) {
          case 'misdiagnosis':
            filtered = filtered.filter(item => item.suspected_misdiagnosis === 1)
            break
          case 'efficiency':
            filtered = filtered.filter(item => (item.efficiency_deviation || 0) > 0.2)
            break
          case 'both':
            filtered = filtered.filter(item => 
              item.suspected_misdiagnosis === 1 || (item.efficiency_deviation || 0) > 0.2
            )
            break
        }
      }

      console.log('Filter applied - original:', data.length, 'filtered:', filtered.length)
      setFilteredData(filtered)
    }
  }, [data, filters])

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

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Data Available</h1>
          <p className="text-gray-600 mb-4">Please ensure your service data has been processed and is available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with filters */}
          <div className="lg:col-span-1">
            <FiltersPanel
              data={data}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Main dashboard content */}
          <div className="lg:col-span-3 space-y-8">
            <MetricsGrid data={filteredData} />

            <AlertsSection data={filteredData} />

            <TechnicianAnalysis data={filteredData} />

            <SystemicIssues data={filteredData} />

            <FinancialCalculator data={filteredData} />

            <PredictiveAnalytics data={filteredData} />
          </div>
        </div>
      </div>
    </div>
  )
}
