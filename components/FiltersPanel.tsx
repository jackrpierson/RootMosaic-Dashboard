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
        onClick={() => onFiltersChange({
          dateRange: 'all',
          technician: null,
          make: null,
          year: null,
          complaint: null,
          minLoss: 0,
          problemType: null
        })}
        className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )
}