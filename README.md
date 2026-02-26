# Clarifio

> Lecture notes that clarify themselves.

A focused note-taking tool for students. Write lecture notes, flag unfamiliar terms, and get AI-powered definitions in context — all in one place.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend/Auth/DB:** Supabase (Postgres + Row Level Security + Auth)
- **AI:** Anthropic Claude via Supabase Edge Function (API key stays server-side)

---

## Setup

### 1. Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL editor, run the contents of `supabase/migrations/001_initial_schema.sql`
3. Copy your **Project URL** and **anon public key** from Project Settings → API

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Supabase Edge Function

Deploy the `clarify-terms` edge function:

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set the Anthropic API key as a secret (never in code)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Deploy the function
supabase functions deploy clarify-terms
```

### 4. Install & Run

```bash
npm install
npm run dev
```

---

## Deployment (Vercel / Netlify)

Build command: `npm run build`
Output directory: `dist`

Set the same environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your hosting platform's dashboard.

The Edge Function runs entirely within Supabase — no server-side code needed in your frontend host.

---

## Data Hierarchy

```
User
└── Program (e.g. "MSc Mechanical Engineering")
    └── Course (e.g. "Fluid Dynamics II")
        └── Note Session (e.g. "Lecture 12 — Boundary Layers")
            ├── notes: free-form text (auto-saved)
            └── terms: [{ term, definition? }]
```
