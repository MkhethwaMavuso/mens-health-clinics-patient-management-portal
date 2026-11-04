/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#173f3a',
        paper: '#f5f3ed',
        coral: '#df765c',
        moss: '#8fa68a'
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif']
      }
    }
  },
  plugins: []
};