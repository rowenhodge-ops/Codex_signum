import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/spec-gaps/**"],
    globals: true,
    testTimeout: 10000,
    // Exclude @future tests from the main gate — they are expected to fail
    // and are tracked separately via `npm run test:future`
    testNamePattern: "^(?!.*@future)",
  },
});
