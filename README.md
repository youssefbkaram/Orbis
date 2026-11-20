# Orbis

Orbis is a Next.js starter using TypeScript, Tailwind CSS, SCSS, shadcn/ui,
Zod, Drizzle ORM, Neon PostgreSQL, and Better Auth.

## Getting started

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to your Neon PostgreSQL connection string.
3. Generate a high-entropy auth secret with `npx auth@latest secret`, then set
   it as `BETTER_AUTH_SECRET`. Keep the secret private and never commit it.
4. Set `BETTER_AUTH_URL` to the app origin (`http://localhost:3000` locally).
5. In Google Cloud Console, create a **Web application** OAuth client and add
   `http://localhost:3000/api/auth/callback/google` as an authorized redirect
   URI. Set its client ID and secret in `.env.local`. Add your production
   callback URI when deploying.
6. Email/password sign-up and sign-in work with the database and Better Auth
   secret. Without SMTP, new accounts are signed in immediately and email
   verification and password recovery are unavailable. Configure all five
   `SMTP_*` values to enable verification and password recovery. Google OAuth
   is optional.
7. Generate and apply the database migration:

   ```sh
   npm run db:generate
   npm run db:migrate
   ```

8. Start the app with `npm run dev`.

## Deploying to Vercel

Import `youssefbkaram/Orbis` as a Next.js project and set these environment
variables for Production, Preview, and Development:

- `DATABASE_URL` — the Neon PostgreSQL connection string.
- `BETTER_AUTH_SECRET` — a private, high-entropy secret.
- `BETTER_AUTH_URL` — the deployed app's HTTPS origin.

Apply the migrations to the Neon database with `npm run db:migrate` before
using the app. Google sign-in additionally needs `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET`, with the production callback URL
`<BETTER_AUTH_URL>/api/auth/callback/google`. Email verification and password
recovery require all five `SMTP_*` variables; without them, email/password
sign-in and sign-up remain available, but those email features are disabled.

Authentication pages are available at `/sign-in` and `/sign-up`. The workspace
is protected by a server-side session check. Better Auth handles password
hashing, OAuth state and callback validation, session cookies, verification
tokens, and rate limiting. Auth tables and the rate-limit table are defined in
`src/lib/db/schema/auth.ts`.

The Tasks page stores tasks in Neon and scopes every read and mutation to the
signed-in Better Auth user. Tasks can be created, scheduled by date, marked
complete, filtered, and auto-scheduled by priority. The task table migration is
included in `drizzle/`; apply pending migrations with `npm run db:migrate`.
Open any task to edit its title, description, project, date, deadline, priority,
labels, reminders, and location. The task details dialog includes task
navigation and actions, plus a quick-add area for subtasks with their own date,
priority, and reminder settings. Task edits save automatically.
The quick-add composer recognizes `today`, `tomorrow`, ISO dates, `p1` through
`p4` (also `!1` through `!4`), and `#project-name` directly in the task text.
Recognized date and priority commands are highlighted while typing; press
Backspace at the end of a highlighted command to keep it as ordinary task text.
Date and priority can also be chosen from the composer's menus without adding
commands to the task name. Priority 1 is highest; priority 4 is the default.

The Projects page stores user-owned initiatives in Neon. Create projects with
an optional description, multiple life domains, start date, and target date;
the creation form is intentionally quick and does not assign dates automatically.
Edit projects with a domain, target date, description, color, and progress; mark
projects complete, reopen them, or archive and restore them. Active, completed,
and archived views include search and domain filtering. After adding or
changing the Projects schema, apply the generated migration with
`npm run db:migrate`.

If Better Auth features change, regenerate its schema before generating a
Drizzle migration:

```sh
npx auth@latest generate --config src/lib/auth/config.ts --output src/lib/db/schema/auth.ts --yes
npm run db:generate
```

## Project structure

- `src/app/` — Next.js App Router routes and layouts
- `src/components/auth/` — sign-in, sign-up, and account-recovery UI
- `src/components/pages/tasks/` — task page UI components
- `src/components/pages/projects/` — project portfolio and editor components
- `src/components/layout/` — authenticated app shell and navigation
- `src/lib/auth/` — Better Auth server/client configuration and session access
- `src/lib/db/` — Neon connection and Drizzle schema
- `src/styles/` — shared SCSS styles
- `drizzle/` — generated SQL migrations

## Useful commands

```sh
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate
```
