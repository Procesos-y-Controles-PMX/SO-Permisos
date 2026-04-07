'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface UIContextType {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Try to load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar_collapsed')
    if (stored === 'true') {
      setSidebarCollapsed(true)
    }
  }, [])

  // Persist to localStorage
  const handleSetCollapsed = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
    localStorage.setItem('sidebar_collapsed', String(collapsed))
  }

  const toggleSidebar = () => handleSetCollapsed(!sidebarCollapsed)

  return (
    <UIContext.Provider value={{
      sidebarCollapsed,
      setSidebarCollapsed: handleSetCollapsed,
      toggleSidebar
    }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}
