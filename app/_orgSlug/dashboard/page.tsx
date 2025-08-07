'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MetricsGrid from '@/components/MetricsGrid'
import TechnicianAnalysis from '@/components/TechnicianAnalysis'
import FinancialCalculator from '@/components/FinancialCalculator'
import AlertsSection from '@/components/AlertsSection'
import SystemicIssues from '@/components/SystemicIssues'
import PredictiveAnalytics from '@/components/PredictiveAnalytics'
import FiltersPanel from '@/components/FiltersPanel'
import DashboardHeader from '@/components/DashboardHeader'

export default function OrganizationDashboard() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string
  
  const [dateRange, setDateRange] = useState([30, 0])
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([])
  const [selectedMakes, setSelectedMakes] = useState<string[]>([])
  const [lossThreshold, setLossThreshold] = useState(1000)

  useEffect(() => {
    // Validate organization access here
    if (!orgSlug) {
      router.push('/landing')
      return
    }
  }, [orgSlug, router])

  if (!orgSlug) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <DashboardHeader orgSlug={orgSlug} />
      
      <div className="container mx-auto px-6 py-8">
        <FiltersPanel
          dateRange={dateRange}
          setDateRange={setDateRange}
          selectedTechnicians={selectedTechnicians}
          setSelectedTechnicians={setSelectedTechnicians}
          selectedMakes={selectedMakes}
          setSelectedMakes={setSelectedMakes}
          lossThreshold={lossThreshold}
          setLossThreshold={setLossThreshold}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
          <div className="xl:col-span-2">
            <MetricsGrid
              dateRange={dateRange}
              selectedTechnicians={selectedTechnicians}
              selectedMakes={selectedMakes}
              lossThreshold={lossThreshold}
            />
          </div>
          
          <div className="space-y-6">
            <AlertsSection />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <TechnicianAnalysis
            dateRange={dateRange}
            selectedTechnicians={selectedTechnicians}
          />
          <SystemicIssues 
            dateRange={dateRange}
            selectedMakes={selectedMakes}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <FinancialCalculator
            dateRange={dateRange}
            lossThreshold={lossThreshold}
          />
          <PredictiveAnalytics />
        </div>
      </div>
    </div>
  )
}