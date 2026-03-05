import { defineConfig } from "vitest/config";

/**
 * Vitest config for @future tests only.
 *
 * Runs tests with @future in their description. These are expected to fail
 * (they assert contracts from future milestones). The runner reports results
 * as a remaining-work metric without blocking the gate.
 *
 * Usage: npm run test:future
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/spec-gaps/**"],
    globals: true,
    testTimeout: 10000,
    // Only run tests with @future in their name
    testNamePattern: "@future",
    // Don't fail the process — this is informational
    passWithNoTests: true,
  },
});
