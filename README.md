<div align="center">

<img src="logo/logo.svg" width="128" alt="zod-refiners logo" />

# zod-refiners

**Isolated, composable Zod refiner functions — copied into your project, owned by you.**

A shadcn-style `add` workflow for cross-field validation.

[![npm version](https://img.shields.io/npm/v/zod-refiners?style=flat-square)](https://www.npmjs.com/package/zod-refiners)
[![npm downloads](https://img.shields.io/npm/dm/zod-refiners?style=flat-square)](https://www.npmjs.com/package/zod-refiners)
[![node](https://img.shields.io/node/v/zod-refiners?style=flat-square)](https://www.npmjs.com/package/zod-refiners)
[![zod peer](https://img.shields.io/badge/zod-%3E%3D%203.22.0-3068b8?style=flat-square&logo=zod&logoColor=white)](https://zod.dev)
[![license](https://img.shields.io/npm/l/zod-refiners?style=flat-square)](https://github.com/usefmahmud/zod-refiners/blob/main/LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/usefmahmud/zod-refiners)

```
npx zod-refiners init
npx zod-refiners add password-match-refiner
```

</div>

---

## Contents

- [The idea](#the-idea)
- [Why not just…](#why-not-just)
- [Highlights](#highlights)
- [Installation](#installation)
- [Quick start](#quick-start)
- [CLI reference](#cli-reference)
  - [`zod-refiners init`](#zod-refiners-init)
  - [`zod-refiners list`](#zod-refiners-list)
  - [`zod-refiners add <refiners...>`](#zod-refiners-add-refiners)
- [Configuration](#configuration)
- [Available refiners](#available-refiners)
  - [`password-match-refiner`](#password-match-refiner)
  - [`create-strong-password-refiner`](#create-strong-password-refiner)
  - [`date-range-refiner`](#date-range-refiner)
  - [`types`](#types)
- [The `RefineTuple` contract](#the-refinetuple-contract)
- [How it works](#how-it-works)
- [Writing your own refiner](#writing-your-own-refiner)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [FAQ](#faq)
- [License](#license)

---

## The idea

Zod has a `.refine()` method, and it is quietly one of the most powerful
things in the library — it is where you express the rules that no single
field can express alone:

- do these two password fields match?
- if `type` is `"invoice"`, is `vatNumber` present?
- does `endDate` come after `startDate`?
- is at least one contact method provided?

In practice, writing those rules is the least pleasant part of using Zod.
You end up hand-writing predicate functions, assembling
`{ message, path }` objects yourself, remembering to point the error at the
**right** field, and pasting the same tuple into every form that needs it.

`zod-refiners` is built on one belief: **cross-field validation rules are
reusable code, and reusable code should be copyable, not imported.**

So it works like shadcn/ui, but for validation logic. There is a registry
of small, isolated refiner functions. You pick the ones you need, and the
CLI **copies the source files straight into your project**. From that
moment they are yours: readable, editable, debuggable, free of any
dependency on this package.

```ts
.refine(
  ...createPasswordMatchRefiner<SignupForm>("password", "confirmPassword"),
)
```

That one spread is the whole product. Everything else — the CLI, the
manifest, the dependency resolution — exists to get that function onto
your disk, with its types, in the right folder, in the right order.

### Design principles

1. **You own the code.** The output of `add` is a plain `.ts` file in your
   repo. No runtime dependency is added, no package version can break you,
   and you can rewrite every line.
2. **Refiners are pure and isolated.** Each refiner is a single function
   that takes field names and returns a `RefineTuple`. It imports nothing
   but a shared type. It has no side effects, no config object, no
   framework knowledge.
3. **Composition over configuration.** Every refiner handles exactly one
   concern and is designed to be spread alongside others. Combine ten of
   them and each error still lands on its own field.
4. **Small and boring.** Three runtime dependencies (`commander`,
   `prompts`, `picocolors`), Node's standard `fs`, a JSON manifest. No
   plugin system, no daemon, no codegen server.
5. **Escapable by default.** Delete the refiners folder and your project
   still builds — you just lost those helpers. Nothing else couples to
   this tool.

## Why not just…

**…use a validation library that ships everything built in?**

Because the rules that ship in someone else's package are the rules you
cannot easily change. When a refiner lives in your repo, the day its
behavior needs to differ for your product, you edit it — you are not
waiting on an upstream release or maintaining a fork of a whole library.

**…copy the snippet from the docs once?**

You can, and many people do. This project exists because "once" turns
into five forms, three repos, and a Slack thread where someone pastes a
version that is subtly different from yours. The registry keeps the
canonical source, the CLI keeps it consistent, and `registryDependencies`
makes sure the shared types arrive with it.

**…just import `zod-refiners` as a library?**

That is the trade-off this project deliberately rejects: an imported
helper is a permanent dependency — versioned, audited, and opaque. A
copied helper is a file you can read in ten seconds. The cost is that you
do not receive automatic bug fixes; re-running `add` and accepting the
overwrite prompt is how you opt into upstream improvements.

## Highlights

- **shadcn-style workflow** — `init`, `list`, `add`. Source files land in
  your project; the package never runs in production.
- **Automatic dependency closure** — add a refiner and its shared types
  come with it, topologically ordered, exactly once.
- **Safe by default** — existing files are never overwritten silently;
  every collision asks first and defaults to *No*.
- **Honest errors** — unknown refiners and circular registry dependencies
  are detected and reported by name, with a non-zero exit code.
- **Tiny surface** — three commands, one config file, one JSON manifest.
- **Zero config to start** — `init` is optional; `add` writes the config
  for you on first run.
- **TypeScript-first** — strict-mode compiled, the refiner contract is a
  type (`RefineTuple<T>`), errors carry `path` arrays Zod understands.

## Installation

```bash
npm install --save-dev zod-refiners
```

or with pnpm:

```bash
pnpm add -D zod-refiners
```

The CLI is a development-time tool — like a formatter or a generator,
nothing about it ships to production. Installing it as a dev dependency
keeps it out of your production install; running it via `npx` with no
install at all also works.

**Requirements**

| | |
|---|---|
| Node.js | `>= 18` |
| Zod | `>= 3.22.0` (your project's peer dependency) |
| Package manager | any — the CLI does not care |

Verify it:

```bash
npx zod-refiners list
```

## Quick start

**1. Initialize** (optional — `add` will do it for you if you skip this):

```bash
npx zod-refiners init
```

```
? Where should refiners be installed? › src/lib/refiners
Created zod-refiners.json (refinersDir = "src/lib/refiners")
```

**2. Add a refiner:**

```bash
npx zod-refiners add password-match-refiner
```

```
Added src/lib/refiners/types.ts
Added src/lib/refiners/password-match-refiner.ts

Done.
```

Notice that `types.ts` was installed without being asked for — it is a
`registryDependency` of the password refiner, so the closure pulled it in.

**3. Use it:**

```ts
// src/lib/refiners/password-match-refiner.ts was copied into your project
import { z } from "zod";
import { createPasswordMatchRefiner } from "@/lib/refiners/password-match-refiner";

type SignupForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine(
    ...createPasswordMatchRefiner<SignupForm>(
      "password",
      "confirmPassword",
      "Passwords don't match",
    ),
  );

const result = signupSchema.safeParse({
  email: "ada@example.com",
  password: "hunter22222",
  confirmPassword: "hunter2222",
});

// result.success === false
// result.error.issues[0].path === ["confirmPassword"]  ← error on the confirm field
```

That is the entire integration. No provider, no plugin registration, no
import from `zod-refiners` anywhere in your application code.

## CLI reference

### `zod-refiners init`

Creates `zod-refiners.json` in the current working directory by asking
where refiner files should live.

| Behavior | Detail |
|---|---|
| Already configured | Prints `Already configured. refinersDir = "..."` and exits `0` without prompting |
| Prompt default | `src/lib/refiners` (press Enter to accept) |
| Empty input | Falls back to the default directory |
| Output | Writes `zod-refiners.json` with 2-space indentation |

### `zod-refiners list`

Loads `registry/index.json` and prints every installable refiner with its
description.

- The internal `types` entry is intentionally hidden — it is installed
  automatically as a dependency and is not something you ask for by name.
- Exits non-zero if the manifest cannot be read or parsed.

### `zod-refiners add <refiners...>`

Installs one or more refiners — plus their transitive dependencies.

```bash
npx zod-refiners add password-match-refiner
npx zod-refiners add password-match-refiner another-refiner
```

**Flow:**

1. **Config** — reads `zod-refiners.json`; if missing, prompts for
   `refinersDir` and writes it (same as `init`).
2. **Manifest** — loads the registry index.
3. **Closure** — resolves the requested names into a topologically
   ordered install list. Direct dependencies are installed before the
   refiners that need them.
4. **Copy** — for each entry, ensures the target directory exists and
   copies every file listed in the entry.

**Collision handling** — if a destination file already exists:

```
? src/lib/refiners/types.ts already exists. Overwrite? › (y/N)
```

The prompt defaults to **No**. Declining prints `Skipped <file>` and
moves on; accepting copies the new version over the old one. Declining
everything is a safe way to inspect what an update would change.

**Exit codes**

| Code | Meaning |
|---|---|
| `0` | Success (including "nothing to do") |
| `1` | Unknown refiner name, or a circular dependency in the registry |

```
Unknown refiner "nope". Run "zod-refiners list" to see options.
Circular refiner dependency: a -> b -> a
```

## Configuration

`zod-refiners.json`, at the root of your project:

```json
{
  "refinersDir": "src/lib/refiners"
}
```

| Field | Type | Meaning |
|---|---|---|
| `refinersDir` | `string` | Directory that receives copied refiner files, resolved relative to the working directory you run the CLI from |

There are no other settings, by design. If you want a refiner somewhere
else, change this string. If you want it under a different name, rename
the file after it is copied — the tool never looks at your project's
imports.

A common setup is to alias the folder so the copies are pleasant to
import:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```ts
import { createPasswordMatchRefiner } from "@/lib/refiners/password-match-refiner";
```

## Available refiners

### `password-match-refiner`

Validates that two fields hold the same value. Built for confirmation
fields — and it reports the error **on the confirmation field**, not on
the original, so your form highlights the field the user actually got
wrong.

```bash
npx zod-refiners add password-match-refiner
```

Installs:

- `password-match-refiner.ts` — the factory
- `types.ts` — the shared `RefineTuple` type (dependency)

**Signature**

```ts
function createPasswordMatchRefiner<T extends Record<string, unknown>>(
  passwordField: keyof T & string,
  confirmField: keyof T & string,
  message?: string, // default: "Passwords don't match"
): RefineTuple<T>;
```

**Usage**

```ts
import { z } from "zod";
import { createPasswordMatchRefiner } from "@/lib/refiners/password-match-refiner";

type SettingsForm = {
  password: string;
  confirmPassword: string;
};

const settingsSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine(
    ...createPasswordMatchRefiner<SettingsForm>(
      "password",
      "confirmPassword",
      "Your passwords must match",
    ),
  );
```

**Behavior**

| Case | Result |
|---|---|
| Values equal | Parses successfully |
| Values differ | Issue at `path: ["confirmPassword"]` with your message |
| Works with | `string`, `number`, or any `===`-comparable values |

### `create-strong-password-refiner`

Validates a configurable password-strength policy and reports the
**first** rule that fails — "too short" instead of one generic
"password is invalid" message. Every rule's wording is overridable
through `options.messages`.

```bash
npx zod-refiners add create-strong-password-refiner
```

Installs:

- `create-strong-password-refiner.ts` — the factory
- `types.ts` — the shared `RefineTuple` type (dependency)

**Signature**

```ts
function createStrongPasswordRefiner<T extends Record<string, unknown>>(
  field: keyof T & string,
  options?: StrongPasswordOptions,
): RefineTuple<T>;
```

**Options** (defaults shown)

```ts
{
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  specialChars: "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?",
  forbidWhitespace: true,
  forbidRepeatingChars: false,
  messages: {}, // per-rule overrides: tooShort, tooLong, missingUppercase,
                // missingLowercase, missingDigit, missingSpecialChar,
                // containsWhitespace, repeatingChars, invalidType,
                // generic (fallback before any rule has failed)
}
```

**Usage**

```ts
import { z } from "zod";
import { createStrongPasswordRefiner } from "@/lib/refiners/create-strong-password-refiner";

type SignupForm = { password: string };

const signupSchema = z
  .object({ password: z.string() })
  .refine(
    ...createStrongPasswordRefiner<SignupForm>("password", {
      minLength: 10,
      messages: { tooShort: "Use at least 10 characters" },
    }),
  );
```

**Behavior**

| Case | Result |
|---|---|
| All rules pass | Parses successfully |
| A rule fails | Issue at `path: ["password"]` with the first failing rule's message |
| Non-string value | Issue at `path: ["password"]` with the `invalidType` message |
| `minLength > maxLength` | Throws at construction time (config error) |

The tuple's second element is a plain `{ message, path }` object, as
`RefineTuple` requires. The predicate writes the first failing rule's
message into it before returning `false`, and Zod reads it back when
building the issue.

### `date-range-refiner`

Validates that an end date comes after a start date. Built for booking,
scheduling, and filter forms — and it puts the error **on the field you
configured** for ordering problems (the end date by default), while
missing or invalid values are always reported on the field that's
actually wrong.

```bash
npx zod-refiners add date-range-refiner
```

Installs:

- `date-range-refiner.ts` — the factory
- `types.ts` — the shared `RefineTuple` type (dependency)

**Signature**

```ts
function createDateRangeRefiner<T extends Record<string, unknown>>(
  startField: keyof T & string,
  endField: keyof T & string,
  options?: DateRangeOptions,
): RefineTuple<T>;
```

**Options** (defaults shown)

```ts
{
  allowEqual: false,   // false = end must be strictly after start;
                       // true = a same-day/same-instant range is valid
  granularity: "date", // "date" = compare local calendar days (times ignored);
                       // "datetime" = compare exact timestamps
  errorField: "end",   // "start" | "end" — where ordering errors land
  messages: {},        // per-rule overrides: datesRequired,
                       // invalidDate, endNotAfterStart
}
```

**Usage**

```ts
import { z } from "zod";
import { createDateRangeRefiner } from "@/lib/refiners/date-range-refiner";

type BookingForm = {
  startDate: Date;
  endDate: Date;
};

const bookingSchema = z
  .object({ startDate: z.date(), endDate: z.date() })
  .refine(
    ...createDateRangeRefiner<BookingForm>("startDate", "endDate", {
      allowEqual: true,
      granularity: "datetime",
      messages: { endNotAfterStart: "Pick an end time after the start" },
    }),
  );
```

**Behavior**

| Case | Result |
|---|---|
| End after start | Parses successfully |
| End before start | Issue at `path: ["endDate"]` (or `errorField`) with the ordering message |
| Same day, `granularity: "date"` | Passes only when `allowEqual: true` |
| Same timestamp, `granularity: "datetime"` | Passes only when `allowEqual: true` |
| Start or end missing (`null`/`undefined`) | Issue at `path` of the missing field with the `datesRequired` message |
| Value that isn't a usable `Date` (wrong type or `Invalid Date`) | Issue at `path` of the offending field with the `invalidDate` message |
| `startField === endField` | Throws at construction time (config error) |

With the default `"date"` granularity the comparison uses local calendar
days, so `2026-01-01T18:00 → 2026-01-02T09:00` is a valid range even
though it's less than 24 hours. Switch to `"datetime"` when the times of
day matter.

The default `endNotAfterStart` message adapts to `allowEqual`:
"End date must be after start date" when it's `false`, "End date must be
on or after start date" when it's `true`.

### `types`

Not installed by name — it follows automatically whenever a refiner needs
it. It exists so every refiner can share one contract:

```ts
export type RefineTuple<T> = [
  (data: T) => boolean,
  { message: string; path: string[] },
];
```

## The `RefineTuple` contract

Everything in this project is an instance of one type. A `RefineTuple`
is exactly what Zod's `.refine()` accepts when you spread it:

```ts
type RefineTuple<T> = [
  (data: T) => boolean, // 1. predicate over the whole parsed object
  // 2. where the error goes, and what it says
  { message: string; path: string[] },
];
```

| Element | Role |
|---|---|
| `[0]` | Receives the **entire** object, not one field. Return `true` when the data is valid. |
| `[1].message` | The error message shown to the user, displayed when the predicate fails. |
| `[1].path` | The field path the error is attached to. Zod renders it under that key, which is what makes precise, per-field errors possible. |

Because the tuple is designed for the spread operator, a refiner call
reads the same as a hand-written refinement — just with the
implementation moved somewhere it can be reused:

```ts
// hand-written
.refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// with a refiner — same semantics, one line, reusable
.refine(
  ...createPasswordMatchRefiner<Form>("password", "confirmPassword"),
)
```

Two rules make this composable:

1. **The predicate only ever reads the data it is given.** No captured
   state, no I/O, no throwing.
2. **The `path` always points at the field responsible for the failure.**
   For a two-field rule, that is a judgement call — `password-match-refiner`
   deliberately blames the confirmation field.

## How it works

```
$ npx zod-refiners add password-match-refiner

 ┌──────────────┐    no config     ┌───────────────────────────┐
 │ ensureConfig │ ───────────────► │ prompt for refinersDir    │
 │              │                  │ write zod-refiners.json   │
 └──────┬───────┘                  └───────────────────────────┘
        │
        ▼
 ┌──────────────┐
 │ loadManifest │  registry/index.json ──► [{name, description,
 └──────┬───────┘                          files, registryDependencies}]
        ▼
 ┌────────────────┐   "password-match-refiner" needs "types"
 │ resolveClosure │ ─────────────────────────────────────────┐
 └──────┬─────────┘                                          │
        │  unknown name ──► error, exit 1                    │
        │  cycle        ──► error, exit 1                    │
        ▼                                                    ▼
   ordered: [types, password-match-refiner]   (topological, deduped)
        ▼
 ┌───────────┐   dest exists?  ──►  prompt (default: No) ──►  skip / overwrite
 │ copyEntry │
 └───────────┘   mkdir recursive + copyFile ──► "Added src/lib/refiners/..."
```

**Dependency resolution** is a depth-first walk over the manifest:

- each entry's `registryDependencies` are visited before the entry
  itself, so files land in a usable order;
- a `Set` guarantees each file is copied once no matter how many refiners
  request it;
- revisiting an in-progress node means the registry has a cycle, and the
  error names the full path (`a -> b -> a`);
- a missing node means you typed a name that does not exist, and the
  error tells you to run `list`.

**Reading and writing** uses Node's standard `fs/promises` — no
`fs-extra`, no runtime schema for the config file: `init` and `add`
serialize `zod-refiners.json` with two-space indentation and a trailing
newline.

## Writing your own refiner

A refiner is a factory: it takes the configuration a call site needs and
returns a `RefineTuple`. Start from this template — it passes strict
TypeScript and is exactly the shape the registry expects:

```ts
// registry/no-whitespace-refiner.ts
import type { RefineTuple } from "./types";

/**
 * Validates that a field contains no whitespace.
 *
 * @example
 * .refine(...createNoWhitespaceRefiner<FormValues>("username"))
 */
export function createNoWhitespaceRefiner<T extends Record<string, unknown>>(
  field: keyof T & string,
  message = "Whitespace is not allowed",
): RefineTuple<T> {
  return [
    (data) => !/\s/.test(String(data[field] ?? "")),
    { message, path: [field] },
  ];
}
```

Then register it in `registry/index.json`:

```json
{
  "name": "no-whitespace-refiner",
  "description": "Rejects values containing spaces, tabs, or newlines.",
  "files": ["no-whitespace-refiner.ts"],
  "registryDependencies": ["types"]
}
```

| Manifest field | Meaning |
|---|---|
| `name` | What users type in `add <name>` |
| `description` | Shown by `list` — say what rule it enforces and where the error lands |
| `files` | Files copied into `refinersDir`, relative to `registry/` |
| `registryDependencies` | Other entry names that must be installed first (`types` in almost every case) |

Check your work:

```bash
pnpm build
node bin/zod-refiners.js list
node bin/zod-refiners.js add no-whitespace-refiner
```

### Refiner checklist

- [ ] Pure predicate — reads only its `data` argument, never throws
- [ ] `path` points at the field the user should fix
- [ ] Default `message` that a human would want to see
- [ ] JSDoc with an `@example` showing the `.refine(...)` spread
- [ ] Generic constrained to `Record<string, unknown>` so it types against
      any Zod object schema
- [ ] No imports besides `./types` (or other refiners you declare in
      `registryDependencies`)
- [ ] Works under `tsc --strict`

## Project structure

```
zod-refiners/
├── bin/
│   └── zod-refiners.js        # executable shim → dist/cli.js
├── dist/                      # compiled output (generated, gitignored)
├── registry/
│   ├── index.json             # the manifest: names, files, dependencies
│   ├── types.ts               # RefineTuple contract
│   ├── password-match-refiner.ts
│   └── create-strong-password-refiner.ts
├── src/
│   ├── cli.ts                 # commander commands: init / list / add
│   ├── config.ts              # read & write zod-refiners.json
│   ├── registry.ts            # manifest loading, closure resolution, copying
│   └── fsutil.ts              # pathExists / readJson helpers (node:fs)
├── package.json
└── tsconfig.json              # strict, NodeNext, outDir: dist
```

Two halves, cleanly split:

- **`src/` is the tool.** It never runs in a user's production app.
- **`registry/` is the product.** Everything in it is copied verbatim
  into user projects, which is why it depends on nothing but `./types`.

## Contributing

Contributions are welcome — new refiners especially. Every refiner merged
into the registry is one fewer refiner anyone else has to write by hand.

### Ground rules

- **Refiners are copy-out, not import-in.** Code in `registry/` must stay
  dependency-free and self-contained; it is going into other people's
  repos.
- **Behavior changes to copied refiners are breaking changes.** People
  own their copies; be conservative about altering what `add` produces.
- **Small PRs.** One refiner, one fix, one doc improvement per PR.

### Development setup

```bash
git clone https://github.com/usefmahmud/zod-refiners.git
cd zod-refiners
pnpm install
pnpm build
```

Exercise the CLI locally against a scratch directory:

```bash
mkdir /tmp/zod-refiners-test && cd /tmp/zod-refiners-test
node /path/to/zod-refiners/bin/zod-refiners.js list
node /path/to/zod-refiners/bin/zod-refiners.js add password-match-refiner
```

Useful commands:

| Command | Effect |
|---|---|
| `pnpm build` | Compile `src/` → `dist/` with `tsc` (this is the gate every PR must pass) |
| `node bin/zod-refiners.js <cmd>` | Run the CLI from your working tree |

### Submitting a refiner

1. Fork and create a branch: `git checkout -b feat/my-refiner`
2. Add `registry/my-refiner.ts` following the template above
3. Add its entry to `registry/index.json`
4. `pnpm build`, then `add` it into a scratch directory and confirm the
   copied file compiles under `--strict` in a real schema
5. Open a PR with: the rule it enforces, the field the error should land
   on, and a before/after `.refine(...)` example

### Pull request checklist

- [ ] `pnpm build` passes with no errors
- [ ] New refiners follow the [checklist](#refiner-checklist)
- [ ] `registry/index.json` stays valid JSON with `registryDependencies`
      that actually exist
- [ ] Docs updated (README usage examples, JSDoc `@example`)
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
      — `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

### Reporting issues

Open an issue on [GitHub](https://github.com/usefmahmud/zod-refiners/issues)
with:

- your Node and Zod versions
- the exact command you ran
- the expected vs. actual output (the CLI's error messages are precise —
  paste them verbatim)

## FAQ

**Does `add` modify my `package.json`?**
No. It copies source files. The only thing it writes outside the refiners
folder is `zod-refiners.json`.

**Do the copied files import from `zod-refiners`?**
Never. That is the point. The only import a copied refiner has is
`./types`; your application imports it alongside `zod` and nothing else.

**What happens when I run `add` and the file is already there?**
You get a per-file confirmation defaulting to *No*. Nothing is ever
overwritten silently, which makes re-running `add` a safe way to see what
changed upstream.

**How do I get updates to a refiner I already installed?**
Run `add` again and accept the overwrite. You will lose local edits to
that file — read the new copy first if you have customized it.

**Can I edit the copied files?**
Yes, they are yours now. The only consequence is that upstream updates
will conflict with your edits, and the overwrite prompt is where you
decide which version wins.

**`Unknown refiner "x"` — what now?**
The name is not in the manifest. Run `npx zod-refiners list`, and check
for typos. Names are case-sensitive.

**`Circular refiner dependency` — what now?**
Two registry entries depend on each other. This is a bug in the registry,
not in your project — please open an issue with the refiner names.

**ESM or CommonJS?**
The CLI is CommonJS and runs under either module system; Node `>= 18`
handles it. The copied refiners are plain TypeScript — your build tools
compile them however your project already works.

**Does it work with Zod v4?**
Yes. The `RefineTuple` shape — a predicate plus `{ message, path }` — is
accepted by Zod 3 and Zod 4, and the examples in this README were run
against Zod 4.

**Windows?**
The CLI uses `node:path` throughout, so paths behave correctly on
Windows, Linux, and macOS.

**Why is there no plugin/runtime API?**
Because a runtime API would reintroduce the dependency this project
exists to remove. The registry is data, the CLI is a copier, and your
code stays yours.

## License

[MIT](./LICENSE) © usefmahmud

## Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/) — for the idea that the best way
  to ship reusable components is to stop treating them as a dependency
- [Zod](https://zod.dev) — `.refine()` is the foundation everything here
  builds on

---

<div align="center">

**[npm](https://www.npmjs.com/package/zod-refiners)** ·
**[GitHub](https://github.com/usefmahmud/zod-refiners)** ·
**[Issues](https://github.com/usefmahmud/zod-refiners/issues)**

</div>
