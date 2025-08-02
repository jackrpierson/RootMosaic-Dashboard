'use client'

import { useState } from 'react'

interface FinancialCalculatorProps {
  data: any[] | null
}

export default function FinancialCalculator({ data }: FinancialCalculatorProps) {
  const [investments, setInvestments] = useState({
    trainingCost: 5000,
    equipmentCost: 10000,
    processCost: 3000
  })
  const [improvementPercentage, setImprovementPercentage] = useState(20)

  if (!data || data.length === 0) return null

  // Calculate current state
  const totalLoss = data.reduce((sum, item) => sum + (item.estimated_loss || 0), 0)
  const totalRevenue = data.reduce((sum, item) => sum + (item.invoice_total || 0), 0)
  const totalInvestment = investments.trainingCost + investments.equipmentCost + investments.processCost

  // Calculate potential savings
  const potentialSavings = totalLoss * (improvementPercentage / 100)
  const annualSavings = potentialSavings * 12 // Assuming monthly data
  const roiPercentage = totalInvestment > 0 ? (annualSavings / totalInvestment) * 100 : 0
  const paybackMonths = annualSavings > 0 ? totalInvestment / (annualSavings / 12) : 0

  // Break-even analysis
  const monthlySavings = annualSavings / 12
  const breakEvenTraining = investments.trainingCost / monthlySavings
  const breakEvenEquipment = investments.equipmentCost / monthlySavings
  const breakEvenTotal = totalInvestment / monthlySavings

  // ROI recommendation
  const getRoiRecommendation = (roi: number) => {
    if (roi >= 300) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' }
    if (roi >= 200) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (roi >= 100) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const roiRec = getRoiRecommendation(roiPercentage)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Financial Impact Calculator</h2>
      
      {/* Investment Calculator */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Investment Calculator</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Cost ($)
            </label>
            <input
              type="number"
              value={investments.trainingCost}
              onChange={(e) => setInvestments(prev => ({ ...prev, trainingCost: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Cost ($)
            </label>
            <input
              type="number"
              value={investments.equipmentCost}
              onChange={(e) => setInvestments(prev => ({ ...prev, equipmentCost: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Process Improvement ($)
            </label>
            <input
              type="number"
              value={investments.processCost}
              onChange={(e) => setInvestments(prev => ({ ...prev, processCost: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card">
            <p className="metric-label">Total Investment</p>
            <p className="metric-value text-gray-800">${totalInvestment.toLocaleString()}</p>
          </div>
          
          <div className="metric-card">
            <p className="metric-label">Annual Savings</p>
            <p className="metric-value text-green-600">${annualSavings.toLocaleString()}</p>
          </div>
          
          <div className="metric-card">
            <p className="metric-label">ROI Percentage</p>
            <p className="metric-value text-blue-600">{roiPercentage.toFixed(1)}%</p>
          </div>
          
          <div className="metric-card">
            <p className="metric-label">Payback Period</p>
            <p className="metric-value text-orange-600">{paybackMonths.toFixed(1)} months</p>
          </div>
        </div>
      </div>

      {/* Break-Even Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Break-Even Analysis</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Improvement Percentage: {improvementPercentage}%
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={improvementPercentage}
            onChange={(e) => setImprovementPercentage(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Training Break-Even</p>
            <p className="text-lg font-bold text-gray-800">{breakEvenTraining.toFixed(1)} months</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Equipment Break-Even</p>
            <p className="text-lg font-bold text-gray-800">{breakEvenEquipment.toFixed(1)} months</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Break-Even</p>
            <p className="text-lg font-bold text-gray-800">{breakEvenTotal.toFixed(1)} months</p>
          </div>
        </div>
      </div>

      {/* ROI Recommendation */}
      <div className={`${roiRec.bg} rounded-lg p-6 border-l-4 border-current`}>
        <h3 className={`text-lg font-semibold ${roiRec.color} mb-2`}>
          ROI Recommendation: {roiRec.level}
        </h3>
        <p className={`${roiRec.color} text-sm`}>
          {roiPercentage >= 200 ? 
            "Excellent investment opportunity with strong potential returns." :
            roiPercentage >= 100 ?
            "Moderate investment with reasonable payback period." :
            "Consider lower-cost alternatives or phased implementation."
          }
        </p>
      </div>
    </div>
  )
} 