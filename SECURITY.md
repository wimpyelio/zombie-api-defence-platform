# Security Policy

## Supported Versions

We release security patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0   | ❌ No (pre-release)|

## Reporting a Vulnerability

**Do not file public GitHub issues for security vulnerabilities.**

Instead, report them privately via:

**Email: zad.elio2107@gmail.com

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)
- Affected package(s): `packages/core`, `packages/frontend`, `packages/api`

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Patch development**: Within 30 days (critical: 14 days)
- **Coordinated disclosure**: After patch release

## Security Measures

### Dependencies
- Automated scanning via GitHub Dependabot
- `pnpm audit` in CI pipeline
- Lockfile (pnpm-lock.yaml) committed and verified
- Exact version pinning in lockfile

### Code
- TypeScript strict mode (prevents common vulnerabilities)
- ESLint security rules enabled
- No `eval`, `Function` constructor, or dynamic code execution
- Input validation via Zod schemas

### Supply Chain
- npm provenance for published packages
- pnpm lockfile v6 (immutable)
- No post-install scripts in dependencies
- CI verifies integrity checksums

### Secrets
- **Never commit secrets** (API keys, tokens, passwords)
- Use `.env.local` for local development (gitignored)
- Production secrets via environment variables / secret managers
- Rotate compromised credentials immediately

## Scope

### In Scope
- `packages/core` - Domain logic (RI calculation, state machine, compliance)
- `packages/frontend` - Web UI (when implemented)
- `packages/api` - Backend API (when implemented)
- Build/CI infrastructure (`.github/workflows/`, `pnpm-workspace.yaml`)

### Out of Scope
- Third-party services (GitHub, npm, hosting providers)
- Self-hosted deployments (user responsibility)
- Social engineering / phishing
- Physical security

## Disclosure Process

1. Researcher reports vulnerability privately
2. Maintainers acknowledge & triage
3. Fix developed & tested
4. Patch released (patch version bump)
5. Security advisory published (GitHub Security Advisories)
6. CVE requested if applicable
7. Researcher credited (if desired)

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

<!-- Add researchers here after first disclosure -->
*None yet - be the first!*

## Contact

- Security email: zad.elio2107@gmail.com
