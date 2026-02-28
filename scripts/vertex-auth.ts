/**
 * Vertex AI Authentication Pre-Flight
 *
 * Checks for valid GCP Application Default Credentials (ADC).
 * If missing or expired, opens the browser auth flow and waits for user.
 *
 * NOT part of the npm package. Dev tooling only.
 */
import { GoogleAuth } from "google-auth-library";
import { execSync } from "node:child_process";

// ── Constants ────────────────────────────────────────────────────────────────

export const GCP_PROJECT = "kore-5e252";
export const VERTEX_REGION = "us-central1";

// ── Singleton auth client ────────────────────────────────────────────────────

let authClient: GoogleAuth | null = null;

function getAuthClient(): GoogleAuth {
  if (!authClient) {
    authClient = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
  }
  return authClient;
}

// ── Pre-flight check ─────────────────────────────────────────────────────────

/**
 * Check for valid GCP Application Default Credentials.
 * If missing or expired, attempts `gcloud auth application-default login`.
 * Returns true if credentials are available, false otherwise.
 */
export async function checkVertexAuth(): Promise<boolean> {
  const auth = getAuthClient();

  // First attempt: check existing credentials
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    if (tokenResponse.token) {
      console.log("  ✅ Vertex AI credentials valid");
      return true;
    }
  } catch {
    // Credentials missing or expired — fall through to interactive auth
  }

  // Interactive auth flow
  console.log("  ⚠️  Vertex AI credentials not found or expired.");
  console.log("  Opening browser for Google Cloud authentication...");
  console.log(
    "  (Complete sign-in in the browser, then return here)\n",
  );

  try {
    execSync("gcloud auth application-default login", {
      stdio: "inherit",
    });
  } catch {
    console.error(
      "  ❌ gcloud auth failed. Is gcloud CLI installed?",
    );
    return false;
  }

  // Reset auth client to pick up new credentials
  authClient = null;

  // Re-check after interactive auth
  try {
    const freshAuth = getAuthClient();
    const client = await freshAuth.getClient();
    const tokenResponse = await client.getAccessToken();
    if (tokenResponse.token) {
      console.log("  ✅ Vertex AI credentials valid (after login)");
      return true;
    }
  } catch {
    console.error(
      "  ❌ Vertex AI credentials still invalid after login.",
    );
    return false;
  }

  return false;
}

// ── Token acquisition ────────────────────────────────────────────────────────

/**
 * Get a valid Bearer token for Vertex AI API calls.
 * Returns the token string or null if credentials are unavailable.
 * google-auth-library handles automatic token refresh.
 */
export async function getVertexToken(): Promise<string | null> {
  try {
    const auth = getAuthClient();
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token ?? null;
  } catch {
    return null;
  }
}
