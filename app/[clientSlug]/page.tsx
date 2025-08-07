'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import LandingPage from './landing/page'

export default function ClientEntry() {
  const params = useParams()
  const router = useRouter()
  const clientSlug = params?.clientSlug as string
  const supabase = createClientComponentClient()
  
  const [isValidClient, setIsValidClient] = useState<boolean | null>(null)
  const [clientData, setClientData] = useState<any>(null)

  useEffect(() => {
    async function validateClient() {
      if (!clientSlug) {
        router.push('/admin')
        return
      }

      try {
        // Check if client exists and is active
        const { data: client, error } = await supabase
          .from('organizations')
          .select(`
            id,
            name,
            slug,
            industry,
            subscription_tier,
            settings,
            branding_config,
            is_active
          `)
          .eq('slug', clientSlug)
          .eq('is_active', true)
          .single()

        if (error || !client) {
          console.error('Client validation error:', error)
          setIsValidClient(false)
          return
        }

        setClientData(client)
        setIsValidClient(true)
        
      } catch (error) {
        console.error('Client validation error:', error)
        setIsValidClient(false)
      }
    }

    validateClient()
  }, [clientSlug, supabase, router])

  if (isValidClient === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (isValidClient === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Client Not Found</h1>
          <p className="text-xl mb-6">The client "{clientSlug}" does not exist or is not active.</p>
          <button 
            onClick={() => router.push('/admin')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Admin
          </button>
        </div>
      </div>
    )
  }

  // Render the landing page with client-specific branding
  return <LandingPage clientData={clientData} />
}