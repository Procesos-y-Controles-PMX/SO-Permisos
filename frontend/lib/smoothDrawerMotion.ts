/** Motion variants from KokonutUI smooth-drawer — shared by production sheet modals (ported from Equipo-Móvil). */
export const SMOOTH_DRAWER_VARIANTS = {
  hidden: {
    y: '100%',
    opacity: 0,
    rotateX: 5,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
      staggerChildren: 0.07,
      delayChildren: 0.12,
    },
  },
} as const

/** Centered dialog on sm+ viewports — avoids bottom-sheet y:100% getting stuck after SPA navigation. */
export const MODAL_CENTER_VARIANTS = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 10,
    transition: {
      duration: 0.18,
      ease: [0.32, 0.72, 0, 1],
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 32,
      mass: 0.75,
      staggerChildren: 0.06,
      delayChildren: 0.06,
    },
  },
} as const

export const SMOOTH_DRAWER_ITEM_VARIANTS = {
  hidden: {
    y: 16,
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
} as const
