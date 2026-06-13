/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'neu': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neu-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
      },
      borderWidth: {
        '4': '4px',
      }
    },
  },
  plugins: [],
}