import baseConfig from "./packages/tooling/eslint.config.js";

export default [
  ...baseConfig,
  {
    // Override to specify which directories to lint
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/generated/**",
    ],

    settings: {
      "import/resolver": {
        typescript: {}, // This enables TypeScript path resolution
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"], // Ensure node resolver also handles TypeScript extensions
        },
      },
      "import/extensions": [".js", ".jsx", ".ts", ".tsx"], // Specify extensions for imports
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"], // Define parser for TypeScript files
      },
    },
  },
];
