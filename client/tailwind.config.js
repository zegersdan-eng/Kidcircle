/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          dark: '#4338ca',
          light: '#818cf8',
        },
        secondary: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        gold: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f9fafb',
        },
        text: {
          DEFAULT: '#1f2937',
          light: '#6b7280',
          muted: '#9ca3af',
        },
        trusted: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
      },
      maxWidth: {
        'mobile': '480px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}