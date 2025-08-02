export async function loadTransformedData() {
  try {
    const response = await fetch('/api/transformed-data')
    if (!response.ok) {
      throw new Error('Failed to fetch data')
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading transformed data:', error)
    throw error
  }
}

export function loadMetrics(data: any[]) {
  if (!data || data.length === 0) return null

  const totalRecords = data.length
  const misdiagnosisData = data.filter(item => item.suspected_misdiagnosis === 1)
  const totalMisdiagnosis = misdiagnosisData.length
  const misdiagnosisRate = (totalMisdiagnosis / totalRecords) * 100

  const totalEfficiencyLoss = data.reduce((sum, item) => sum + (item.efficiency_loss || 0), 0)
  const totalEstimatedLoss = data.reduce((sum, item) => sum + (item.estimated_loss || 0), 0)
  const potentialSavings = totalEstimatedLoss + totalEfficiencyLoss

  const repeatJobs = data.filter(item => item.repeat_45d === 1).length
  const firstTimeFixRate = ((totalRecords - repeatJobs) / totalRecords) * 100

  const totalRevenue = data.reduce((sum, item) => sum + (item.invoice_total || 0), 0)
  const totalHours = data.reduce((sum, item) => sum + (item.labor_hours_billed || 0), 0)
  const revenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0

  const avgEfficiency = data.reduce((sum, item) => sum + (item.efficiency_deviation || 0), 0) / totalRecords
  const productivityIndex = Math.max(0, 100 - (avgEfficiency * 20))

  const satisfactionScore = Math.max(0, 100 - (repeatJobs / totalRecords * 100))

  return {
    totalRecords,
    misdiagnosisRate,
    totalMisdiagnosis,
    totalEfficiencyLoss,
    totalEstimatedLoss,
    potentialSavings,
    firstTimeFixRate,
    revenuePerHour,
    productivityIndex,
    satisfactionScore,
    repeatJobs
  }
} 