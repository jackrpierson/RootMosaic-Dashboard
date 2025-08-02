'use client'

interface TechnicianAnalysisProps {
  data: any[] | null
}

export default function TechnicianAnalysis({ data }: TechnicianAnalysisProps) {
  if (!data || data.length === 0) return null

  // Group data by technician
  const technicianData = data.reduce((acc, item) => {
    if (!item.technician) return acc
    
    if (!acc[item.technician]) {
      acc[item.technician] = {
        jobs: 0,
        totalLoss: 0,
        totalHours: 0,
        misdiagnosisCount: 0,
        repeatVisits: 0,
        avgEfficiency: 0
      }
    }
    
    acc[item.technician].jobs++
    acc[item.technician].totalLoss += item.estimated_loss || 0
    acc[item.technician].totalHours += item.labor_hours_billed || 0
    acc[item.technician].misdiagnosisCount += item.suspected_misdiagnosis || 0
    acc[item.technician].repeatVisits += item.repeat_45d || 0
    acc[item.technician].avgEfficiency += item.efficiency_deviation || 0
    
    return acc
  }, {} as Record<string, any>)

  // Calculate averages and sort by total loss
  const technicianStats = Object.entries(technicianData).map(([tech, stats]) => ({
    technician: tech,
    ...(stats as any),
    avgEfficiency: (stats as any).jobs > 0 ? (stats as any).avgEfficiency / (stats as any).jobs : 0,
    avgLossPerJob: (stats as any).jobs > 0 ? (stats as any).totalLoss / (stats as any).jobs : 0,
    misdiagnosisRate: (stats as any).jobs > 0 ? ((stats as any).misdiagnosisCount / (stats as any).jobs) * 100 : 0
  })).sort((a, b) => b.totalLoss - a.totalLoss)

  // Find technicians with efficiency issues
  const inefficientTechs = technicianStats.filter(tech => tech.avgEfficiency > 2)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Technician Efficiency & Performance Analysis</h2>
      
      {/* Efficiency Issues Alert */}
      {inefficientTechs.length > 0 && (
        <div className="alert-card">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-red-800">
                Technician Efficiency Issues
              </h3>
              <p className="text-red-700 mt-1">
                {inefficientTechs.length} technicians showing significant efficiency deviations
              </p>
              <p className="text-red-600 text-sm mt-2">
                                 Average deviation: {(inefficientTechs.reduce((sum, tech) => sum + tech.avgEfficiency, 0) / inefficientTechs.length).toFixed(2)} hours per job
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Technician Performance Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Technician Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jobs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Loss
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Loss/Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Misdiagnosis Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency Dev.
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {technicianStats.slice(0, 10).map((tech, index) => (
                <tr key={tech.technician} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tech.technician}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tech.jobs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                    ${tech.totalLoss.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${tech.avgLossPerJob.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tech.misdiagnosisRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tech.avgEfficiency.toFixed(2)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 