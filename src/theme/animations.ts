// Define keyframes and animation configurations
export const keyframes = {
  'accordion-down': {
    from: { height: '0' },
    to: { height: 'var(--radix-accordion-content-height)' }
  },
  'accordion-up': {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: '0' }
  },
  'slide-in-left': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(0)' }
  },
  'slide-out-left': {
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-100%)' }
  },
  'slide-in-right': {
    '0%': { transform: 'translateX(100%)' },
    '100%': { transform: 'translateX(0)' }
  },
  'slide-out-right': {
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(100%)' }
  },
  gradient: {
    "0%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
    "100%": { backgroundPosition: "0% 50%" },
  }
}

export const animation = {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up': 'accordion-up 0.2s ease-out',
  'slide-in-left': 'slide-in-left 0.3s ease-out',
  'slide-out-left': 'slide-out-left 0.3s ease-out',
  'slide-in-right': 'slide-in-right 0.3s ease-out',
  'slide-out-right': 'slide-out-right 0.3s ease-out',
  gradient: "gradient var(--animation-duration, 8s) linear infinite",
}