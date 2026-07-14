# Plan: Scaffold core route structure (dummy pages)

## Context

We're starting to build the note-taking app defined in `note-taking/SPEC.md`. The
repo is currently **spec-only** — no `app/` directory exists, and Next.js is not yet
installed (only `@tiptap/*`, `better-auth`, `zod` are present). This first step
establishes the App Router route skeleton so later work has a place to hang real
content. Per the request: **dummy message per page only, no real content, no auth.**

## Scope

Create one `page.tsx` per route, each rendering a single placeholder message. Instead
of SPEC's separate `/login` and `/register` pages, use a **single `/authenticate`
route** (email + password auth only) per the user's decision. Also create the **root
`app/layout.tsx`**, which the Next.js App Router structurally requires — without it none
of the pages resolve. All pages are plain React Server Components (no `"use client"`, no
data fetching, no auth logic yet).

## Files to create

Under `note-taking/app/` (matching the SPEC "Folder Structure", `app/` at project root):

| Route          | File                          | Dummy content                     |
| -------------- | ----------------------------- | --------------------------------- |
| root layout    | `app/layout.tsx`              | `<html><body>{children}</body>`   |
| `/`            | `app/page.tsx`                | "Home — placeholder"              |
| `/authenticate`| `app/authenticate/page.tsx`   | "Authenticate — placeholder"      |
| `/dashboard`   | `app/dashboard/page.tsx`      | "Dashboard — placeholder"         |
| `/notes/new`   | `app/notes/new/page.tsx`      | "New Note — placeholder"          |
| `/notes/[id]`  | `app/notes/[id]/page.tsx`     | "Note [id] — placeholder"         |
| `/share/[id]`  | `app/share/[id]/page.tsx`     | "Shared note [id] — placeholder"  |
| `404`          | `app/not-found.tsx`           | "404 — Not Found"                 |

Each page is a default-exported function returning a single element with the dummy
text (e.g. `export default function LoginPage() { return <main>Login — placeholder</main>; }`).
The `[id]` pages accept `params` and display the id so the dynamic segment is visibly
wired, but do no lookups.

## Explicitly out of scope (deferred)

- Authentication / Better Auth wiring (user said not yet).
- Installing/configuring Next.js, Tailwind, TypeScript config, `package.json` scripts.
- Real UI, nav bar, server actions, DB, editor.

## Caveat to flag

These files won't compile or run until Next.js and a TS/JSX config are added in a later
scaffolding step (Next.js is not installed yet). That's expected — this step only lays
down the route files. I can do the Next.js install + config as the next step if wanted.

## Verification

- Confirm the file tree matches the table above (`app/` with the eight files).
- Once Next.js is installed in a later step, `bun run dev` should serve each route
  showing its placeholder text, and unknown routes should hit `not-found.tsx`.
