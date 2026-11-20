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
          ivory: '#F8F5EF',
          cream: '#EFE7DA',
          burgundy: '#6E2638',
          'burgundy-dark': '#521B29',
          'burgundy-light': '#893448',
          maroon: '#823B4B',
          gold: '#B69A65',
          'gold-light': '#D4C094',
          charcoal: '#292723',
          'warm-grey': '#77736C',
          'light-border': '#E4DCD3',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
