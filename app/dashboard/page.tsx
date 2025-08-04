'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // For now, redirect to the analytics dashboard
    // In production, this would check authentication status
    router.push('/analytics')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner w-32 h-32 mx-auto"></div>
        <p className="mt-4 text-gray-300 text-lg">Redirecting to dashboard...</p>
      </div>
    </div>
  )
} 