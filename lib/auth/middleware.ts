import { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { Organization, User } from '../types/client'

export interface AuthContext {
  user: User
  organization: Organization
  permissions: string[]
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  try {
    const supabase = createMiddlewareClient({ req: request, res: new Response() })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    // Get user with organization data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organizations (*)
      `)
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) return null

    return {
      user: userData,
      organization: userData.organizations,
      permissions: userData.permissions || []
    }
  } catch (error) {
    console.error('Auth context error:', error)
    return null
  }
}

export async function getOrgBySlug(slug: string, supabase: any): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('admin')
}

export function canAccessOrganization(user: User, orgId: string): boolean {
  return user.org_id === orgId || user.permissions.includes('super_admin')
}

export class AuthError extends Error {
  constructor(message: string, public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND') {
    super(message)
    this.name = 'AuthError'
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const context = await getAuthContext(request)
  if (!context) {
    throw new AuthError('Authentication required', 'UNAUTHORIZED')
  }
  return context
}

export async function requirePermission(
  request: NextRequest, 
  permission: string
): Promise<AuthContext> {
  const context = await requireAuth(request)
  
  if (!hasPermission(context.permissions, permission)) {
    throw new AuthError('Insufficient permissions', 'FORBIDDEN')
  }
  
  return context
}

export async function requireOrganizationAccess(
  request: NextRequest,
  orgSlug: string
): Promise<AuthContext> {
  const context = await requireAuth(request)
  
  if (context.organization.slug !== orgSlug && !context.permissions.includes('super_admin')) {
    throw new AuthError('Organization access denied', 'FORBIDDEN')
  }
  
  return context
}