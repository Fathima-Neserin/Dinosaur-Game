// client/postcss.config.js - CORRECTED
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // <-- CORRECT reference to the new package
    autoprefixer: {},
  },
}