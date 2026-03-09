/** @type {import('stylelint').Config} */
export default {
  rules: {
    // Classes moeten camelCase zijn
    "selector-class-pattern": "^[a-z]+([A-Z][a-z0-9]+)*$",

    // Kleuren mogen niet bij naam
    "color-named": "never"
  }
};