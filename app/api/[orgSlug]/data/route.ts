import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireOrganizationAccess, AuthError } from '@/lib/auth/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const context = await requireOrganizationAccess(request, params.orgSlug)
    
    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('client_data')
      .select('*')
      .eq('org_id', context.organization.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (dataType) {
      query = query.eq('data_type', dataType)
    }

    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Data fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      )
    }

    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const context = await requireOrganizationAccess(request, params.orgSlug)
    
    const body = await request.json()
    const { data_type, metrics, date_range, tags } = body

    if (!data_type || !metrics) {
      return NextResponse.json(
        { error: 'data_type and metrics are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('client_data')
      .insert([{
        org_id: context.organization.id,
        data_type,
        metrics,
        date_range,
        tags
      }])
      .select()
      .single()

    if (error) {
      console.error('Data insert error:', error)
      return NextResponse.json(
        { error: 'Failed to insert data' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
      )
    }

    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}