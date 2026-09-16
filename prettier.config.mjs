/** @type {import("prettier").Config} */
export default {
  endOfLine: "lf",
  printWidth: 90,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: ["*.md"],
      options: {
        proseWrap: "preserve",
      },
    },
  ],
};
