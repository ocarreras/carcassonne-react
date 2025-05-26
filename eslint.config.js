import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig,
  {
    rules: {
      "react/react-in-jsx-scope": "off", // Not needed with React 17+ JSX transform
      "react/jsx-filename-extension": [1, { "extensions": [".jsx", ".tsx"] }], // Allow JSX in .tsx files
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  {
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  { // Ignores for configuration files and build output
    ignores: ["vite.config.js", "eslint.config.js", "*.tf", "Makefile", "dist/"]
  }
];
