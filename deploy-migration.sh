#!/bin/bash

# RootMosaic Migration Deployment Script
# Migrates from root-mosaic-dashboard to rootmosaic-auto-repair

echo "🚀 Starting RootMosaic Multi-Tenant Migration..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Make sure you're in the root of your RootMosaic project."
  exit 1
fi

# Update package.json name
echo "📝 Updating package.json name..."
if command -v jq &> /dev/null; then
  jq '.name = "rootmosaic-auto-repair"' package.json > package.json.tmp && mv package.json.tmp package.json
else
  echo "⚠️  Warning: jq not found. Please manually update package.json name to 'rootmosaic-auto-repair'"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔧 Building project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
if command -v vercel &> /dev/null; then
  echo "Deploying with production flag..."
  vercel --prod --yes
else
  echo "❌ Error: Vercel CLI not found. Please install with: npm i -g vercel"
  exit 1
fi

echo ""
echo "✅ Migration Deployment Complete!"
echo ""
echo "🔗 Your new application should be available at:"
echo "   https://rootmosaic-auto-repair.vercel.app"
echo ""
echo "📋 Next Steps:"
echo "   1. Set up environment variables in Vercel dashboard:"
echo "      - NEXT_PUBLIC_SUPABASE_URL"
echo "      - NEXT_PUBLIC_SUPABASE_ANON_KEY" 
echo "      - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "   2. Run the database migration:"
echo "      - Execute lib/database/schema.sql in your Supabase SQL editor"
echo "      - Execute migrate-to-multitenant.sql (update values first!)"
echo ""
echo "   3. Access your dashboard at:"
echo "      https://rootmosaic-auto-repair.vercel.app/demo-auto/dashboard"
echo "      (or whatever org slug you chose in the migration)"
echo ""
echo "🎉 Your multi-tenant auto repair analytics platform is ready!"