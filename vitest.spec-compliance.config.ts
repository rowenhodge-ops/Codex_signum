import { defineConfig } from "vitest/config";

/**
 * Spec-compliance config — runs ALL tests including tests/spec-gaps/.
 *
 * Usage: npm run test:spec-compliance
 *
 * The spec-gaps/ tests encode what the Codex protocol REQUIRES.
 * They are expected to FAIL where the implementation diverges from spec.
 * This gives you a live map of every structural gap between code and protocol.
 *
 * The default `npm test` excludes spec-gaps/ so CI stays green.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globals: true,
    testTimeout: 10000,
  },
});
