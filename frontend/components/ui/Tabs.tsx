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
    <div className="inline-flex rounded-sm border border-slate-200 bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          className={`
            flex items-center gap-1.5 rounded-sm px-4 py-2 text-[13px] font-medium
            transition-all duration-200
            ${active === tab.key
              ? 'border border-slate-200 bg-white text-brand shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
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
