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
          Date Range
        </label>
        <select
          value={filters.dateRange}
          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Time</option>
          <option value="last_month">Last Month</option>
          <option value="last_6_months">Last 6 Months</option>
          <option value="last_year">Last Year</option>
        </select>
      </div>

      {/* Technician Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technicians
        </label>
        <select
          multiple
          value={filters.technicians}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value)
            handleFilterChange('technicians', selected)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          size={4}
        >
          {technicians.map(tech => (
            <option key={tech} value={tech}>{tech}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
      </div>

      {/* Vehicle Make Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Makes
        </label>
        <select
          multiple
          value={filters.makes}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value)
            handleFilterChange('makes', selected)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          size={4}
        >
          {makes.map(make => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>
      </div>

      {/* Complaint Type Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Complaint Types
        </label>
        <select
          multiple
          value={filters.complaints}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value)
            handleFilterChange('complaints', selected)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          size={4}
        >
          {complaints.map(complaint => (
            <option key={complaint} value={complaint}>{complaint}</option>
          ))}
        </select>
      </div>

      {/* Minimum Loss Filter */}
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
        />
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={() => onFiltersChange({
          dateRange: 'last_year',
          technicians: [],
          makes: [],
          complaints: [],
          minLoss: 0
        })}
        className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )
} 