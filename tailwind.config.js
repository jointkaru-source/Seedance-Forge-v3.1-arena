/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#09090b',
          panel: '#141416',
          glass: 'rgba(20,20,22,0.85)',
          border: 'rgba(255,255,255,0.08)',
          accent: '#f59e0b',
          muted: '#71717a',
          line: '#27272a',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono','ui-monospace','SFMono-Regular','monospace'],
        sans: ['Inter','system-ui','sans-serif'],
        display: ['Space Grotesk','sans-serif'],
      }
    }
  },
  plugins: []
}
