/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        papaya: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#fecaaa',
          300: '#fda474',
          400: '#fb7a3c',
          500: '#f95816',
          600: '#ea3d0c',
          700: '#c22d0c',
          800: '#9a2612',
          900: '#7c2212',
        },
        ink: {
          900: '#0d0b14',
          800: '#15121f',
          700: '#1e1a2b',
          600: '#2a2540',
          500: '#3a3357',
        },
        grape: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 8px 30px -8px rgba(249, 88, 22, 0.45)',
        card: '0 4px 24px -6px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'pop-in': 'pop-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
}
