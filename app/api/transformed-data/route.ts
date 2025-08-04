import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50000')
    const offset = (page - 1) * limit

    // Filter parameters
    const dateRange = searchParams.get('dateRange')
    const technician = searchParams.get('technician')
    const make = searchParams.get('make')
    const year = searchParams.get('year')
    const complaint = searchParams.get('complaint')
    const minLoss = parseFloat(searchParams.get('minLoss') || '0')
    const problemType = searchParams.get('problemType')

    console.log('API called with filters:', {
      page, limit, dateRange, technician, make, year, complaint, minLoss, problemType
    })

    // Build the query
    let query = supabase
      .from('transformed_service_data')
      .select('*', { count: 'exact' })

    // Apply date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case 'last_30_days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'last_90_days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'last_6_months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
          break
        case 'last_year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0) // No filter
      }

      if (startDate.getTime() > 0) {
        query = query.gte('service_date', startDate.toISOString().split('T')[0])
      }
    }

    // Apply other filters
    if (technician) {
      query = query.eq('technician', technician)
    }

    if (make) {
      query = query.eq('make', make)
    }

    if (year) {
      query = query.eq('year', parseInt(year))
    }

    if (complaint) {
      query = query.eq('complaint', complaint)
    }

    if (minLoss > 0) {
      query = query.gte('estimated_loss', minLoss)
    }

    // Apply problem type filter
    if (problemType) {
      switch (problemType) {
        case 'misdiagnosis':
          query = query.eq('suspected_misdiagnosis', 1)
          break
        case 'efficiency':
          query = query.gt('efficiency_deviation', 0.2)
          break
        case 'both':
          query = query.or('suspected_misdiagnosis.eq.1,efficiency_deviation.gt.0.2')
          break
      }
    }

    // Apply ordering
    query = query.order('service_date', { ascending: false })
    
    // Apply range/limit - Supabase defaults to 1000 rows, so we need to explicitly set a higher limit
    // Use limit() method instead of range() to bypass the 1000 row limit
    if (limit > 1000) {
      // For large limits, don't use range at all - just order and let Supabase return what it can
      // This will bypass the 1000 row pagination limit
    } else {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error, count } = await query

    console.log('Supabase response - data length:', data?.length || 0, 'total count:', count)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch data', details: error }, { status: 500 })
    }

    // Add cache headers for better performance
    const response = NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

    // Cache for 5 minutes
    response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

    return response
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
