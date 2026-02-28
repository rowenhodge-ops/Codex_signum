# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Codex Signum, please report it responsibly.

**Email:** [rowen@codexsignum.com](mailto:security@codexsignum.com)

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

I will acknowledge receipt within 48 hours and aim to provide a fix or mitigation within 7 days for critical issues.

**Please do not open a public GitHub issue for security vulnerabilities.**

## Supported Versions

| Version | Supported |
|---|---|
| Latest on `main` | ✅ |
| Previous releases | ❌ |

## Scope

This policy covers:
- The Codex Signum core library (`src/`)
- Self-hosting scripts (`scripts/`)
- Documentation that may inadvertently contain sensitive information

## Security Practices

- **No secrets in source.** API keys, credentials, and tokens must never be committed. All secrets are loaded from `.env` files which are gitignored. See `.env.example` for the required variables.
- **Dependency auditing.** Run `npm audit` periodically. Critical vulnerabilities in dependencies are treated as blocking issues.
- **Neo4j access.** The graph database requires authenticated access. Connection credentials are never stored in source or documentation.
- **LLM API keys.** Provider API keys (Anthropic, Google Vertex AI, OpenRouter) are loaded at runtime from environment variables. The bootstrap executor never logs or persists key values.

## Credential Rotation

If you believe any credentials associated with this project have been exposed:

1. Rotate the affected credentials immediately at the provider's console
2. Update your local `.env` files
3. If the exposure was via git history, use `git-filter-repo` to scrub and force-push
4. Report the incident using the contact above

## Disclaimer

Codex Signum is research software under active development. It is provided as-is without warranty. Use appropriate caution when deploying in any environment with access to production credentials or sensitive data.
