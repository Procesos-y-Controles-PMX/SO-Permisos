'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  MODAL_CENTER_VARIANTS,
  SMOOTH_DRAWER_ITEM_VARIANTS,
  SMOOTH_DRAWER_VARIANTS,
} from '@/lib/smoothDrawerMotion'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

const DESKTOP_MEDIA = '(min-width: 640px)'

function subscribeDesktop(callback: () => void) {
  const mq = window.matchMedia(DESKTOP_MEDIA)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_MEDIA).matches
}

function getDesktopServerSnapshot() {
  return false
}

function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getDesktopServerSnapshot)
}

export default function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const isDesktop = useIsDesktop()
  const [mounted, setMounted] = useState(false)
  const [openSession, setOpenSession] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) setOpenSession((n) => n + 1)
  }, [open])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEsc)
        document.body.style.overflow = previousOverflow
      }
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  if (!mounted) return null

  const panelVariants = isDesktop ? MODAL_CENTER_VARIANTS : SMOOTH_DRAWER_VARIANTS
  const motionInitial = reduceMotion ? false : 'hidden'
  const motionAnimate = reduceMotion ? false : 'visible'
  const motionExit = reduceMotion ? undefined : 'hidden'

  return createPortal(
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          key={`modal-overlay-${openSession}`}
          ref={overlayRef}
          className={cn(
            'fixed inset-0 z-[100] flex h-[100dvh] w-full justify-center p-0 sm:p-4 md:p-8',
            isDesktop ? 'items-center' : 'items-end',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose()
          }}
        >
          <motion.div
            className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            key={`modal-panel-${openSession}`}
            className={cn(
              'relative flex w-full max-w-lg flex-col overflow-hidden bg-card shadow-2xl',
              isDesktop
                ? 'max-h-[calc(100dvh-4rem)] self-center rounded-sm'
                : 'max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom)))] self-end rounded-t-sm',
            )}
            initial={motionInitial}
            animate={motionAnimate}
            exit={motionExit}
            variants={panelVariants}
          >
            <motion.div
              className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4 sm:px-6"
              variants={SMOOTH_DRAWER_ITEM_VARIANTS}
            >
              <h3 className="font-display text-lg font-semibold tracking-tight text-fg">{title}</h3>
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
            </motion.div>

            <motion.div
              className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"
              variants={SMOOTH_DRAWER_ITEM_VARIANTS}
            >
              {children}
            </motion.div>

            {actions ? (
              <motion.div
                className="flex shrink-0 flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6"
                variants={SMOOTH_DRAWER_ITEM_VARIANTS}
              >
                {actions}
              </motion.div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
