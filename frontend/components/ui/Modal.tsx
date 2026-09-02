'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

function lockBodyScroll() {
  const scrollY = window.scrollY
  const previous = {
    overflow: document.body.style.overflow,
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
  }

  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.width = '100%'

  return () => {
    document.body.style.overflow = previous.overflow
    document.body.style.position = previous.position
    document.body.style.top = previous.top
    document.body.style.width = previous.width
    window.scrollTo(0, scrollY)
  }
}

export default function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      const unlockScroll = lockBodyScroll()
      return () => {
        document.removeEventListener('keydown', handleEsc)
        unlockScroll()
      }
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="absolute left-1/2 top-1/2 z-10 flex max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom)))] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-sm bg-card shadow-2xl sm:w-full"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h3 id="modal-title" className="font-display text-lg font-semibold tracking-tight text-fg">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-fg-faint transition-colors hover:bg-muted-strong hover:text-fg-muted"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
            {actions}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
