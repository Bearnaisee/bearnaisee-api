module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "eslint-config-airbnb-base",
    "prettier",
  ],
  rules: {
    "import/prefer-default-export": "off",
    "import/no-unresolved": "off",
    "import/extensions": "off",

    "no-console": "off",
  },
};
