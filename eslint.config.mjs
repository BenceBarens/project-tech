import js from "@eslint/js"

//Regels opgesteld door Gemini 3 (Denken-modus) https://gemini.google.com/share/60c3620cdc8d
export default [
  js.configs.recommended,
  {
    rules: {
      // 1. Geen puntkomma's
      "semi": ["error", "never"],

      // 2. camelCase voor namen
      "camelcase": "error",

      // 3. Verbied specifieke zaken (Arrow functies, Template literals, etc.)
      "no-restricted-syntax": [
        "error",
        {
          "selector": "ArrowFunctionExpression",
          "message": "Gebruik geen arrow-functies; schrijf functies volledig uit."
        },
        {
          "selector": "TemplateLiteral",
          "message": "Gebruik +-operators voor tekst, geen template literals (backticks)."
        },
        {
          "selector": "FunctionDeclaration[params.length>1]",
          "message": "Functies met meer dan één parameter moeten een object gebruiken."
        }
      ],

      // 4. Geen 'var' gebruiken
      "no-var": "error",
      "prefer-const": "error"
    }
  }
]