/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    extend: {
      colors: {
        gold: {
          50: '#FDFBF7',
          100: '#FBF7EF',
          200: '#F6EED8',
          300: '#ECE0BA',
          400: '#E0CC94',
          500: '#D4AF37', // Master Gold Accent
          600: '#B89327',
          700: '#91711A',
          800: '#6C5314',
          900: '#4A3910',
        },
        charcoal: {
          800: '#1E1E1E',
          900: '#121212', // Master Luxury Velvet Charcoal
          950: '#0A0A0A',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
};
