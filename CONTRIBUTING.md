# Contributing to ZAD Platform

Thank you for contributing! This guide covers our development workflow, coding standards, and review process.

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/zad-platform.git
cd zad-platform
pnpm install

# Run tests
pnpm test

# Lint & typecheck
pnpm lint
pnpm typecheck

# Build all packages
pnpm build
```

## Development Workflow

### 1. Branch Naming
```
feat/<short-description>     # New features
fix/<short-description>      # Bug fixes
docs/<short-description>     # Documentation
refactor/<short-description> # Code restructuring
test/<short-description>     # Test additions
chore/<short-description>    # Maintenance
```

### 2. Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

**Examples:**
```
feat(core): add zombie prediction model v2
fix(frontend): resolve hydration mismatch on dashboard
docs: update API reference for decommission endpoint
refactor(scoring): extract RI breakdown to separate function
test(core): add edge cases for PCI compliance mapping
```

### 3. Pull Request Process

1. **Create PR** against `main` branch
2. **Fill PR template** completely
3. **Ensure CI passes** (lint, typecheck, test, build)
4. **Request review** from CODEOWNERS
5. **Address feedback** - push new commits (don't force-push)
6. **Squash & merge** after approval

**Requirements:**
- All CI checks pass
- At least 1 approval from CODEOWNERS
- No unresolved review conversations
- Linear history (squash merge)

### 4. Code Standards

#### TypeScript
- **Strict mode** enabled - no `any`, no implicit `any`
- **Pure functions** preferred in core domain
- **Zod schemas** for all external boundaries (API, config, input)
- **Explicit return types** for public APIs
- **No unused variables** (enforced by linter)

#### Testing
- **Unit tests** for all pure functions (core package)
- **Integration tests** for API routes (api package)
- **E2E tests** for critical user flows (frontend package)
- **Coverage thresholds:** 80% lines, 80% functions, 70% branches

#### Formatting
- **Prettier** enforced via CI
- **ESLint** with TypeScript strict rules
- Run `pnpm lint` before committing

### 5. Package Structure

```
packages/
├── core/       # Pure domain logic (no I/O, no framework deps)
├── api/        # Backend API (Fastify/Hono + Zod validation)
├── frontend/   # React/Preact SPA (Vite + TanStack Query)
└── shared/     # Shared types & utilities
```

**Dependency Rules:**
- `core` → zero external deps (only `zod`)
- `api` → depends on `core`, `shared`
- `frontend` → depends on `core`, `shared`
- `shared` → zero deps

### 6. Adding Dependencies

```bash
# Runtime dependency (core, api, frontend)
pnpm add <pkg> --filter=@zad/core

# Dev dependency
pnpm add -D <pkg> --filter=@zad/core

# Workspace-wide dev dependency
pnpm add -D -w <pkg>
```

**Guidelines:**
- Prefer stdlib over deps
- Audit: `pnpm audit` before adding
- Check bundle size impact (frontend)
- No duplicate deps across packages

### 7. Releases

We use **Changesets** for versioning:

```bash
# Create changeset (run in root)
pnpm changeset

# Version bump (maintainers only)
pnpm changeset version

# Publish (maintainers only)
pnpm changeset publish
```

**Versioning:** Semantic Versioning (MAJOR.MINOR.PATCH)

### 8. Reporting Issues

- **Bugs:** Use bug report template
- **Features:** Use feature request template
- **Security:** Email security@your-org.com (see SECURITY.md)

### 9. Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be respectful, inclusive, and constructive.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript check |
| `pnpm build` | Build all packages |
| `pnpm changeset` | Create version bump entry |
| `pnpm format` | Auto-format with Prettier |

---

*Questions? Open a discussion or ask in PR review.*