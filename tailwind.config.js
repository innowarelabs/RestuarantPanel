/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "var(--color-primary)",
                "general-text": "var(--general-text)",
                grayColor: "var(--color-grayColor)",
                borderColor: "var(--color-borderColor)",
                "primary-gray": "var(--primary-gray)",
            },
            fontFamily: {
                sans: ['Avenir', 'Inter', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
