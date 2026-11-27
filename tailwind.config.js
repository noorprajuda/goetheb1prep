/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "361px", // Small phones (iPhone SE, small Androids)
        sm: "481px", // Medium phones (iPhone 12/13/14/15, Galaxy S, Pixel)
        md: "641px", // Large phones (Plus/Max iPhones, large Androids)
        lg: "769px", // Tablet Portrait (iPad Mini, Android tablets)
        xl: "1025px", // Tablet Landscape / Small Laptop (iPad Pro 11", small laptops)
        "2xl": "1281px", // Laptop / Desktop (Standard monitors)
        "3xl": "1441px", // Large Desktop (2K, 4K displays)
      },
    },
  },
  plugins: [],
};
