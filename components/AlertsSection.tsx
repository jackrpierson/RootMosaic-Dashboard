'use client'

interface AlertsSectionProps {
  data: any[] | null
}

export default function AlertsSection({ data }: AlertsSectionProps) {
  if (!data || data.length === 0) return null

  // Calculate alerts
  const misdiagnosisData = data.filter(item => item.suspected_misdiagnosis === 1)
  const highLossData = data.filter(item => item.estimated_loss > 1000)
  const repeatVisits = data.filter(item => item.repeat_45d === 1)

  // Top misdiagnosed issues
  const misdiagnosedIssues = misdiagnosisData.reduce((acc, item) => {
    acc[item.complaint] = (acc[item.complaint] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topMisdiagnosedIssues = Object.entries(misdiagnosedIssues)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Critical Alerts & Systemic Issues</h2>
      
      {/* High Priority Misdiagnosis Alert */}
      {misdiagnosisData.length > 0 && (
        <div className="alert-card">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-red-800">
                HIGH PRIORITY: Misdiagnosis Detection
              </h3>
              <p className="text-red-700 mt-1">
                {misdiagnosisData.length} cases of suspected misdiagnosis detected
              </p>
              <p className="text-red-600 text-sm mt-2">
                Impact: ${misdiagnosisData.reduce((sum, item) => sum + (item.estimated_loss || 0), 0).toLocaleString()} in potential losses
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Misdiagnosed Issues */}
      {topMisdiagnosedIssues.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Misdiagnosed Issues</h3>
          <div className="space-y-2">
                         {topMisdiagnosedIssues.map(([complaint, count], index) => (
               <div key={complaint} className="flex justify-between items-center py-2 border-b border-gray-100">
                 <span className="font-medium text-gray-700">{index + 1}. {complaint}</span>
                 <span className="text-red-600 font-semibold">{count as number} cases</span>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* High Loss Alert */}
      {highLossData.length > 0 && (
        <div className="warning-card">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-yellow-800">
                High Loss Jobs Detected
              </h3>
              <p className="text-yellow-700 mt-1">
                {highLossData.length} jobs with losses exceeding $1,000
              </p>
              <p className="text-yellow-600 text-sm mt-2">
                Total high losses: ${highLossData.reduce((sum, item) => sum + (item.estimated_loss || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Repeat Visits Alert */}
      {repeatVisits.length > 0 && (
        <div className="insight-card">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">🔄</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-blue-800">
                Repeat Visits Identified
              </h3>
              <p className="text-blue-700 mt-1">
                {repeatVisits.length} vehicles returned within 45 days
              </p>
              <p className="text-blue-600 text-sm mt-2">
                This indicates potential misdiagnosis or incomplete repairs
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 