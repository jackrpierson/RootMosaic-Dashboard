export default function DashboardHeader() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">🔧</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RootMosaic</h1>
              <p className="text-gray-600">Auto Repair Analytics Dashboard</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">AI-Powered Detection</p>
            <p className="text-sm text-gray-500">Mechanical Misdiagnosis & Efficiency</p>
          </div>
        </div>
      </div>
    </header>
  )
} 