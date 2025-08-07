'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ClientProvisioningService, ClientProvisioningData, ProvisioningResult } from '@/lib/automation/client-provisioning'

interface Organization {
  id: string
  name: string
  slug: string
  industry: string
  subscription_tier: string
  is_active: boolean
  deployment_status: string
  user_count: number
  data_points: number
  avg_data_source_health: number
  pending_recommendations: number
  last_data_update: string
  created_at: string
}

export default function AdminDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showProvisionForm, setShowProvisionForm] = useState(false)
  const [provisioningData, setProvisioningData] = useState<ClientProvisioningData>({
    organizationName: '',
    organizationSlug: '',
    industry: 'auto-repair',
    subscriptionTier: 'basic',
    adminUser: {
      email: '',
      firstName: '',
      lastName: '',
      phone: ''
    },
    branding: {
      primaryColor: '#1976d2',
      secondaryColor: '#42a5f5'
    },
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      dataRetentionDays: 365
    }
  })
  const [provisioningResult, setProvisioningResult] = useState<ProvisioningResult | null>(null)
  const [isProvisioning, setIsProvisioning] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('org_performance_summary')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading organizations:', error)
        return
      }

      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProvisionClient = async () => {
    setIsProvisioning(true)
    setProvisioningResult(null)

    try {
      const provisioningService = new ClientProvisioningService()
      const result = await provisioningService.provisionNewClient(provisioningData)
      
      setProvisioningResult(result)
      
      if (result.success) {
        // Reset form
        setProvisioningData({
          organizationName: '',
          organizationSlug: '',
          industry: 'auto-repair',
          subscriptionTier: 'basic',
          adminUser: {
            email: '',
            firstName: '',
            lastName: '',
            phone: ''
          },
          branding: {
            primaryColor: '#1976d2',
            secondaryColor: '#42a5f5'
          },
          settings: {
            timezone: 'America/New_York',
            currency: 'USD',
            dataRetentionDays: 365
          }
        })
        
        // Reload organizations
        await loadOrganizations()
        
        // Auto-hide form after 5 seconds
        setTimeout(() => {
          setShowProvisionForm(false)
          setProvisioningResult(null)
        }, 5000)
      }
    } catch (error) {
      console.error('Provisioning error:', error)
      setProvisioningResult({
        success: false,
        error: 'Unexpected error during client provisioning'
      })
    } finally {
      setIsProvisioning(false)
    }
  }

  const toggleOrganizationStatus = async (orgId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: !currentStatus })
        .eq('id', orgId)

      if (!error) {
        await loadOrganizations()
      }
    } catch (error) {
      console.error('Error updating organization status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'suspended': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getIndustryColor = (industry: string) => {
    switch (industry) {
      case 'auto-repair': return 'bg-blue-100 text-blue-800'
      case 'contractors': return 'bg-orange-100 text-orange-800'
      case 'property-management': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">RootMosaic Admin</h1>
            <button
              onClick={() => setShowProvisionForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Client
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Clients</h3>
            <p className="text-3xl font-bold text-blue-600">{organizations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Active Clients</h3>
            <p className="text-3xl font-bold text-green-600">
              {organizations.filter(org => org.is_active).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
            <p className="text-3xl font-bold text-purple-600">
              {organizations.reduce((sum, org) => sum + (org.user_count || 0), 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Data Points</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {organizations.reduce((sum, org) => sum + (org.data_points || 0), 0)}
            </p>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Client Organizations</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Health
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">/{org.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getIndustryColor(org.industry)}`}>
                        {org.industry}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getStatusColor(org.deployment_status)}`}>
                        {org.deployment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {org.user_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${org.avg_data_source_health || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.round(org.avg_data_source_health || 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => window.open(`/${org.slug}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Visit
                      </button>
                      <button
                        onClick={() => toggleOrganizationStatus(org.id, org.is_active)}
                        className={`${org.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {org.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Provisioning Modal */}
      {showProvisionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Provision New Client</h2>
            
            {provisioningResult && (
              <div className={`p-4 rounded-lg mb-6 ${
                provisioningResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {provisioningResult.success ? (
                  <div>
                    <p className="font-semibold">✅ Client Provisioned Successfully!</p>
                    <p>Access URL: <a href={provisioningResult.accessUrl} target="_blank" className="underline">
                      {provisioningResult.accessUrl}
                    </a></p>
                    {provisioningResult.warnings && (
                      <div className="mt-2">
                        <p className="font-semibold">Warnings:</p>
                        {provisioningResult.warnings.map((warning, i) => (
                          <p key={i} className="text-sm">• {warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p>❌ Error: {provisioningResult.error}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organization Details */}
              <div>
                <label className="block text-sm font-medium mb-2">Organization Name</label>
                <input
                  type="text"
                  value={provisioningData.organizationName}
                  onChange={(e) => setProvisioningData(prev => ({ ...prev, organizationName: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="ABC Auto Repair"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Organization Slug</label>
                <input
                  type="text"
                  value={provisioningData.organizationSlug}
                  onChange={(e) => setProvisioningData(prev => ({ 
                    ...prev, 
                    organizationSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                  }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="abc-auto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <select
                  value={provisioningData.industry}
                  onChange={(e) => setProvisioningData(prev => ({ 
                    ...prev, 
                    industry: e.target.value as any
                  }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="auto-repair">Auto Repair</option>
                  <option value="contractors">Contractors</option>
                  <option value="property-management">Property Management</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subscription Tier</label>
                <select
                  value={provisioningData.subscriptionTier}
                  onChange={(e) => setProvisioningData(prev => ({ 
                    ...prev, 
                    subscriptionTier: e.target.value as any
                  }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {/* Admin User Details */}
              <div>
                <label className="block text-sm font-medium mb-2">Admin Email</label>
                <input
                  type="email"
                  value={provisioningData.adminUser.email}
                  onChange={(e) => setProvisioningData(prev => ({ 
                    ...prev, 
                    adminUser: { ...prev.adminUser, email: e.target.value }
                  }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="admin@abcauto.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Admin First Name</label>
                <input
                  type="text"
                  value={provisioningData.adminUser.firstName}
                  onChange={(e) => setProvisioningData(prev => ({ 
                    ...prev, 
                    adminUser: { ...prev.adminUser, firstName: e.target.value }
                  }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Admin Last Name</label>
                <input
                  type="text"
                  value={provisioningData.adminUser.lastName}
                  onChange={(e) => setProvisioningData(prev => ({ 
                    ...prev, 
                    adminUser: { ...prev.adminUser, lastName: e.target.value }
                  }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <input
                  type="color"
                  value={provisioningData.branding.primaryColor}
                  onChange={(e) => setProvisioningData(prev => ({ 
                    ...prev, 
                    branding: { ...prev.branding, primaryColor: e.target.value }
                  }))}
                  className="w-full p-2 border rounded-lg h-10"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowProvisionForm(false)
                  setProvisioningResult(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isProvisioning}
              >
                Cancel
              </button>
              <button
                onClick={handleProvisionClient}
                disabled={isProvisioning}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProvisioning ? 'Provisioning...' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}