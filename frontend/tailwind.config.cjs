/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'cyber-void':  '#05070B',
        'cyber-base':  '#0A0F16',
        'cyber-card':  '#0D131C',
        'cyber-ele':   '#111923',
        'cyber-border':'#1D2A38',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'cyber-grid': "linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)",
      },
      boxShadow: {
        'cyan-glow':  '0 0 20px rgba(34,211,238,0.2)',
        'green-glow': '0 0 20px rgba(34,197,94,0.2)',
        'red-glow':   '0 0 20px rgba(239,68,68,0.2)',
      },
    },
  },
  plugins: [],
}
