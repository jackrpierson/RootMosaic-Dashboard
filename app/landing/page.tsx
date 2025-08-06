'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, redirect to analytics dashboard - in production this would validate credentials
    window.location.href = '/analytics'
  }

  // Video cycling functionality
  useEffect(() => {
    const videos = [
      '/videos/614440_Doctor Tablet Kid Patient_By_Pressmaster_Artlist_HD.mp4',
      '/videos/165203_Man drilling a screw into wood_By_Max_Freyss_Artlist_HD.mp4',
      '/videos/634257_3d Conveyor Boxes Storage_By_Daniel_Megias_Del_Pozo_Artlist_HD.mp4',
      '/videos/326803_Forklift Shelves Crates Boxes_By_Brad_Day_Artlist_HD.mp4',
      '/videos/54072_Mechanic working on engine in garage_By_Ami_Bornstein_Artlist_HD.mp4'
    ]
    
    let currentVideoIndex = 0
    const videoElement = document.getElementById('heroVideo') as HTMLVideoElement
    
    if (videoElement) {
      const cycleVideos = () => {
        currentVideoIndex = (currentVideoIndex + 1) % videos.length
        const nextVideo = videos[currentVideoIndex]
        
        // Preload the next video
        const tempVideo = document.createElement('video')
        tempVideo.src = nextVideo
        tempVideo.load()
        
        // When the next video is ready, switch to it
        tempVideo.addEventListener('canplaythrough', () => {
          videoElement.src = nextVideo
          videoElement.currentTime = 0
          videoElement.play().catch(error => {
            console.log('Video play failed:', error)
          })
        }, { once: true })
      }
      
      // Set initial video
      videoElement.src = videos[0]
      videoElement.load()
      videoElement.play().catch(error => {
        console.log('Initial video play failed:', error)
      })
      
      // Set up interval to cycle videos every 4 seconds
      const interval = setInterval(cycleVideos, 4000)
      
      // Cleanup interval on component unmount
      return () => clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Video Background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <video
          id="heroVideo"
          className="w-full h-full object-cover transition-opacity duration-500"
          autoPlay
          muted
          playsInline
          src="/videos/614440_Doctor Tablet Kid Patient_By_Pressmaster_Artlist_HD.mp4"
        >
          Your browser does not support the video tag.
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-white">ROOTMOSAIC</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-300 hover:text-white transition-colors">Services</a>
              <a href="#industries" className="text-gray-300 hover:text-white transition-colors">Industries</a>
              <a href="#process" className="text-gray-300 hover:text-white transition-colors">Process</a>
              <a href="#results" className="text-gray-300 hover:text-white transition-colors">Results</a>
            </nav>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSignInOpen(true)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                Book Consultation
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Business growth
                <br />
                <span className="text-blue-400">reimagined.</span>
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                The best way to scale your business without the growing pains.
                <br />
                Unlock hidden profits and streamline operations with data-driven insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center">
                  Book Consultation
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="text-white hover:text-gray-300 transition-colors font-medium flex items-center justify-center">
                  View Results
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="relative">
              {/* Removed the "Growth Analytics Dashboard" box */}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-4 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">47%</div>
              <p className="text-gray-300">Average profit increase</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">$89,000</div>
              <p className="text-gray-300">Average annual savings</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">3.2x</div>
              <p className="text-gray-300">ROI within 12 months</p>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="relative z-10 py-20 px-4 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Industries We Serve</h2>
            <p className="text-xl text-gray-300">Specialized solutions for your unique business challenges</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Auto Repair */}
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Auto Repair</h3>
              <p className="text-gray-300 text-sm">Reduce comebacks, optimize technician efficiency, and increase customer retention</p>
            </div>

            {/* Independent Contractors */}
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 hover:border-green-500/50 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Independent Contractors</h3>
              <p className="text-gray-300 text-sm">Streamline project management, optimize pricing, and scale operations efficiently</p>
            </div>

            {/* Manufacturing */}
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Manufacturing</h3>
              <p className="text-gray-300 text-sm">Optimize production processes, reduce waste, and improve quality control</p>
            </div>

            {/* Logistics */}
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 hover:border-orange-500/50 transition-colors">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Logistics</h3>
              <p className="text-gray-300 text-sm">Optimize routes, reduce delivery times, and improve supply chain efficiency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative z-10 py-20 px-4 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Go beyond traditional consulting</h2>
            <p className="text-xl text-gray-300">
              Data-driven insights and actionable strategies that deliver measurable results
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Efficiency Analysis */}
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Efficiency Analysis</h3>
              <p className="text-gray-300 text-sm mb-4">Identify bottlenecks and optimize your operations for maximum productivity</p>
              <div className="space-y-2 text-sm text-gray-400">
                <div>• Process optimization</div>
                <div>• Resource allocation</div>
                <div>• Time management</div>
              </div>
            </div>

            {/* Growth Strategy */}
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Growth Strategy</h3>
              <p className="text-gray-300 text-sm mb-4">Develop scalable strategies to expand your market reach and increase revenue</p>
              <div className="space-y-2 text-sm text-gray-400">
                <div>• Market analysis</div>
                <div>• Revenue optimization</div>
                <div>• Expansion planning</div>
              </div>
            </div>

            {/* Performance Tracking */}
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Performance Tracking</h3>
              <p className="text-gray-300 text-sm mb-4">Monitor key metrics and track progress with real-time dashboards</p>
              <div className="space-y-2 text-sm text-gray-400">
                <div>• KPI monitoring</div>
                <div>• Progress tracking</div>
                <div>• ROI measurement</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="relative z-10 py-20 px-4 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How We Drive Results</h2>
            <p className="text-xl text-gray-300">A proven methodology that delivers measurable outcomes</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Analyze</h3>
              <p className="text-gray-300 text-sm">Deep dive into your current operations and identify improvement opportunities</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Strategize</h3>
              <p className="text-gray-300 text-sm">Develop customized solutions tailored to your specific business needs</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-400">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Implement</h3>
              <p className="text-gray-300 text-sm">Execute strategies with hands-on support and guidance throughout the process</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-400">4</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Optimize</h3>
              <p className="text-gray-300 text-sm">Continuously monitor and refine strategies for ongoing improvement</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to transform your business?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of small businesses that have increased their profits and streamlined operations
          </p>
          <button className="bg-white text-black px-8 py-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-lg">
            Book Your Free Consultation
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-gray-800/50 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold text-white">ROOTMOSAIC</span>
              </div>
              <p className="text-gray-300 text-sm">
                Empowering small businesses with data-driven growth strategies and operational excellence.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Efficiency Analysis</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Growth Strategy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Performance Tracking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Process Optimization</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Industries</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Auto Repair</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contractors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manufacturing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Logistics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800/50 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2024 RootMosaic. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Sign In Modal */}
      {isSignInOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Sign In</h2>
              <button 
                onClick={() => setIsSignInOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 