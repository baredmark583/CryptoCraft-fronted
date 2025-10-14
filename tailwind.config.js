import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: [
      {
        sandboard: {
          "primary": "#f59e0b", // amber-500
          "primary-content": "#78350f", // amber-900
          "secondary": "#a16207", // yellow-700
          "accent": "#f97316", // orange-500
          "neutral": "#44403c", // stone-700
          "base-100": "#ffffff",
          "base-200": "#fffbeb", // amber-50
          "base-300": "#fef3c7", // amber-100
          "base-content": "#78350f", // amber-900
          "info": "#38bdf8",
          "success": "#34d399",
          "warning": "#fbbf24",
          "error": "#f87171",
          
          "--rounded-box": "1rem",
          "--rounded-btn": "0.75rem",
          "--rounded-badge": "1.5rem",
        },
      },
    ],
  },
}