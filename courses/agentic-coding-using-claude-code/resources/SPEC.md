# Note-Taking App — Specification

## Overall Design Philosophy

- Single-user ownership model (no collaboration)
- Server-first architecture
- Minimal dependencies
- No ORM
- Raw SQL only
- SQLite only
- No REST API unless required by Better Auth
- Next.js App Router
- Server Actions for all CRUD operations
- Route Handlers only where Better Auth requires them
- React Server Components by default
- Client Components only for interactive UI (TipTap)

---

## Stack

| Technology      | Choice                  |
| --------------- | ----------------------- |
| Runtime         | Bun                     |
| Framework       | Next.js App Router      |
| Language        | TypeScript              |
| Styling         | Tailwind CSS            |
| Authentication  | Better Auth             |
| Database        | SQLite                  |
| Database Access | Bun SQLite + raw SQL    |
| Editor          | TipTap                  |
| Testing         | Vitest + Playwright     |
| Linting         | ESLint                  |
| Formatting      | Prettier                |

---

## Authentication

Assumptions:

- Email/password only
- Registration
- Login
- Logout
- Password hashing handled by Better Auth
- No OAuth
- No email verification
- No password reset
- Session cookies

---

## User Model

Only what Better Auth requires (see [Database Schema](#database-schema) for the full auth tables).

- No profile page.
- No avatars.
- No usernames.

Better Auth's `user` table includes `name`, `image`, and `emailVerified` fields as part of its required core schema. Since this app has no OAuth, no email verification, and no profiles, these columns exist to satisfy the framework but are otherwise unused (`name` may be stored, `image` left null, `emailVerified` effectively always false).

---

## Notes

Each note has `id`, `userId`, `title`, `contentJson`, `isPublic`, `createdAt`, and `updatedAt`, where `title` is required.

**Reason:** Lists of untitled notes become difficult to navigate.

---

## Rich Text

- Store TipTap JSON directly.
- Never store HTML.
- HTML is generated only when rendering.

---

## Public Sharing

A public note is available at `/share/[id]` (example: `/share/42`).

- No random token.
- No expiration.
- If `isPublic = false`, the page returns 404.

---

## Authorization

- Owner can read, edit, delete, and share.
- Everyone can read public notes.
- Nobody else can edit anything.

---

## Saving

Manual save. No autosave.

**Reason:** Much simpler.

---

## Editor Features

Exactly the requested features: paragraph, H1, H2, H3, bold, italic, inline code, code block, bullet list, and horizontal rule.

No images. No tables. No links. No markdown.

---

## Dashboard

After login:

```
My Notes
--------------------------------
New Note
Shopping List
Vacation
Meeting Notes
```

- Simple searchable list is not included.
- Just ordered by `updatedAt DESC`.

---

## Pages

- `/`
- `login`
- `register`
- `dashboard`
- `notes/new`
- `notes/[id]`
- `share/[id]`
- `404`

---

## Layout

Navigation bar:

- Logo
- My Notes
- New Note
- Logout

---

## Database

One application-owned table:

- `notes`

Better Auth owns and creates its own core tables: `user`, `session`, `account`, and `verification`. These are managed by the framework's migration/schema tooling — the app should not hand-write or alter them. The `notes.userId` column references `user.id`.

See [Database Schema](#database-schema) for the full definitions.

---

## Server Actions

Instead of REST APIs:

- `createNote()`
- `updateNote()`
- `deleteNote()`
- `togglePublic()`
- `getUserNotes()`
- `getNote()`
- `getPublicNote()`

---

## Validation

**Title**

- Required
- Max 100 characters

**Content**

- Valid TipTap JSON
- Maximum JSON size 1 MB

---

## Error Handling

Simple.

| Condition          | Result              |
| ------------------ | ------------------- |
| Unauthorized       | Redirect to login   |
| Forbidden          | 403                 |
| Missing note       | 404                 |
| Invalid input      | Validation message  |
| Unexpected errors  | Generic error page  |

---

## Security

- SQL parameters everywhere
- Better Auth session validation
- Server-side authorization
- Escape rendered HTML
- No client-side authorization decisions

---

## Performance

No optimization beyond:

- Server Components
- SQL indexes
- Pagination unnecessary initially

---

## Folder Structure

```
app/
    login/
    register/
    dashboard/
    notes/
        new/
        [id]/
    share/
        [id]/
components/
    editor/
    ui/
lib/
    auth/
    db/
    notes/
    validation/
actions/
    notes.ts
styles/
tests/
public/
```

---

## Database Schema

### Application table

#### `notes`

```sql
id          INTEGER PRIMARY KEY
userId      TEXT NOT NULL REFERENCES user(id)
title       TEXT NOT NULL
contentJson TEXT NOT NULL
isPublic    INTEGER NOT NULL DEFAULT 0
createdAt   TEXT NOT NULL
updatedAt   TEXT NOT NULL
```

**Indexes**

- `userId`
- `updatedAt`
- `isPublic`

### Better Auth core tables

These tables follow the Better Auth core schema and are created/managed by Better Auth's own tooling. Types are shown as mapped to SQLite: `string`/`Date` → `TEXT`, `boolean` → `INTEGER` (0/1). Field names must match exactly, since Better Auth relies on them internally.

#### `user`

```sql
id            TEXT PRIMARY KEY
name          TEXT NOT NULL
email         TEXT NOT NULL UNIQUE
emailVerified INTEGER NOT NULL DEFAULT 0
image         TEXT                        -- nullable
createdAt     TEXT NOT NULL
updatedAt     TEXT NOT NULL
```

#### `session`

```sql
id        TEXT PRIMARY KEY
userId    TEXT NOT NULL REFERENCES user(id)
token     TEXT NOT NULL UNIQUE
expiresAt TEXT NOT NULL
ipAddress TEXT                            -- nullable
userAgent TEXT                            -- nullable
createdAt TEXT NOT NULL
updatedAt TEXT NOT NULL
```

#### `account`

```sql
id                    TEXT PRIMARY KEY
userId                TEXT NOT NULL REFERENCES user(id)
accountId             TEXT NOT NULL
providerId            TEXT NOT NULL
accessToken           TEXT                -- nullable
refreshToken          TEXT                -- nullable
accessTokenExpiresAt  TEXT                -- nullable
refreshTokenExpiresAt TEXT                -- nullable
scope                 TEXT                -- nullable
idToken               TEXT                -- nullable
password              TEXT                -- nullable (email/password hash lives here)
createdAt             TEXT NOT NULL
updatedAt             TEXT NOT NULL
```

#### `verification`

```sql
id         TEXT PRIMARY KEY
identifier TEXT NOT NULL
value      TEXT NOT NULL
expiresAt  TEXT NOT NULL
createdAt  TEXT NOT NULL
updatedAt  TEXT NOT NULL
```

> **Note:** For email/password auth, the user's hashed password is stored in `account.password` (with `providerId = "credential"`), **not** on the `user` table. The `session`, `account`, and `verification` tables are required by Better Auth even though this app uses neither OAuth nor email verification.

---

## Testing

I would include three layers.

### Unit Tests (Vitest)

- SQL helper functions
- Validation
- Utility functions
- Permission checking

### Component Tests (Vitest)

- Toolbar buttons
- Note list
- Editor wrapper
- Form validation

### End-to-End Tests (Playwright)

- Registration
- Login
- Logout
- Create note
- Edit note
- Delete note
- Share note
- Unshare note
- Anonymous viewing public note
- Anonymous cannot view private note
- Unauthorized edit blocked

---

## Non-Functional Requirements

- TypeScript strict mode
- ESLint clean
- Prettier formatted
- No TypeScript warnings
- Responsive layout
- Keyboard accessible
- WCAG AA colors
- Mobile-friendly

---

## Deliberately Excluded Features

To keep the implementation aligned with the "minimum essential features" requirement, the specification explicitly excludes:

- Folders
- Tags
- Search
- Favorites
- Trash/recycle bin
- Version history
- Autosave
- Collaborative editing
- Comments
- Images
- Attachments
- Links
- Tables
- Markdown import/export
- Note duplication
- Dark mode
- User profiles
- Notifications
- Activity logs
- Admin functionality
- Rate limiting
- Background jobs
- Caching
- Optimistic UI
- WebSockets
- Offline support

---

## Final Recommendation

I would structure the specification as a professional software design document rather than a feature checklist. It would include:

1. Project overview and goals
2. Technology stack and rationale
3. System architecture
4. Directory structure
5. Database schema
6. Authentication and authorization
7. Functional requirements
8. User interface and page specifications
9. Component design
10. Server Actions and data flow
11. SQL schema and representative queries
12. Validation and error handling
13. Security considerations
14. Testing strategy with unit, component, and end-to-end test cases
15. Build and deployment instructions
16. Implementation roadmap by development phase

That level of detail is typically sufficient to serve as the single source of truth throughout implementation and allows either a human developer or an AI coding agent to build the application consistently from the specification.
