'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface SheetModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
}

/** Bottom-anchored sheet — rises from the bottom edge and stretches to ~85vh (Equipo-Móvil pattern). */
export default function SheetModal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-2xl',
}: SheetModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
      sheetRef.current?.focus()
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="absolute inset-0 animate-[sheet-overlay-in_200ms_ease-out] bg-black/40 backdrop-blur-sm" />

      <div
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-modal-title"
        className={cn(
          'relative flex w-full min-h-[min(85vh,920px)] max-h-[min(92vh,920px)] flex-col',
          'animate-[sheet-slide-up_280ms_cubic-bezier(0.32,0.72,0,1)]',
          'rounded-t-sm border border-slate-200 bg-white shadow-2xl',
          'pb-[env(safe-area-inset-bottom,0px)]',
          maxWidth,
        )}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3 sm:px-6">
          <h2
            id="sheet-modal-title"
            className="font-display text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
