'use client'

import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Sidebar />
      {/* Main content — default offset for expanded sidebar (250px) */}
      <main className="ml-[250px] min-h-screen transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-8 py-7">
          {children}
        </div>
      </main>
    </div>
  )
}
