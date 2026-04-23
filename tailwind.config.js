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
                sans: ['"Sofia Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                /** Legacy alias — same stack as admin-panel */
                poppins: ['"Sofia Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
