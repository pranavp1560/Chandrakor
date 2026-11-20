/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          burgundy: '#6E2638',
          'burgundy-dark': '#521B29',
          gold: '#B69A65',
          charcoal: '#292723',
        },
      },
    },
  },
  plugins: [],
}
