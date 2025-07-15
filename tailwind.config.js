/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'apple': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        'system': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        'sans': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        // Override default black with beige/brown tones
        black: {
          DEFAULT: '#8B7355', // Dark beige instead of pure black
          50: '#F5F3F0',
          100: '#E8E3DB',
          200: '#D4C7B7',
          300: '#C0AB93',
          400: '#AC8F6F',
          500: '#8B7355', // Main dark beige
          600: '#6F5C44',
          700: '#534533',
          800: '#372E22',
          900: '#1B1711',
        },
        // Add beige color palette
        beige: {
          50: '#FEFCF9',
          100: '#FDF8F1',
          200: '#FAF0E1',
          300: '#F7E8D1',
          400: '#F4E0C1',
          500: '#F1D8B1', // Main beige
          600: '#E8C794',
          700: '#DFB677',
          800: '#D6A55A',
          900: '#CD943D',
        },
        // Add warm brown palette
        brown: {
          50: '#F9F7F4',
          100: '#F0EBE3',
          200: '#E1D7C7',
          300: '#D2C3AB',
          400: '#C3AF8F',
          500: '#B49B73', // Warm brown
          600: '#9A8660',
          700: '#80714D',
          800: '#665C3A',
          900: '#4C4727',
        }
      },
      backgroundColor: {
        // Custom background colors
        'primary': '#FEFCF9', // Very light beige
        'secondary': '#F1D8B1', // Main beige
        'accent': '#8B7355', // Dark beige
      },
      textColor: {
        // Custom text colors
        'primary': '#5D4E37', // Dark brown
        'secondary': '#8B7355', // Dark beige
        'muted': '#A0916B', // Medium beige
      },
      borderColor: {
        // Custom border colors
        'primary': '#E8C794', // Light beige
        'secondary': '#8B7355', // Dark beige
      }
    },
  },
  plugins: [],
}
