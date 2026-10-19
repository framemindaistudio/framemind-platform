import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The public website's pages are the Figma export's code, kept as it was: its copy uses plain quotes and its
  // images are plain <img> tags (already web-sized in public/site).
  {
    files: ["src/site/**/*.{ts,tsx}"],
    rules: { "react/no-unescaped-entities": "off", "@next/next/no-img-element": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
