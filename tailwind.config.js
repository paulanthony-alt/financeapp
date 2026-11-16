/** @type {import('tailwindcss').Config} */
// "Money Bin" theme.
// `slate` is remapped to a warm parchment → ink scale and `brand` to money green,
// so every existing utility class in the app picks up the new look automatically.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#fffaf0',
          100: '#f8eed3',
          200: '#ecdcaf',
          300: '#d9c38a',
          400: '#a8946a',
          500: '#7d6c4c',
          600: '#5e5038',
          700: '#45392a',
          800: '#2f271d',
          900: '#1f1a14',
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
          50: '#fffbea',
          100: '#fff3c4',
          200: '#fce588',
          300: '#fadb5f',
          400: '#f7c948',
          500: '#f0b429',
          600: '#de911d',
          700: '#cb6e17',
          800: '#b44d12',
          900: '#8d2b0b',
        },
        ink: '#2f271d',
        vault: '#0b3b25',
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Luckiest Guy"', 'Nunito', 'cursive'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        comic: '4px 4px 0 0 #2f271d',
        'comic-sm': '2px 2px 0 0 #2f271d',
        'comic-lg': '6px 6px 0 0 #2f271d',
        coin: 'inset 0 -3px 0 0 rgba(141,43,11,.35), inset 0 2px 0 0 rgba(255,255,255,.6)',
      },
      backgroundImage: {
        gold: 'linear-gradient(180deg, #fde68a 0%, #f7c948 45%, #de911d 100%)',
        money: 'linear-gradient(160deg, #157f49 0%, #0f5132 60%, #0b3b25 100%)',
      },
    },
  },
  plugins: [],
}
