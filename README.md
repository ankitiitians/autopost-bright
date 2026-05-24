# autopost-bright

A modern, full-stack social media automation web application built with React 19, TanStack Start, Supabase, and deployed on Cloudflare Workers. The project is scaffolded and maintained via the [Lovable](https://lovable.dev) AI-powered development platform.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Database (Supabase)](#database-supabase)
- [Deployment (Cloudflare Workers)](#deployment-cloudflare-workers)
- [UI Component System](#ui-component-system)
- [Code Quality](#code-quality)
- [Security Notes](#security-notes)
- [Contributing](#contributing)

---

## Overview

**autopost-bright** is a web application designed to automate the process of scheduling and publishing posts across social media platforms. It provides a clean, responsive dashboard where users can compose content, schedule it for publishing, and track post history — all backed by a Supabase PostgreSQL database and served via a Cloudflare Workers edge runtime.

The project is ~96% TypeScript, with a small amount of PLpgSQL (Supabase database migrations) and CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 |
| Routing & SSR | TanStack Router + TanStack Start |
| Build Tool | Vite 7 (via `@lovable.dev/vite-tanstack-config`) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (New York style) + Radix UI primitives |
| Icons | Lucide React |
| Form Handling | React Hook Form + Zod validation |
| Data Fetching | TanStack Query v5 |
| Backend / Database | Supabase (PostgreSQL + Auth + Realtime) |
| Runtime / Deployment | Cloudflare Workers (via Wrangler) |
| Package Manager | Bun |
| Language | TypeScript 5.8 (strict mode) |
| Linting | ESLint 9 + TypeScript ESLint |
| Formatting | Prettier |

---

## Project Structure

```
autopost-bright/
├── .lovable/                  # Lovable platform configuration
├── src/                       # All application source code
│   ├── routes/                # TanStack Router file-based routes
│   │   └── __root.tsx         # Root layout / document shell
│   ├── components/            # Shared React components
│   │   └── ui/                # shadcn/ui auto-generated components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities (e.g., cn(), supabase client)
│   ├── styles.css             # Global Tailwind CSS entry point
│   └── server.ts              # SSR/Edge server entry point (Cloudflare Workers)
├── supabase/                  # Supabase project configuration
│   └── migrations/            # PostgreSQL migration files (PLpgSQL)
├── .env                       # Local environment variables (⚠️ committed — see Security Notes)
├── .gitignore
├── .prettierrc                # Prettier config
├── .prettierignore
├── bun.lock                   # Bun lockfile
├── bunfig.toml                # Bun configuration
├── components.json            # shadcn/ui CLI configuration
├── eslint.config.js           # ESLint flat config
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript compiler options
├── vite.config.ts             # Vite configuration (via Lovable wrapper)
└── wrangler.jsonc             # Cloudflare Workers (Wrangler) configuration
```

---

## Architecture

```
Browser
   │
   ▼
Cloudflare Workers Edge Runtime
   │  (src/server.ts — TanStack Start SSR handler)
   │
   ▼
TanStack Router (file-based routing in src/routes/)
   │
   ├── TanStack Query  ──►  Supabase JS Client
   │                              │
   │                        Supabase Project
   │                        ┌────────────┐
   │                        │ PostgreSQL │  ◄── supabase/migrations/
   │                        │    Auth    │
   │                        │  Realtime  │
   │                        └────────────┘
   │
   └── React 19 + shadcn/ui + Tailwind CSS v4
```

**Key design decisions:**

- **SSR on the Edge**: TanStack Start renders pages server-side inside a Cloudflare Worker, giving fast Time-To-First-Byte globally without a traditional Node.js server.
- **File-based routing**: Routes live as `.tsx` files inside `src/routes/`, following TanStack Router conventions — no manual route registration needed.
- **Supabase anon key on the client**: The publishable (anon) key is safe to expose in the browser; Row Level Security (RLS) policies in Supabase guard data access.
- **Lovable vite wrapper**: The `@lovable.dev/vite-tanstack-config` package bundles all necessary Vite plugins (TanStack Start, React, Tailwind, Cloudflare, path aliases) into a single `defineConfig` call to prevent duplicate plugin conflicts.

---

## Prerequisites

- [Bun](https://bun.sh) >= 1.x
- [Node.js](https://nodejs.org) >= 18 (required by some tooling)
- A [Supabase](https://supabase.com) project
- A [Cloudflare](https://cloudflare.com) account (for deployment)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`bun install -g wrangler`)

---

## Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/ankitiitians/autopost-bright.git
cd autopost-bright
```

**2. Install dependencies**

```bash
bun install
```

**3. Configure environment variables**

Copy the example and fill in your own Supabase credentials (see [Environment Variables](#environment-variables) below):

```bash
cp .env .env.local
```

Edit `.env.local` with your actual Supabase project URL and anon key.

**4. Run database migrations**

```bash
npx supabase db push
# or link your project first:
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**5. Start the development server**

```bash
bun run dev
```

The app will be available at `http://localhost:5173` (or the port Vite selects).

---

## Environment Variables

The following variables are required. In development, place them in `.env` (or `.env.local`). For production, set them as Cloudflare Worker secrets via `wrangler secret put`.

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL (server-side) |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key (server-side) |
| `VITE_SUPABASE_URL` | Same URL, exposed to the client via Vite |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same anon key, exposed to the client via Vite |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID |

> Variables prefixed with `VITE_` are injected into the browser bundle by Vite. The un-prefixed variants are available server-side in the Cloudflare Worker runtime.

---

## Available Scripts

All scripts are run with `bun run <script>`.

| Script | Description |
|---|---|
| `dev` | Start the Vite development server with HMR |
| `build` | Production build (outputs to `dist/`) |
| `build:dev` | Development-mode build (useful for debugging) |
| `preview` | Preview the production build locally |
| `lint` | Run ESLint across all source files |
| `format` | Format all files with Prettier |

---

## Database (Supabase)

Database schema is managed as SQL migration files under `supabase/migrations/`. Each file is a timestamped PLpgSQL script that Supabase applies in order.

**Working with migrations:**

```bash
# Create a new migration
npx supabase migration new <migration_name>

# Apply pending migrations to your linked project
npx supabase db push

# Pull remote schema changes into local migrations
npx supabase db pull

# Start a local Supabase instance (requires Docker)
npx supabase start
```

Supabase Auth is used for user authentication. All database tables should have Row Level Security (RLS) enabled with appropriate policies so the anon key cannot bypass access controls.

---

## Deployment (Cloudflare Workers)

The application targets the Cloudflare Workers runtime. The entry point is `src/server.ts`, as specified in `wrangler.jsonc`.

**Wrangler configuration highlights (`wrangler.jsonc`):**

```jsonc
{
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "src/server.ts"
}
```

**Deploy to Cloudflare:**

```bash
# Authenticate with Cloudflare (first time only)
npx wrangler login

# Build and deploy
bun run build
npx wrangler deploy

# Or use Wrangler's dev mode to test against the actual edge runtime locally
npx wrangler dev
```

**Set production secrets:**

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
```

---

## UI Component System

This project uses [shadcn/ui](https://ui.shadcn.com) with the **New York** style variant and **Slate** as the base color.

**shadcn/ui configuration (`components.json`):**

- Style: `new-york`
- Base color: `slate`
- CSS variables: enabled
- Icons: `lucide-react`
- Aliases: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`

All Radix UI primitives are included as dependencies (accordion, dialog, dropdown, popover, select, tabs, tooltip, etc.), giving you a comprehensive, accessible component foundation.

**Adding a new shadcn/ui component:**

```bash
npx shadcn@latest add <component-name>
# e.g.
npx shadcn@latest add calendar
npx shadcn@latest add data-table
```

Components are generated into `src/components/ui/`.

---

## Code Quality

**TypeScript** is configured in strict mode (`"strict": true`) with `ES2022` target and `Bundler` module resolution. Path alias `@/*` maps to `src/*`.

**ESLint** uses the flat config format (`eslint.config.js`) with:
- `@eslint/js` recommended rules
- `typescript-eslint` for TypeScript-aware linting
- `eslint-plugin-react-hooks` for React hooks rules
- `eslint-plugin-react-refresh` for Fast Refresh compatibility
- `eslint-plugin-prettier` to surface formatting issues as lint errors

**Prettier** handles all formatting. The config is in `.prettierrc` and `.prettierignore` controls which files are skipped.

Run both together before committing:

```bash
bun run lint
bun run format
```

---

## Security Notes

> ⚠️ **Important**: The `.env` file containing Supabase credentials has been committed to the repository. This is a security concern. You should:
>
> 1. Rotate the Supabase anon key immediately in your Supabase project dashboard.
> 2. Add `.env` to `.gitignore` and remove it from git history.
> 3. Use `.env.local` (already gitignored by Vite) for local secrets going forward.
> 4. Store production secrets exclusively as Cloudflare Worker secrets, not in the codebase.
>
> The anon (publishable) key is low-risk on its own **only if** all your Supabase tables have proper Row Level Security policies enabled. Without RLS, the exposed anon key allows unauthenticated reads/writes to your database.

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes, ensuring `bun run lint` and `bun run format` pass cleanly.
3. Commit with a descriptive message.
4. Open a pull request against `main`.

For larger changes, open an issue first to discuss the approach.

---

*Built with [Lovable](https://lovable.dev) · Deployed on [Cloudflare Workers](https://workers.cloudflare.com) · Powered by [Supabase](https://supabase.com)*
