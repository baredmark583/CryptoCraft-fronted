/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        retro: {
          "base-100": "oklch(91.637% 0.034 90.515)",
          "base-200": "oklch(88.272% 0.049 91.774)",
          "base-300": "oklch(84.133% 0.065 90.856)",
          "base-content": "oklch(41% 0.112 45.904)",
          "primary": "oklch(80% 0.114 19.571)",
          "primary-content": "oklch(39% 0.141 25.723)",
          "secondary": "oklch(92% 0.084 155.995)",
          "secondary-content": "oklch(44% 0.119 151.328)",
          "accent": "oklch(68% 0.162 75.834)",
          "accent-content": "oklch(41% 0.112 45.904)",
          "neutral": "oklch(44% 0.011 73.639)",
          "neutral-content": "oklch(86% 0.005 56.366)",
          "info": "oklch(58% 0.158 241.966)",
          "info-content": "oklch(96% 0.059 95.617)",
          "success": "oklch(51% 0.096 186.391)",
          "success-content": "oklch(96% 0.059 95.617)",
          "warning": "oklch(64% 0.222 41.116)",
          "warning-content": "oklch(96% 0.059 95.617)",
          "error": "oklch(70% 0.191 22.216)",
          "error-content": "oklch(40% 0.123 38.172)",
          "--rounded-box": "2rem",
          "--rounded-btn": "2rem",
          "--rounded-badge": "2rem",
        },
      },
    ],
  },
}
