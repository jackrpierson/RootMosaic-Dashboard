'use client'

interface SystemicIssuesProps {
  data: any[] | null
}

export default function SystemicIssues({ data }: SystemicIssuesProps) {
  if (!data || data.length === 0) return null

  // Group by vehicle (make, model, year)
  const vehicleData = data.reduce((acc, item) => {
    const vehicleKey = `${item.make} ${item.model} ${item.year}`
    
    if (!acc[vehicleKey]) {
      acc[vehicleKey] = {
        make: item.make,
        model: item.model,
        year: item.year,
        visits: 0,
        totalLoss: 0,
        misdiagnosisCount: 0,
        repeatVisits: 0,
        avgRepairCost: 0,
        totalRevenue: 0
      }
    }
    
    acc[vehicleKey].visits++
    acc[vehicleKey].totalLoss += item.estimated_loss || 0
    acc[vehicleKey].totalRevenue += item.invoice_total || 0
    acc[vehicleKey].misdiagnosisCount += item.suspected_misdiagnosis || 0
    acc[vehicleKey].repeatVisits += item.repeat_45d || 0
    
    return acc
  }, {} as Record<string, any>)

  // Calculate averages and sort by total impact
  const vehicleStats = Object.entries(vehicleData).map(([key, stats]) => ({
    vehicle: key,
    ...(stats as any),
    avgRepairCost: (stats as any).visits > 0 ? (stats as any).totalRevenue / (stats as any).visits : 0,
    totalImpact: (stats as any).totalLoss + ((stats as any).repeatVisits * 500) // Add cost of repeat visits
  })).sort((a, b) => b.totalImpact - a.totalImpact)

  // Top repeat issues
  const repeatIssues = data.filter(item => item.repeat_45d === 1)
  const repeatIssueCounts = repeatIssues.reduce((acc, item) => {
    acc[item.complaint] = (acc[item.complaint] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topRepeatIssues = Object.entries(repeatIssueCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Systemic Problem Detection & Root Cause Analysis</h2>
      
      {/* Top Problematic Vehicles */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Most Problematic Vehicles (Total Impact)</h3>
        <div className="space-y-3">
          {vehicleStats.slice(0, 5).map((vehicle, index) => (
            <div key={vehicle.vehicle} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">{index + 1}. {vehicle.vehicle}</span>
                <div className="text-sm text-gray-600">
                  {vehicle.visits} visits • ${vehicle.avgRepairCost.toFixed(0)} avg repair • {vehicle.misdiagnosisCount} misdiagnoses
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">${vehicle.totalImpact.toLocaleString()}</div>
                <div className="text-sm text-gray-500">total impact</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Repeat Issues */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Repeat Issues</h3>
        <div className="space-y-2">
                     {topRepeatIssues.map(([complaint, count], index) => (
             <div key={complaint} className="flex justify-between items-center py-2 border-b border-gray-100">
               <span className="font-medium text-gray-700">{index + 1}. {complaint}</span>
               <span className="text-orange-600 font-semibold">{count as number} repeat visits</span>
             </div>
           ))}
        </div>
        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Analysis:</strong> These repeat issues indicate systemic problems that require 
            process improvements, training, or diagnostic protocol updates.
          </p>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="insight-card">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Key Performance Insights</h3>
        <ul className="space-y-2 text-blue-700">
          <li>• {vehicleStats.filter(v => v.visits > 3).length} vehicle models with 3+ visits</li>
          <li>• {vehicleStats.filter(v => v.misdiagnosisCount > 0).length} vehicle models with misdiagnosis history</li>
          <li>• Average repair cost: ${(vehicleStats.reduce((sum, v) => sum + v.avgRepairCost, 0) / vehicleStats.length).toFixed(0)}</li>
          <li>• Total repeat visits: {repeatIssues.length}</li>
        </ul>
      </div>

      {/* Immediate Action Items */}
      <div className="success-card">
        <h3 className="text-lg font-semibold text-green-800 mb-3">Immediate Action Items</h3>
        <ul className="space-y-2 text-green-700">
          <li>• Review diagnostic procedures for {topRepeatIssues[0]?.[0] || 'most common'} complaints</li>
          <li>• Implement additional training for technicians working on problematic vehicle models</li>
          <li>• Establish quality control checkpoints for high-risk jobs</li>
          <li>• Consider warranty extensions for vehicles with repeat issue patterns</li>
        </ul>
      </div>
    </div>
  )
} 