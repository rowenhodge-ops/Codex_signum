import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/spec-gaps/**"],
    globals: true,
    testTimeout: 10000,
  },
});
