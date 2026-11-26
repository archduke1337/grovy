module.exports = {
  plugins: {
    // Tailwind v4 handles vendor prefixing itself; autoprefixer would
    // duplicate that work and is no longer a dependency.
    "@tailwindcss/postcss": {},
  },
};
