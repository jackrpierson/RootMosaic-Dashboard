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
    dateRange: 'last_year',
    technicians: [] as string[],
    makes: [] as string[],
    complaints: [] as string[],
    minLoss: 0
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const transformedData = await loadTransformedData()
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
              // Apply filters to data
              let filtered: any[] = data
      
      // Apply date range filter
      const now = new Date()
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      const last6Months = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      
      switch (filters.dateRange) {
        case 'last_month':
          filtered = filtered.filter(item => new Date(item.service_date) >= lastMonth)
          break
        case 'last_6_months':
          filtered = filtered.filter(item => new Date(item.service_date) >= last6Months)
          break
        case 'last_year':
          filtered = filtered.filter(item => new Date(item.service_date) >= lastYear)
          break
        // 'all' keeps all data
      }
      
      // Apply other filters
      if (filters.technicians.length > 0) {
        filtered = filtered.filter(item => filters.technicians.includes(item.technician))
      }
      
      if (filters.makes.length > 0) {
        filtered = filtered.filter(item => filters.makes.includes(item.make))
      }
      
      if (filters.complaints.length > 0) {
        filtered = filtered.filter(item => filters.complaints.includes(item.complaint))
      }
      
      if (filters.minLoss > 0) {
        filtered = filtered.filter(item => item.estimated_loss >= filters.minLoss)
      }
      
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

  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Data Available</h1>
          <p className="text-gray-600">Please ensure your service data has been processed and is available.</p>
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