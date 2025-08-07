'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ClientData {
  id: string
  name: string
  slug: string
  industry: string
  branding_config: {
    primary_color?: string
    secondary_color?: string
    logo_url?: string
    custom_css?: string
  }
}

interface LandingPageProps {
  clientData: ClientData
}

export default function ClientLandingPage({ clientData }: LandingPageProps) {
  const router = useRouter()
  const params = useParams()
  const clientSlug = params?.clientSlug as string
  const supabase = createClientComponentClient()
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Industry-specific video backgrounds
  const videoBackgrounds = {
    'auto-repair': [
      '/videos/251667_Automobile Car Engineering Mechanic_By_Thomas_Gellert_Artlist_HD.mp4',
      '/videos/54072_Mechanic working on engine in garage_By_Ami_Bornstein_Artlist_HD.mp4',
      '/videos/6266834_Mechanic Repair Car Garage_By_Felbaba_Volodymyr_Artlist_HD.mp4'
    ],
    'contractors': [
      '/videos/165203_Man drilling a screw into wood_By_Max_Freyss_Artlist_HD.mp4',
      '/videos/326803_Forklift Shelves Crates Boxes_By_Brad_Day_Artlist_HD.mp4'
    ],
    'property-management': [
      '/videos/614440_Doctor Tablet Kid Patient_By_Pressmaster_Artlist_HD.mp4',
      '/videos/634257_3d Conveyor Boxes Storage_By_Daniel_Megias_Del_Pozo_Artlist_HD.mp4'
    ]
  }

  const videos = videoBackgrounds[clientData.industry as keyof typeof videoBackgrounds] || videoBackgrounds['auto-repair']
  
  const industryTitles = {
    'auto-repair': 'Auto Repair Analytics',
    'contractors': 'Contractor Intelligence',
    'property-management': 'Property Management Insights'
  }

  const industryDescriptions = {
    'auto-repair': 'Transform your auto repair business with data-driven insights, predictive analytics, and actionable recommendations to boost efficiency and profitability.',
    'contractors': 'Optimize your contracting operations with intelligent project analytics, resource management, and growth opportunities.',
    'property-management': 'Maximize your property portfolio performance with comprehensive analytics, tenant insights, and operational intelligence.'
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length)
    }, 15000)
    return () => clearInterval(interval)
  }, [videos.length])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      // Verify user belongs to this organization
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('org_id, organizations!inner(slug)')
        .eq('id', data.user.id)
        .eq('organizations.slug', clientSlug)
        .single()

      if (userError || !userData) {
        await supabase.auth.signOut()
        setError('You do not have access to this organization')
        return
      }

      // Redirect to dashboard
      router.push(`/${clientSlug}/dashboard`)
      
    } catch (error: any) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const primaryColor = clientData.branding_config.primary_color || '#1976d2'
  const secondaryColor = clientData.branding_config.secondary_color || '#42a5f5'

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        {videos.map((video, index) => (
          <video
            key={video}
            autoPlay
            loop
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentVideoIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <source src={video} type="video/mp4" />
          </video>
        ))}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl w-full text-center text-white">
          
          {/* Client Logo */}
          {clientData.branding_config.logo_url && (
            <div className="mb-8">
              <img 
                src={clientData.branding_config.logo_url} 
                alt={`${clientData.name} Logo`}
                className="mx-auto max-h-16 w-auto"
              />
            </div>
          )}

          {/* Main Content */}
          <div className="backdrop-blur-sm bg-black/30 rounded-2xl p-8 mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
              {clientData.name}
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-semibold mb-4" style={{ color: secondaryColor }}>
              {industryTitles[clientData.industry as keyof typeof industryTitles]}
            </h2>
            
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
              {industryDescriptions[clientData.industry as keyof typeof industryDescriptions]}
            </p>
          </div>

          {/* Sign In Form */}
          <div className="backdrop-blur-sm bg-black/40 rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-2xl font-semibold mb-6">Access Your Dashboard</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50"
                style={{ 
                  backgroundColor: primaryColor,
                  boxShadow: `0 4px 20px ${primaryColor}40`
                }}
              >
                {loading ? 'Signing In...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Custom CSS Injection */}
      {clientData.branding_config.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: clientData.branding_config.custom_css }} />
      )}
    </div>
  )
}