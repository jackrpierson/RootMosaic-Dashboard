'use client'

import { useState } from 'react'

interface DateRangeSliderProps {
  value: string
  onChange: (value: string) => void
}

export default function DateRangeSlider({ value, onChange }: DateRangeSliderProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const dateOptions = [
    { value: 'all', label: 'All Time', description: 'Complete dataset' },
    { value: 'last_30_days', label: 'Last 30 Days', description: 'Recent activity' },
    { value: 'last_90_days', label: 'Last 90 Days', description: 'Quarter analysis' },
    { value: 'last_6_months', label: 'Last 6 Months', description: 'Mid-term trends' },
    { value: 'last_year', label: 'Last Year', description: 'Annual comparison' },
    { value: 'this_year', label: 'This Year', description: 'Current year data' }
  ]

  const currentOption = dateOptions.find(option => option.value === value)

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Time Period Analysis</h3>
          <p className="text-sm text-gray-400">
            {currentOption?.description || 'Select a time period to analyze'}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="action-btn secondary"
        >
          {isExpanded ? 'Collapse' : 'Customize'}
        </button>
      </div>

      {isExpanded ? (
        <div className="space-y-4">
          {/* Quick Selection Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {dateOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsExpanded(false)
                }}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  value === option.value
                    ? 'action-btn'
                    : 'action-btn secondary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Range Slider */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Custom Range (Coming Soon)
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value="50"
                disabled
                className="date-slider opacity-50"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Past</span>
                <span>Present</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">
              {currentOption?.label || 'All Time'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="status-indicator status-live">Live</span>
            <span className="status-indicator status-warning">Synced</span>
          </div>
        </div>
      )}
    </div>
  )
} 