import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: [".next/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Ukrainian copy uses apostrophes (зв'язок, Ім'я) — raw ' is the project style
      "react/no-unescaped-entities": "off",
      // Legacy codebase: pre-existing `any` usage downgraded to warnings
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["scripts/**"],
    rules: {
      // Node CLI scripts — require() is idiomatic here
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
