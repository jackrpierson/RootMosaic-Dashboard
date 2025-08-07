# RootMosaic Multi-Tenant Deployment Guide

## Architecture Overview

RootMosaic is now a multi-tenant SaaS platform that supports different industry verticals through separate Vercel deployments. Each industry gets its own branded application with industry-specific components and configurations.

## Supported Industries

1. **Auto Repair Shops** - `auto-repair`
2. **Independent Contractors** - `contractors` 
3. **Property Management** - `property-management`

## Quick Start

### 1. Database Setup

```bash
# Run the schema in your Supabase database
psql -h your-supabase-host -U postgres -d postgres -f lib/database/schema.sql
```

### 2. Environment Variables

Set these in your Vercel dashboard for each deployment:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 3. Deploy Each Industry

```bash
# Auto repair shops
./deployment/deploy-scripts/deploy.sh auto-repair production

# Independent contractors  
./deployment/deploy-scripts/deploy.sh contractors production

# Property management
./deployment/deploy-scripts/deploy.sh property-management production
```

## How to Use the System

### 1. Create Organizations

Each client gets their own organization in the database:

```sql
INSERT INTO organizations (name, slug, industry, subscription_tier) 
VALUES ('ABC Auto Repair', 'abc-auto', 'auto-repair', 'pro');
```

### 2. Create Users

```sql
INSERT INTO users (email, org_id, role, profile_data)
VALUES ('owner@abcauto.com', 'org-uuid', 'admin', '{"first_name": "John", "last_name": "Smith"}');
```

### 3. Access Client Dashboards

Clients access their dashboard at:
- `https://rootmosaic-auto-repair.vercel.app/abc-auto/dashboard`
- `https://rootmosaic-contractors.vercel.app/client-slug/dashboard`

## Key Features

### Multi-Tenancy
- **Data Isolation**: Row-level security ensures clients only see their data
- **Custom Branding**: Each org can customize colors, logos, and styling
- **Industry-Specific**: Components and metrics tailored per industry

### Dynamic Dashboards
- **Component Registry**: Pluggable component system
- **Auto-Configuration**: Default layouts based on industry
- **Customizable**: Clients can modify their dashboard layout

### Security
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based permissions (admin, manager, analyst, viewer)
- **Data Access**: Organization context enforced at API level

## API Structure

```
/api/[orgSlug]/data         # Get/Post client data
/api/[orgSlug]/dashboard    # Get/Update dashboard config
```

## Component System

### Industry Components
```typescript
// Auto Repair
components/industries/auto-repair/AutoRepairMetrics.tsx
components/industries/auto-repair/AutoRepairTechnicians.tsx
components/industries/auto-repair/AutoRepairFinancials.tsx

// Contractors
components/industries/contractors/ContractorJobs.tsx
components/industries/contractors/ContractorRevenue.tsx
components/industries/contractors/ContractorLeads.tsx

// Property Management  
components/industries/property-management/PropertyOccupancy.tsx
components/industries/property-management/PropertyMaintenance.tsx
components/industries/property-management/PropertyFinancials.tsx
```

### Generic Components
```typescript
components/generic/GenericKPI.tsx
components/generic/GenericChart.tsx
components/generic/GenericTable.tsx
components/generic/GenericGauge.tsx
```

## Deployment URLs

After deployment, your applications will be available at:

- **Auto Repair**: `https://rootmosaic-auto-repair.vercel.app`
- **Contractors**: `https://rootmosaic-contractors.vercel.app` 
- **Property Management**: `https://rootmosaic-property-mgmt.vercel.app`

## Adding New Industries

1. Create industry config in `components/DashboardRegistry.tsx`
2. Build industry-specific components in `components/industries/[industry]/`
3. Create Vercel config in `deployment/vercel-configs/[industry].json`
4. Deploy with `./deploy.sh [industry] production`

## Data Flow

1. **Client Login** → Supabase Auth
2. **Dashboard Load** → `/api/[orgSlug]/dashboard` → Client Profile
3. **Component Render** → Dynamic components based on profile
4. **Data Fetch** → `/api/[orgSlug]/data` → Organization-specific data
5. **Real-time Updates** → SWR with 5-minute cache

## Performance Features

- **Caching**: SWR with 5-minute intervals
- **Batching**: Large dataset handling with pagination
- **CDN**: Static assets via Vercel's global CDN
- **Optimization**: Industry-specific bundle splitting

The system is now ready for multi-tenant SaaS operation with industry-specific deployments!