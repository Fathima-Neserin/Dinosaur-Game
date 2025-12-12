/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // CRITICAL: Scans all your React files for utility classes
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}