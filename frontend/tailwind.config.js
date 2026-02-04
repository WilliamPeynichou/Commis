/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pale-yellow': '#FFF4B5',
        'mauve': {
          DEFAULT: '#B19CD9',
          light: '#C9B8E8',
          dark: '#8B74BF',
        },
        'dark-orange': {
          DEFAULT: '#D96846',
          light: '#E8845F',
          dark: '#C45232',
        },
        'off-white': '#FFFEF7',
        'deep-black': '#1A1A1A',
        'mint': '#A8E6CF',
        'blush': '#FFB7B2',
        'sky': '#87CEEB',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px rgba(26, 26, 26, 1)',
        'brutal-hover': '6px 6px 0px 0px rgba(26, 26, 26, 1)',
        'brutal-active': '2px 2px 0px 0px rgba(26, 26, 26, 1)',
        'brutal-lg': '8px 8px 0px 0px rgba(26, 26, 26, 0.2)',
        'brutal-xl': '12px 12px 0px 0px rgba(26, 26, 26, 0.15)',
        'brutal-mauve': '4px 4px 0px 0px rgba(177, 156, 217, 0.6)',
        'brutal-3d': '0 6px 0 0 rgba(26, 26, 26, 0.8), 0 8px 20px rgba(26, 26, 26, 0.15)',
        'brutal-3d-hover': '0 8px 0 0 rgba(26, 26, 26, 0.8), 0 12px 30px rgba(26, 26, 26, 0.2)',
        'brutal-3d-active': '0 2px 0 0 rgba(26, 26, 26, 0.8), 0 3px 8px rgba(26, 26, 26, 0.1)',
        'card-float': '0 20px 60px rgba(26, 26, 26, 0.08), 0 8px 20px rgba(26, 26, 26, 0.06)',
        'card-hover': '0 30px 80px rgba(26, 26, 26, 0.12), 0 12px 30px rgba(26, 26, 26, 0.08)',
        'glass': '0 8px 32px rgba(26, 26, 26, 0.08)',
        'inner-glow': 'inset 0 2px 4px rgba(255, 255, 255, 0.6)',
      },
      borderRadius: {
        'brutal': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'spin-thick': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '50%': { transform: 'scale(1)', opacity: '0.4' },
          '100%': { transform: 'scale(0.8)', opacity: '0.8' },
        },
        'card-enter': {
          '0%': { transform: 'perspective(1000px) rotateY(-15deg) translateZ(-60px)', opacity: '0' },
          '100%': { transform: 'perspective(1000px) rotateY(0deg) translateZ(0px)', opacity: '1' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'slide-up': 'slide-up 0.4s ease-out',
        'spin-thick': 'spin-thick 1s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        'card-enter': 'card-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'wiggle': 'wiggle 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
};
