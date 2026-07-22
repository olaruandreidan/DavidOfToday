/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1020',
        paper: '#f5f1e8',
        coral: '#ff7657',
        mint: '#68d5b5',
        sky: '#87bdf5'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'Cambria', 'serif']
      },
      boxShadow: { soft: '0 18px 50px rgba(11, 16, 32, 0.12)' }
    }
  },
  plugins: []
}

