/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Model provider colors
        'gpt': '#10a37f',
        'claude': '#d4a373',
        'gemini': '#4285f4',
        'deepseek': '#8b5cf6',
        'grok': '#000000',
      },
    },
  },
  plugins: [],
};
