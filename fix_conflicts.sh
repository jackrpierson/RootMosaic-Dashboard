#!/bin/bash

# Fix app/api/transformed-data/route.ts
cat > app/api/transformed-data/route.ts << 'ROUTE_EOF'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    console.log('API called - checking environment variables...')
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set')
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set')
    
    const { data, error } = await supabase
      .from('transformed_service_data')
      .select('*')
      .order('service_date', { ascending: false })

    console.log('Supabase response - data length:', data?.length || 0)
    console.log('Supabase response - error:', error)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch data', details: error }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
ROUTE_EOF

# Fix app/page.tsx
cat > app/page.tsx << 'PAGE_EOF'
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
      if (filters.year) {
        filtered = filtered.filter(item => item.year === parseInt(filters.year))
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
PAGE_EOF

# Fix components/FiltersPanel.tsx
cat > components/FiltersPanel.tsx << 'FILTERS_EOF'
'use client'

interface FiltersPanelProps {
  data: any[] | null
  filters: any
  onFiltersChange: (filters: any) => void
}

export default function FiltersPanel({ data, filters, onFiltersChange }: FiltersPanelProps) {
  // Extract unique values for filter options
  const technicians = data ? [...new Set(data.map(item => item.technician).filter(Boolean))] : []
  const makes = data ? [...new Set(data.map(item => item.make).filter(Boolean))] : []
  const complaints = data ? [...new Set(data.map(item => item.complaint).filter(Boolean))] : []
  const years = data ? [...new Set(data.map(item => item.year).filter(Boolean))].sort((a, b) => b - a) : []

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: 'all',
      technician: null,
      make: null,
      year: null,
      complaint: null,
      minLoss: 0,
      problemType: null
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
      
      {/* Date Range Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Period
        </label>
        <select
          value={filters.dateRange}
          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Time</option>
          <option value="last_30_days">Last 30 Days</option>
          <option value="last_90_days">Last 90 Days</option>
          <option value="last_6_months">Last 6 Months</option>
          <option value="last_year">Last Year</option>
          <option value="this_year">This Year</option>
        </select>
      </div>

      {/* Technician Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technician
        </label>
        <select
          value={filters.technician || ''}
          onChange={(e) => handleFilterChange('technician', e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Technicians</option>
          {technicians.map(tech => (
            <option key={tech} value={tech}>{tech}</option>
          ))}
        </select>
      </div>

      {/* Vehicle Make Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Make
        </label>
        <select
          value={filters.make || ''}
          onChange={(e) => handleFilterChange('make', e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Makes</option>
          {makes.map(make => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>
      </div>

      {/* Vehicle Year Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Year
        </label>
        <select
          value={filters.year || ''}
          onChange={(e) => handleFilterChange('year', e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Issue Type Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Issue Type
        </label>
        <select
          value={filters.complaint || ''}
          onChange={(e) => handleFilterChange('complaint', e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Issues</option>
          {complaints.map(complaint => (
            <option key={complaint} value={complaint}>{complaint}</option>
          ))}
        </select>
      </div>

      {/* Loss Threshold Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Loss ($)
        </label>
        <input
          type="number"
          value={filters.minLoss}
          onChange={(e) => handleFilterChange('minLoss', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="0"
          min="0"
          step="10"
        />
        <p className="text-xs text-gray-500 mt-1">Show jobs with losses above this amount</p>
      </div>

      {/* Problem Type Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Problem Type
        </label>
        <select
          value={filters.problemType || ''}
          onChange={(e) => handleFilterChange('problemType', e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Problems</option>
          <option value="misdiagnosis">Misdiagnosis Only</option>
          <option value="efficiency">Efficiency Issues Only</option>
          <option value="both">Both Issues</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={clearAllFilters}
        className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )
}
FILTERS_EOF

# Fix components/MetricsGrid.tsx
cat > components/MetricsGrid.tsx << 'METRICS_EOF'
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
      <div className="bg-white rounded-lg shadow p-6">
        <p>Loading metrics...</p>
        <p>Data received: {data?.length || 0} records</p>
      </div>
    )
  }

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
METRICS_EOF

echo "All files fixed!"
