# LifeMap OS — Personal Progress & Cloud Execution System

LifeMap OS is an engineering-first personal operating system and progress tracker designed for students and developers. It supports balanced growth across Technical Mastery, Communication, Career Readiness, Creativity, and Health with cloud synchronization backed by Supabase PostgreSQL and Row-Level Security (RLS).

---

## ⚡ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8
- **Styling**: Vanilla CSS design system with glassmorphism & dark-mode aesthetics
- **Cloud Database & Auth**: Supabase PostgreSQL + GoTrue Auth SDK (`@supabase/supabase-js`)
- **Offline / Demo Mode**: IndexedDB (`idb`) fallback
- **Testing**: Vitest 5
- **Linting**: Oxlint

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js 18+ installed
- npm or pnpm

### 2. Installation
```bash
git clone <repo-url>
cd lets-do-it
npm install
```

### 3. Environment Variables Configuration
Copy the provided example file:
```bash
cp .env.example .env.local
```

Fill in your actual Supabase project credentials in `.env.local`:
```env
# Supabase Project URL (Dashboard -> Project Settings -> API -> Project URL)
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Public Key (Dashboard -> Project Settings -> API -> anon/public)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
> **Security Notice**: Never commit `.env` or `.env.local` to git. Never expose your Supabase `service_role` key in frontend client code.

### 4. Running the App
```bash
# Start local Vite development server
npm run dev

# Run unit and integration tests
npm run test

# Run linter
npm run lint

# Compile and create production bundle
npm run build
```

---

## 🗄️ Database Setup & SQL Migration

LifeMap OS uses a dedicated `public.tasks` table with strict PostgreSQL Row-Level Security (RLS) policies.

### Steps to Run Migrations:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to **SQL Editor** in the left sidebar.
3. Open or copy the migration script located at:
   ```
   supabase/migrations/20261011000000_create_tasks_table.sql
   ```
4. Click **Run** to execute the migration.
5. This creates:
   - `public.tasks` table with UUID primary keys and foreign keys referencing `auth.users(id) ON DELETE CASCADE`.
   - Automatic `updated_at` trigger (`handle_updated_at`).
   - Performance indexes on `(user_id)`, `(user_id, due_date)`, `(user_id, status)`, and `(user_id, area)`.
   - **Row-Level Security (RLS)** policies restricting `SELECT`, `INSERT`, `UPDATE`, and `DELETE` strictly to `auth.uid() = user_id`.

---

## 🔐 Supabase Authentication & Email Verification Setup

Because Supabase defaults to requiring email confirmation before sign-in (`mailer_autoconfirm = false`), ensure your project authentication is properly configured:

### 1. Site URL & Redirect URLs Configuration
1. In your Supabase Dashboard, go to **Authentication** -> **URL Configuration**.
2. **Site URL**:
   - For local development: `http://localhost:5173`
   - For production: `https://your-lifemap-deployment.vercel.app`
3. **Redirect URLs**: Add both local and production URLs to the allow list:
   - `http://localhost:5173`
   - `http://localhost:5173/**`
   - `http://127.0.0.1:5173`
   - `https://your-lifemap-deployment.vercel.app`
   - `https://your-lifemap-deployment.vercel.app/**`

### 2. Email Templates & Confirmation Flow
- Under **Authentication** -> **Email Templates**, verify that the Confirmation template points to:
  `{{ .SiteURL }}` or `{{ .RedirectTo }}`.
- When a user signs up, LifeMap OS automatically attaches `options: { emailRedirectTo: window.location.origin }`, directing the user to the active domain (local or Vercel).
- If a user attempts to sign in prior to confirmation, LifeMap displays:
  *"Your email has not been verified yet. Please check your inbox for the confirmation email before signing in."*
- If an account already exists, LifeMap OS flags:
  *"An account with this email already exists. Please sign in or reset your password."*
- If a user clicks an expired verification link, LifeMap detects URL error fragments (`#error=...`) and displays:
  *"The verification or reset link has expired. Please request a new link."*

### 3. Password Reset
- Users can click **Forgot password?** on the sign-in modal.
- Clicking the link in the recovery email triggers the in-app password recovery modal (`updateUser({ password })`), allowing the user to establish a new password securely.

---

## 🔄 Reversible Task Completion & Data Isolation

1. **Reversible Completion Toggle**:
   - Clicking the task checkbox toggles between `not-started` and `completed`.
   - Completed tasks have their timestamp recorded in `completedAt` and `completed_at` in Postgres.
   - Unchecking a completed task sets `status = 'not-started'` and sets `completed_at = NULL` in Postgres.
   - Dashboard completion rings, daily progress counts, overdue alerts, and weighted area calculations update immediately and deterministically.
2. **Optimistic Updates & Server Rollback**:
   - Status changes update the UI instantly.
   - If an error occurs during cloud persistence (e.g. network interruption or missing database table), the state is rolled back to its previous value and a descriptive banner is surfaced.
3. **Account Isolation**:
   - In cloud mode, tasks are filtered and modified only for the authenticated `user.id`.
   - Signing out purges all in-memory task states.
   - Cloud tasks are never persisted into un-scoped offline cache stores, preventing data leakage across accounts.

---

## 🚀 Deploying to Vercel

The application is pre-configured for seamless deployment to Vercel using `vercel.json` and Vite.

### Step-by-Step Vercel Deployment:

1. **Push your code to GitHub / GitLab / Bitbucket**:
   ```bash
   git add .
   git commit -m "feat: bug fixes, reversible task completion, and vercel deployment readiness"
   git push origin main
   ```

2. **Import Project into Vercel**:
   - Visit [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
   - Select your repository.
   - Framework Preset: **Vite** (detected automatically).
   - Root Directory: `./`
   - Build Command: `npm run build` (or `tsc -b && vite build`)
   - Output Directory: `dist`

3. **Configure Production Environment Variables**:
   In the Vercel project configuration, add:
   - `VITE_SUPABASE_URL`: `https://<your-project-id>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your-supabase-anon-public-key>`

4. **Deploy**:
   - Click **Deploy**.
   - Vercel will run `tsc -b && vite build` and deploy the output.

5. **Post-Deployment Verification**:
   - Copy your production domain (e.g. `https://your-lifemap-app.vercel.app`).
   - In your Supabase Dashboard under **Authentication -> URL Configuration**, add your production domain to **Site URL** and **Redirect URLs**.
   - Open the live Vercel URL in your browser:
     1. Verify the landing screen loads without infinite spinners.
     2. Create a test account and verify email confirmation.
     3. Sign in, add tasks, and test reversible completion toggling.
     4. Refresh the page to confirm cloud persistence.
     5. Sign out and verify offline demo mode works independently.
