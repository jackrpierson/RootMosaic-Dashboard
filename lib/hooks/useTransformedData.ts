import useSWR from 'swr'
import { loadTransformedData } from '../dataLoader'

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

export function useTransformedData(options: LoadDataOptions = {}) {
  // Create a cache key from the options
  const cacheKey = ['transformed-data', JSON.stringify(options)]
  
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse>(
    cacheKey,
    () => loadTransformedData(options),
    {
      // Cache for 5 minutes
      dedupingInterval: 5 * 60 * 1000,
      // Revalidate on focus if data is older than 30 seconds
      focusThrottleInterval: 30 * 1000,
      // Don't revalidate on reconnect to avoid unnecessary requests
      revalidateOnReconnect: false,
      // Retry on error
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  )

  return {
    data: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    // Helper to check if we have any data
    hasData: Boolean(data?.data?.length),
    // Helper to get total count
    totalRecords: data?.pagination?.total || 0
  }
}

// Hook for loading all data (backward compatibility)
export function useAllTransformedData() {
  return useTransformedData({ limit: 10000 })
}