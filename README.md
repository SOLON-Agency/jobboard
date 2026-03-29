# LegalJobs — Legal Career Platform

A production-grade job platform for the legal industry built with **Next.js 16** (App Router, SSG/ISR) and **Supabase** (Auth, Database, Realtime, Storage, Edge Functions).

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, MUI v5
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Validation:** Zod + React Hook Form
- **Styling:** MUI with custom dark futuristic theme
- **Testing:** Vitest + React Testing Library

## Features

- **Authentication:** Email/password + Google, Facebook, X (Twitter) SSO
- **Job Listings:** CRUD with markdown descriptions, SSG with ISR
- **Job Search:** URL-driven filtering with full-text search (PostgreSQL tsvector)
- **Company Profiles:** Public profiles with SSG
- **Applications:** Apply with CV upload, status tracking
- **Form Builder:** Dynamic application forms
- **Favorites:** Save jobs for later
- **Job Alerts:** Saved search filters with daily/weekly notifications
- **Real-time Notifications:** Supabase Realtime subscriptions
- **Messaging:** Real-time chat between users
- **External Ingestion:** Edge function scraping legal job sites
- **SEO:** JSON-LD structured data, dynamic sitemap, OpenGraph tags
- **Row-Level Security:** Database-enforced access control

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (or local Supabase CLI)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/SOLON-Agency/jobboard.git
cd jobboard
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Database

The database schema is applied automatically via Supabase migrations. Key tables:

- `profiles` — User profiles (extends auth.users)
- `companies` — Company information
- `company_users` — User-company relationships (roles: owner, admin, member)
- `job_listings` — Job postings with full-text search
- `applications` — Job applications
- `forms` / `form_fields` — Dynamic application forms
- `favorites` — Saved jobs
- `alerts` — Search filter alerts
- `conversations` / `messages` — Real-time messaging
- `notifications` — User notifications

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## Project Structure

```
src/
  app/              # Next.js App Router pages
    (public)/       # Public pages (home, jobs, companies, how-it-works, policy)
    (auth)/         # Auth pages (login, register, callback)
    (dashboard)/    # Protected dashboard pages
  components/       # Reusable UI components
  hooks/            # Custom React hooks
  lib/              # Supabase clients, utilities, SEO helpers
  services/         # Business logic / data layer
  types/            # TypeScript types (auto-generated from Supabase)
  theme/            # MUI theme configuration
supabase/
  functions/        # Edge Functions (scrape-jobs)
```

## UI Conventions

### Create & Edit — Right-Side Drawer

All create and edit flows in the dashboard use a right-side `EditSideDrawer` (`src/components/layout/EditSideDrawer.tsx`) instead of separate pages or inline forms.

**Rule:** Whenever a user triggers a create or edit action on any entity (company, job listing, profile, etc.), open the `EditSideDrawer` with the relevant form inside.

```tsx
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";

<EditSideDrawer
  open={drawerOpen}
  onClose={closeDrawer}
  title="Edit Company"
  message={message}
  onMessageClose={() => setMessage(null)}
>
  <YourForm onSubmit={handleSubmit(onSubmit)} />
</EditSideDrawer>
```

**Pattern used across:**
- `dashboard/company/page.tsx` — create & edit company
- `dashboard/jobs/page.tsx` — create & edit job listings
- `dashboard/profile/page.tsx` — edit profile

**Do not create separate `/new` or `/[id]/edit` pages** for entities managed in the dashboard. Redirect any such routes back to the parent listing page.

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## License

Private — SOLON Agency
