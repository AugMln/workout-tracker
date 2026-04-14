/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Couleurs personnalisées pour l'app
      colors: {
        base: '#0D0D0F',
        surface: '#141417',
        card: '#1C1C21',
        border: '#2A2A32',
        accent: {
          DEFAULT: '#6366F1',
          dim: '#312E81',
          glow: 'rgba(99,102,241,0.15)',
        }
      },
      // Polices custom
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
