import Link from 'next/link';

export default function DashboardHeader() {
  return (
    <header className="glass border-b border-white/10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">RootMosaic</h1>
              <p className="text-sm text-gray-400 font-medium">
                AI-Powered Process Analytics & Optimization
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/landing" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back to Landing
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">Live Data</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
              <span className="text-sm font-medium text-white">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 