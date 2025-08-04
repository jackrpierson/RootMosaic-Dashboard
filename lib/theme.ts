import { createTheme } from '@mantine/core';

export const theme = createTheme({
  /** Enterprise color palette inspired by Fortune 500 companies */
  colors: {
    // Primary brand colors - sophisticated blue-gray
    brand: [
      '#f8fafc', // lightest
      '#f1f5f9',
      '#e2e8f0', 
      '#cbd5e1',
      '#94a3b8',
      '#64748b', // base
      '#475569',
      '#334155',
      '#1e293b',
      '#0f172a'  // darkest
    ],
    // Success colors - refined green
    success: [
      '#f0fdf4',
      '#dcfce7',
      '#bbf7d0',
      '#86efac',
      '#4ade80',
      '#22c55e', // base
      '#16a34a',
      '#15803d',
      '#166534',
      '#14532d'
    ],
    // Warning colors - premium amber
    warning: [
      '#fffbeb',
      '#fef3c7',
      '#fde68a',
      '#fcd34d',
      '#fbbf24',
      '#f59e0b', // base
      '#d97706',
      '#b45309',
      '#92400e',
      '#78350f'
    ],
    // Error colors - sophisticated red
    error: [
      '#fef2f2',
      '#fee2e2',
      '#fecaca',
      '#fca5a5',
      '#f87171',
      '#ef4444', // base
      '#dc2626',
      '#b91c1c',
      '#991b1b',
      '#7f1d1d'
    ],
    // Neutral grays - premium scale
    gray: [
      '#fafafa',
      '#f4f4f5',
      '#e4e4e7',
      '#d4d4d8',
      '#a1a1aa',
      '#71717a',
      '#52525b',
      '#3f3f46',
      '#27272a',
      '#18181b'
    ]
  },

  /** Typography - professional and readable */
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
  },

  /** Spacing and sizing */
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem', 
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  /** Border radius - modern but professional */
  radius: {
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  /** Shadows - subtle enterprise feel */
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  /** Primary color */
  primaryColor: 'brand',
  primaryShade: { light: 5, dark: 6 },

  /** Component defaults */
  defaultRadius: 'md',
  cursorType: 'pointer',

  /** Component-specific theming */
  components: {
    Container: {
      defaultProps: {
        sizes: {
          xs: 540,
          sm: 720,
          md: 960,
          lg: 1140,
          xl: 1320,
        },
      },
    },
    
    Button: {
      defaultProps: {
        variant: 'filled',
        size: 'md',
      },
      styles: {
        root: {
          fontWeight: 500,
          letterSpacing: '0.025em',
        },
      },
    },

    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true,
      },
      styles: {
        root: {
          borderColor: '#e2e8f0',
        },
      },
    },

    Table: {
      styles: {
        th: {
          backgroundColor: '#f8fafc',
          fontWeight: 600,
          fontSize: '0.875rem',
          color: '#475569',
        },
        td: {
          borderBottomColor: '#e2e8f0',
        },
      },
    },

    Badge: {
      styles: {
        root: {
          fontWeight: 500,
          textTransform: 'none',
        },
      },
    },

    Modal: {
      defaultProps: {
        centered: true,
        overlayProps: { backgroundOpacity: 0.55, blur: 3 },
      },
    },

    Notification: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});

/** CSS Variables for additional customization */
export const cssVariables = {
  '--enterprise-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '--success-gradient': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  '--warning-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  '--error-gradient': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  '--glass-bg': 'rgba(255, 255, 255, 0.9)',
  '--glass-border': 'rgba(255, 255, 255, 0.2)',
};