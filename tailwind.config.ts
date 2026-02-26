import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#F4F2ED',
          100: '#ECE8E0',
          200: '#E0DAD0',
          300: '#CFC7BA',
        },
        brown: {
          900: '#2A2118',
          800: '#3A2F24',
          700: '#4F4133',
          600: '#6B5D4F',
          400: '#9A8878',
          300: '#BBA898',
          200: '#D4C5B5',
        },
        accent: {
          DEFAULT: '#3B5A40',
          hover:   '#2D4632',
          light:   '#B8CEB9',
          muted:   '#7A9B80',
        },
      },
      fontFamily: {
        heading: ['Georgia', 'Times New Roman', 'serif'],
        body: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      lineHeight: {
        relaxed: '1.7',
      },
    },
  },
  plugins: [],
} satisfies Config
