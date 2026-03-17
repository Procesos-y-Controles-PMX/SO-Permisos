'use client'

import { useState } from 'react'

interface Tab {
  key: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (key: string) => void
}

export default function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key || '')

  const handleClick = (key: string) => {
    setActive(key)
    onChange?.(key)
  }

  return (
    <div className="inline-flex bg-white border border-gray-100 rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          className={`
            flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg
            transition-all duration-200
            ${active === tab.key
              ? 'bg-white text-red-600 shadow-sm border border-gray-100'
              : 'text-gray-400 hover:text-gray-600'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
