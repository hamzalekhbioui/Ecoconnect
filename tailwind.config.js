/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
        "./frontend/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#13ec5b",
                "primary-dark": "#0db846",
                "secondary": "#0d1b12",
                "background-light": "#f8fcf9",
                "background-dark": "#102216",
                "card-bg-light": "#ffffff",
                "card-bg-dark": "#1a3322",
                "border-light": "#e7f3eb",
                "border-dark": "#2a4a35",
                "text-primary-light": "#0d1b12",
                "text-primary-dark": "#e7f3eb",
                "text-secondary-light": "#4c9a66",
                "text-secondary-dark": "#8bc49e",
                brand: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    900: '#14532d',
                }
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                "DEFAULT": "0.375rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
