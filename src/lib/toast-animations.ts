import { Variants } from 'framer-motion'

// Variantes d'animation pour les toasts
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.85,
    y: -20,
    x: 50,
    filter: 'blur(4px)'
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    filter: 'blur(0px)'
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    x: 100,
    y: -10,
    filter: 'blur(2px)',
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  }
}

// Animation de pile avec effet rebond
export const stackVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: -30
  },
  animate: (index: number) => ({
    opacity: 1,
    scale: 1 - index * 0.02,
    y: index * 8,
    zIndex: 1000 - index,
    transition: {
      type: 'spring',
      duration: 0.6,
      bounce: 0.4,
      stiffness: 300,
      damping: 25,
      delay: index * 0.1
    }
  }),
  hover: (index: number) => ({
    scale: 1.02 - index * 0.02,
    y: index * 8 - 4,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }),
  exit: {
    opacity: 0,
    scale: 0.85,
    x: 120,
    y: -20,
    transition: {
      duration: 0.4,
      ease: 'easeIn'
    }
  }
}

// Animation pour l'icône de fermeture
export const closeButtonVariants: Variants = {
  initial: { 
    opacity: 0.7,
    rotate: 0,
    scale: 1
  },
  animate: { 
    opacity: 1,
    rotate: 0,
    scale: 1
  },
  hover: { 
    scale: 1.1,
    rotate: 90,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: { 
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
}

// Animation pour l'icône de loading
export const loadingIconVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

// Animation pour l'effet de brillance
export const glowVariants: Variants = {
  initial: { opacity: 0 },
  hover: { 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
}

// Configuration des transitions par défaut
export const defaultTransition = {
  type: 'spring' as const,
  duration: 0.5,
  bounce: 0.3,
  stiffness: 200,
  damping: 20
}

// Animation spécifique pour chaque type de toast
export const typeSpecificAnimations = {
  success: {
    initial: { ...toastVariants.initial, scale: 0.8 },
    animate: { 
      ...toastVariants.animate,
      scale: [0.8, 1.05, 1],
      transition: {
        ...defaultTransition,
        times: [0, 0.6, 1]
      }
    }
  },
  error: {
    initial: { ...toastVariants.initial, x: -50 },
    animate: {
      ...toastVariants.animate,
      x: [50, -5, 0],
      transition: {
        ...defaultTransition,
        times: [0, 0.7, 1]
      }
    }
  },
  warning: {
    initial: toastVariants.initial,
    animate: {
      ...toastVariants.animate,
      y: [-20, 5, 0],
      transition: {
        ...defaultTransition,
        times: [0, 0.6, 1]
      }
    }
  },
  info: {
    initial: { ...toastVariants.initial, opacity: 0 },
    animate: {
      ...toastVariants.animate,
      opacity: [0, 0.8, 1],
      transition: {
        ...defaultTransition,
        times: [0, 0.5, 1]
      }
    }
  },
  loading: {
    initial: toastVariants.initial,
    animate: {
      ...toastVariants.animate,
      transition: {
        ...defaultTransition,
        duration: 0.8
      }
    }
  }
}

// Fonction utilitaire pour obtenir l'animation selon le type
export function getAnimationForType(type: string) {
  return typeSpecificAnimations[type as keyof typeof typeSpecificAnimations] || toastVariants
}

// Configuration de l'AnimatePresence pour le conteneur
export const containerAnimationProps = {
  mode: 'popLayout' as const,
  initial: false
}