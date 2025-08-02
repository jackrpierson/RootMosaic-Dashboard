import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    console.log('API called - checking environment variables...')
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set')
    
    const { data, error } = await supabase
      .from('transformed_service_data')
      .select('*')
      .limit(10)

    console.log('Supabase response - data length:', data?.length || 0)
    console.log('First record:', data?.[0])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}