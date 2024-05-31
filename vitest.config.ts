import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      include: ["src/**/*.ts"],
    },
    globals: true,
    include: ["test/vitest/**/*.spec.ts"],
    environment: "jsdom",
    setupFiles: ["./test/vitest/initialize.ts"],
  },
});
