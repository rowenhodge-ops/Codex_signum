# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it via GitHub's private vulnerability reporting feature on this repository (Security tab > "Report a vulnerability").

**Do not open a public issue for security vulnerabilities.**

I will acknowledge receipt within 48 hours and aim to provide a fix or mitigation within 7 days for critical issues.

## Supported Versions

| Version | Supported |
|---|---|
| Latest on `main` | Yes |
| Previous releases | No |

## Security Practices

- No secrets in source — all credentials loaded from `.env` (gitignored)
- Dependency auditing via `npm audit`
- LLM API keys loaded at runtime from environment variables, never logged or persisted

## Disclaimer

This is research software under active development, provided as-is without warranty.
