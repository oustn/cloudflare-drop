/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './web/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
