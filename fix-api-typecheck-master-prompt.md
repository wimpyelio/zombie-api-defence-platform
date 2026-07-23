# Master Prompt: Fix `packages/api` TypeScript Errors

Paste this whole document to your coding agent as-is.

---

## Context

`packages/core` type-checks cleanly (38/38 tests pass) and the frontend type-checks cleanly.
`packages/api` fails type-checking with 50+ errors. Do not modify `packages/core` or the
frontend to make `packages/api` pass — they are the source of truth. If you believe a core
type is genuinely wrong, stop and flag it instead of changing it.

## Root cause (read this before touching any file)

Most of these 50+ errors are not 50+ independent bugs. They are symptoms of one structural
gap: **there is no translation layer between what Prisma returns from the database and what
the domain types exported by `packages/core` expect.** Prisma gives you raw rows — snake/camel
mismatches, JSON stored as strings, `Date` objects, relation names that don't match domain
field names. The core types describe the clean domain shape the rest of the app was built
against. Right now, route handlers are trying to hand Prisma's raw output directly to Zod
schemas built from core types, and it doesn't line up.

The fix is to build one explicit serialization layer (Prisma row → core domain type) and make
every route go through it, rather than patching each route's Zod schema individually to
tolerate whatever Prisma happens to return. Patching schemas one-by-one will make the count go
down but will leave the same landmine for the next field that gets added.

Fix in this order. Each phase should reduce the error count — confirm that before moving on.

---

## Phase 0 — Discover the actual commands (do this first, don't guess)

I don't know your package manager or task runner. Before anything else:

1. Find the typecheck script for the api package (check `packages/api/package.json`,
   root `package.json`, and `turbo.json`/`nx.json`/`pnpm-workspace.yaml` if present).
2. Run it once now and save the full error output to a scratch file so you have a baseline
   count and can diff against it after each phase. Don't rely on memory of "50+" — get the
   real current number.
3. Find the test command for `packages/core` so you can confirm you haven't broken the
   38/38 passing tests after each phase.

## Phase 1 — Consolidate Fastify type augmentations (unblocks everything else)

Files: `packages/api/src/types.d.ts`, `packages/api/src/plugins/audit.ts`,
`packages/api/src/plugins/auth.ts`.

1. Search the whole `packages/api` tree for every `declare module 'fastify'` block
   (`grep -rn "declare module 'fastify'" packages/api/src`). You will likely find it in
   more than one file — that's the conflict.
2. Pick `types.d.ts` as the single canonical location for all Fastify module augmentation
   (request/reply decorations, `auditLog`, `user`, etc.). Merge every property from every
   scattered `declare module` block into one augmentation there. Resolve conflicts by
   checking actual usage: grep for `request.auditLog(` and `request.user` across the
   codebase to see what shape is actually called at each call site, and let that decide
   the correct signature — not whichever declaration happens to compile first.
3. Delete the duplicate `declare module 'fastify'` blocks from `plugins/audit.ts` and
   `plugins/auth.ts`. Those files should only implement the plugin logic and import shared
   types from `types.d.ts` if they need to reference them.
4. Type-check. This alone should collapse a large chunk of the "Fastify type declaration"
   and "user type conflict" errors, since TypeScript currently sees two incompatible
   declarations for the same augmented properties.

## Phase 2 — Missing imports (fast, mechanical, do it now to shrink noise)

Files: `packages/api/src/routes/compliance.ts`, `packages/api/src/routes/graph.ts`,
`packages/api/src/routes/ri.ts`.

Add the missing imports:
```ts
import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod'
import { z } from 'zod'
```
Only add what each file actually uses — check the existing errors in your Phase 0 baseline
for which specific names are undefined in each file rather than adding both blindly to all
three.

## Phase 3 — Fix variable shadowing / use-before-declaration

File: `packages/api/src/routes/endpoints.ts`.

`predictedZombieDate` is referenced before its declaration. Find the declaration (likely a
`const`/`let`) and the earlier usage. Do not just hoist by converting to `var` or reordering
blindly — read the surrounding logic to confirm whether:
- the earlier reference should use a value computed earlier (in which case move the
  computation up), or
- it's an accidental shadow of an import/outer-scope name with the same name (in which case
  rename one of them for clarity), or
- it's genuinely a reorder issue (move the declaration above its first use).
Pick whichever the actual data flow requires, not whichever silences the compiler fastest.

## Phase 4 — Build the Prisma ↔ core serialization layer (the real fix)

This is the phase that resolves "Prisma model mismatches" and "Date vs string" together,
instead of patching each route's schema separately.

1. Create (or locate if it partially exists) a single module, e.g.
   `packages/api/src/serializers/` (one file per domain area — decommission, endpoint,
   compliance, graph — mirroring the `packages/core` module boundaries you already have).
2. For each Prisma model that backs an API response, write an explicit mapper function:
   `toDecomState(row: PrismaDecomStateRow): DecomState` (import `DecomState` and any other
   needed type from `packages/core`'s exports — `EndpointRaw`, `Endpoint`, `RIBreakdown`,
   `STAGES`, `DecomState`, `computeRI`, `computeV`, `computeRIBreakdown`,
   `predictedZombieDate`, `createDecomState`, `advanceStage`, `rollbackStage`, etc. — reuse
   these, don't redefine parallel shapes in the api package).
3. Inside each mapper, handle the three concrete mismatches called out in the status
   summary:
   - **Naming**: if Prisma's field/relation is `DecomState` or `decommissionState` and the
     core type expects the other, map it explicitly (`{ decommissionState: row.DecomState }`
     or vice versa). Do not rename the Prisma schema/DB column to "fix" this unless you've
     confirmed there's a safe migration path and confirmed it with the user first — mapping
     in code is the lower-risk default.
   - **JSON-as-string fields** (`calledBy`, `calls`, and any `history` field returned as a
     string that the core type expects as an array, e.g. `DecomHistoryEntry[]`): parse with
     `JSON.parse` inside the mapper, wrapped in a try/catch that throws a clear error if the
     stored JSON is malformed (don't silently swallow and return `[]` — that hides data
     corruption). When writing back to Prisma, `JSON.stringify` the array before the write.
   - **Dates**: Prisma returns `Date` objects for `lastTraffic`, `lastCommit`, and similar
     fields; core/API contracts expect strings. Convert with `.toISOString()` in the mapper.
     Do this in exactly one place (the mapper), not per-route.
4. Every mapper's return type should be checked against the actual `packages/core` exported
   type (no separate parallel interface). If TypeScript flags a mismatch here, that's the
   signal to look at real Prisma-generated types (`@prisma/client`) to see what's actually
   coming back, rather than assuming the shape.

## Phase 5 — Fix route handlers and Zod schemas to use the serializers

Files: `packages/api/src/routes/decommission.ts` and the same route files touched in
Phases 2–3.

1. Every route handler that currently returns a raw Prisma result directly should instead
   call the appropriate mapper from Phase 4 and return the mapped object.
2. Every Zod response schema should validate the *mapped* shape (arrays, ISO date strings),
   not the raw Prisma shape. If a Zod schema currently has `z.string()` for something that
   should be a parsed array (e.g. history), that's a leftover from the raw-shape era — fix
   the schema to match the true output shape (`z.array(decomHistoryEntrySchema)` etc.),
   built from the same core types where possible rather than redefined by hand.
3. Confirm the Prisma relation name (`decommissionState` vs `DecomState`) is resolved
   consistently in the actual Prisma query (`include`/`select`) and in the mapper input type
   — a query that includes `DecomState` but a mapper typed against `decommissionState` will
   still fail even after Phase 4's parsing logic is right.

## Phase 6 — Verify (Definition of Done)

Do not report this as done until all of the following are true and you've shown the actual
command output, not just "should be fixed":

- [ ] The api package's typecheck command (found in Phase 0) exits 0 with zero errors.
- [ ] `packages/core`'s test suite still shows 38/38 passing (unchanged).
- [ ] The frontend's typecheck command still exits 0 (unchanged).
- [ ] No `any`, `@ts-ignore`, or `@ts-expect-error` was introduced as a substitute for a real
      fix. If you genuinely need one as a narrow, justified exception, leave a comment
      explaining exactly why and what would remove it.
- [ ] Every JSON-parsing point added in Phase 4 has explicit error handling (no silent
      `catch {}` returning empty data).
- [ ] Report the before/after error count per phase, not just a final "0 errors."

## Iteration protocol (there are 50+ errors — don't try to fix all at once)

Work strictly in the phase order above. After each phase, re-run the typecheck command and
record the remaining error count before starting the next phase. If a phase doesn't reduce
the count the way you expect, stop and re-read the actual remaining errors for that area
before moving on — don't push forward on the assumption the plan is already correct. If you
hit a decision that changes the DB schema (a real Prisma migration, not just a code-side
mapper), stop and confirm with the user before running it.

## When you report back to the user

State: the error count at baseline, the error count after each phase, the final count (must
be 0), which files changed, whether any Prisma schema/migration changes were made (there
should be none unless explicitly confirmed), and confirmation that core's 38/38 tests and the
frontend typecheck are both still passing.
