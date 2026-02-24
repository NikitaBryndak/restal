import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

// Fix circular reference in react plugin (next.js flat-config compat issue)
for (const config of eslintConfig) {
  if (config.plugins?.react) {
    config.plugins.react = { rules: config.plugins.react.rules };
  }
}

export default eslintConfig;
