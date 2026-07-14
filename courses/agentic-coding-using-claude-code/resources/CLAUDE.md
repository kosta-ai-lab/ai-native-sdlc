# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

This project is **spec-only**. The only files present are `SPEC.md`, `package.json`, and `bun.lock` — there is no application source code yet. `SPEC.md` is the authoritative design document: build against it, and do not add features it excludes.

## Stack

- **Runtime:** Bun (not Node). Use `bun install`, `bun run`, `bun test`.
- **Framework:** Next.js App Router + TypeScript, React Server Components by default.
- **Database:** SQLite via **Bun's built-in `bun:sqlite`** with **raw, parameterized SQL — no ORM**.
- **Auth:** Better Auth (email/password only).
- **Editor:** TipTap (`@tiptap/react`, `@tiptap/starter-kit`).
- **Validation:** Zod.
- Styling: Tailwind CSS. Testing: Vitest (unit/component) + Playwright (e2e). Lint: ESLint. Format: Prettier.

Currently installed dependencies: `@tiptap/*`, `better-auth`, `zod`. Everything else (Next.js, Tailwind, test tooling) still needs to be added when implementation begins. `package.json` has no `scripts` yet — add `dev`/`build`/`test`/`lint` when scaffolding.

## Architecture constraints (from SPEC.md — non-obvious, enforce these)

- **Server-first.** All CRUD goes through **Server Actions**, not a REST API. The only route handlers permitted are the ones Better Auth requires. Use Client Components only for interactive UI (the TipTap editor and toolbar).
- **Single-user ownership.** No collaboration, no random share tokens. A note is private or public at a fixed URL `/share/[id]`; when `isPublic = false` that page returns 404.
- **Authorization is server-side only.** Owner can read/edit/delete/share; anyone can read a public note; nobody else can edit. Never make authorization decisions on the client.
- **Database ownership split:** the app owns exactly one table, `notes`. Better Auth owns and migrates `user`, `session`, `account`, and `verification` — do not hand-write or alter those. `notes.userId` references `user.id`. For email/password, the password hash lives in `account.password` (provider `credential`), not on `user`.
- **Rich text storage:** store TipTap **JSON** directly in `notes.contentJson`. **Never store HTML** — generate HTML only at render time, and escape it when rendering.
- **SQL safety:** parameterized queries everywhere; never interpolate values into SQL strings.
- **Saving is manual** (no autosave). The dashboard lists notes ordered by `updatedAt DESC` (no search or pagination initially).

## Server Actions to implement

`createNote`, `updateNote`, `deleteNote`, `togglePublic`, `getUserNotes`, `getNote`, `getPublicNote`.

## Validation rules

- Title: required, max 100 characters.
- Content: valid TipTap JSON, max 1 MB.

## `notes` table schema

```sql
id          INTEGER PRIMARY KEY
userId      TEXT NOT NULL REFERENCES user(id)
title       TEXT NOT NULL
contentJson TEXT NOT NULL
isPublic    INTEGER NOT NULL DEFAULT 0
createdAt   TEXT NOT NULL
updatedAt   TEXT NOT NULL
-- indexes on: userId, updatedAt, isPublic
```

## Intended layout (from SPEC.md)

```
app/{login,register,dashboard,notes/{new,[id]},share/[id]}
components/{editor,ui}
lib/{auth,db,notes,validation}
actions/notes.ts
```

## Editor scope

Exactly these TipTap features: paragraph, H1, H2, H3, bold, italic, inline code, code block, bullet list, horizontal rule. No images, tables, links, or markdown.

## Excluded by design

Do not add: folders, tags, search, favorites, trash, version history, autosave, collaboration, comments, images, attachments, links, tables, markdown import/export, dark mode, profiles, notifications, rate limiting, caching, optimistic UI, websockets, or offline support. See the "Deliberately Excluded Features" section of `SPEC.md`.
