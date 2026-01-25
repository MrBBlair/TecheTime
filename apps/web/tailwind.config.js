/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'royal-purple': '#4B2E83',
        'old-gold': '#C9A227',
        'charcoal': '#2C2C2C',
        'off-white': '#FAFAFA',
        'light-gray': '#E5E5E5',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
