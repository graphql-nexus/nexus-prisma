/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{ts,tsx}',
    './nextra-theme-docs/**/*.{js,tsx}',
    './pages/**/*.{md,mdx,tsx}',
    './theme.config.tsx',
  ],
  theme: {
    extend: {
      colors: {
        nextraBlue: '#0099FF',
      },
    },
  },
  darkMode: 'class',
}
