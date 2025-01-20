/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Add all paths containing Angular components and templates
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui"), // Include DaisyUI as a plugin
  ],
};
