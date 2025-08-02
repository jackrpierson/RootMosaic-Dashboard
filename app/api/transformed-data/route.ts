import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    console.log('API called - checking environment variables...')
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set')
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set')
    
    const { data, error } = await supabase
      .from('transformed_service_data')
      .select('*')
      .order('service_date', { ascending: false })

    console.log('Supabase response - data length:', data?.length || 0)
    console.log('Supabase response - error:', error)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch data', details: error }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}