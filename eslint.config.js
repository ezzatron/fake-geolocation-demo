// @ts-check
import vitest from "@vitest/eslint-plugin";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  vitest.configs.recommended,
  prettier,
  globalIgnores([
    ".github/**",
    ".makefiles/**",
    "artifacts/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
