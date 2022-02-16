module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "eslint-config-airbnb-base", "prettier"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "no-restricted-syntax": "off",
    "no-continue": "off",
    "no-await-in-loop": "off",
    "no-underscore-dangle": "off",
    "no-plusplus": "off",
    "no-return-await": "off",

    // off because it is a must for this version of node?
    "import/extensions": "off",
  },
};
