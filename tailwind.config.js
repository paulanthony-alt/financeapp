/** @type {import('tailwindcss').Config} */
// "Private bank" theme — deep green, gold accents, warm ivory.
// `slate` is remapped to a warm parchment → ink scale and `brand` to money green,
// so every existing utility class in the app picks up the new look automatically.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // Fully squared-off look: every rounded-* utility resolves to 0.
    borderRadius: {
      none: '0', sm: '0', DEFAULT: '0', md: '0', lg: '0', xl: '0', '2xl': '0', '3xl': '0', full: '0',
    },
    extend: {
      colors: {
        slate: {
          50: '#fbf9f4',
          100: '#f4efe4',
          200: '#e7dfcf',
          300: '#d3c8b2',
          400: '#a39a88',
          500: '#746c5e',
          600: '#574f44',
          700: '#3f3a32',
          800: '#2a2620',
          900: '#1a1814',
        },
        brand: {
          50: '#ecfbf1',
          100: '#d2f4de',
          200: '#a6e8bf',
          300: '#6fd59a',
          400: '#3dbb76',
          500: '#1f9d5c',
          600: '#157f49',
          700: '#12663c',
          800: '#0f5132',
          900: '#0b3b25',
        },
        gold: {
          50: '#fdf8ec',
          100: '#f9edcc',
          200: '#f2db99',
          300: '#e9c46a',
          400: '#e0b04a',
          500: '#c9962c',
          600: '#a97a1f',
          700: '#876019',
          800: '#6b4c16',
          900: '#4f3812',
        },
        ink: '#1a1814',
        vault: '#0b3b25',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,26,20,.05), 0 10px 30px -18px rgba(31,26,20,.35)',
        lift: '0 1px 2px rgba(31,26,20,.08), 0 18px 40px -20px rgba(31,26,20,.45)',
      },
      backgroundImage: {
        gold: 'linear-gradient(180deg, #f9d77a 0%, #e9b23c 55%, #cf921f 100%)',
        money: 'linear-gradient(170deg, #0f5132 0%, #0b3b25 55%, #082c1c 100%)',
      },
    },
  },
  plugins: [],
}
