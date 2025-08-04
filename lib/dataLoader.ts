interface LoadDataOptions {
  page?: number
  limit?: number
  dateRange?: string
  technician?: string | null
  make?: string | null
  year?: string | null
  complaint?: string | null
  minLoss?: number
  problemType?: string | null
}

interface PaginatedResponse {
  data: any[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function loadTransformedData(options: LoadDataOptions = {}): Promise<PaginatedResponse> {
  try {
    const params = new URLSearchParams()
    
    // Add pagination params
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    
    // Add filter params
    if (options.dateRange) params.append('dateRange', options.dateRange)
    if (options.technician) params.append('technician', options.technician)
    if (options.make) params.append('make', options.make)
    if (options.year) params.append('year', options.year)
    if (options.complaint) params.append('complaint', options.complaint)
    if (options.minLoss && options.minLoss > 0) params.append('minLoss', options.minLoss.toString())
    if (options.problemType) params.append('problemType', options.problemType)

    const url = `/api/transformed-data?${params.toString()}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('Failed to fetch data')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error loading transformed data:', error)
    throw error
  }
}

// Legacy function for backward compatibility
export async function loadAllTransformedData() {
  const result = await loadTransformedData({ limit: 1000 })
  return result.data
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