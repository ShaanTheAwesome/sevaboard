# SevaBoard

A real-time event management platform for organising Krishna Janmashtami — built for a community organising team of dozens of people coordinating across multiple departments.

## What it does

SevaBoard replaces scattered spreadsheets and group chats with a single shared dashboard covering:

- **Dashboard** — event countdown and upcoming task summary
- **Program Planner** — time-grid schedule across multiple rooms with configurable sub-columns
- **Planning Timeline** — drag-and-drop week-by-week task board (weeks 16 → 0) with auto-scroll to the current week
- **Budget & Spending** — income/expense tracking with TBA support, side-by-side layout, filters, and summary cards
- **Venue Details** — address, event date/time, map link, parking notes
- **Team & Roles** — member list and department management (admin-only editing)
- **Design List** — poster/social media design tracker (placeholder)
- **Seva Roster** — volunteer shift assignments (placeholder)

The site is publicly viewable — anyone with the URL can browse the schedule, tasks, and budget. Only admins and team leads can log in to make changes.

## Tech stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Base UI)
- **Backend**: Supabase (Postgres, Auth, Row Level Security, Edge Functions)
- **State**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Drag & drop**: dnd-kit
- **PWA**: vite-plugin-pwa
- **Hosting**: Vercel (planned)

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo and install dependencies:

   ```sh
   git clone <repo-url>
   cd sevaboard
   npm install
   ```

2. Create a `.env` file with your Supabase credentials:

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Run the database schema and seed data in the Supabase SQL Editor — see [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) for the full walkthrough.

4. Run the migrations in order:

   ```
   supabase/migrations/001_budget_tba.sql
   supabase/migrations/002_program_planner.sql
   supabase/migrations/003_public_read.sql
   ```

5. Deploy the Edge Functions:

   ```sh
   npx supabase functions deploy invite-member
   npx supabase functions deploy remove-member
   ```

6. Start the dev server:

   ```sh
   npm run dev
   ```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |
| `npm run generate-icons` | Regenerate PWA icons from SVG sources |

## Project structure

See [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) for a detailed breakdown of every directory and file.

## Documentation

- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) — Supabase project setup guide
- [`docs/PROJECT_LOG.md`](docs/PROJECT_LOG.md) — architecture decisions, schema summary, and implementation log
- [`docs/SECURITY.md`](docs/SECURITY.md) — security model, RLS policies, Edge Function trust model, and audit findings
