# Clarifio — Claude Code Project Notes

## What this project is
A lecture note-taking web app with AI-powered term definitions.
Students write notes, flag unfamiliar terms, and get concise definitions generated using their own notes as context.

## Tech Stack
- **Frontend**: React 18 + Vite 7 + TypeScript (strict) + Tailwind CSS v3
- **Backend / Auth / DB**: Supabase (Postgres + Row Level Security + Auth)
- **AI**: Anthropic claude-sonnet-4-20250514, called from a Supabase Edge Function only
- **Payments**: Stripe Checkout (hosted), webhook-based subscription management
- **i18n**: i18next + react-i18next (EN + PT, scalable to more languages)

## Key Commands
```bash
npm run dev        # local dev server
npm run build      # tsc + vite build → dist/
npm run preview    # preview production build locally
```

## Environment
Copy `.env.example` → `.env` and fill in:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Auth / Guest Architecture
- **Anonymous auth**: On first visit, `signInAnonymously()` auto-creates a guest session
- Guests have a valid Supabase JWT and full RLS access — all hooks work unchanged
- **Free limits** (guests only): 1 program, 1 course, unlimited terms in 1 clarify session
- After any limit: `UpgradeModal` opens prompting account creation + payment
- `linkEmail(email, password)` converts anonymous account to permanent (preserves all data)
- On `SIGNED_OUT`, a new anonymous session is immediately created
- `isGuest = user.is_anonymous && !isSubscribed`
- Clarify-used flag stored in `localStorage('clarifio-guest-clarified')`

## Payment Flow
1. Guest hits a limit → `UpgradeModal` shows pricing (€5.99/mo or €49.99/yr)
2. User enters email + password → `linkEmail()` converts their account
3. Client calls `create-checkout-session` edge function → gets Stripe URL
4. `window.location.href = stripeUrl` (hard redirect to Stripe Checkout)
5. On return: `?checkout_success=1&session_id=` in URL
6. App.tsx calls `verify-payment` edge function → upserts subscription record
7. `refreshSub()` re-checks → `isSubscribed = true` → all limits lifted

## Supabase Secrets Required
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

## Navigation Architecture
Client-side state machine — no router library. All state lives in `Dashboard.tsx`.

The `View` union type (`src/types/index.ts`) drives everything:
- `{ type: 'dashboard' }` → program list
- `{ type: 'course', programId, courseId: '' }` → course list for a program
- `{ type: 'course', programId, courseId }` → session list for a course
- `{ type: 'session', programId, courseId, sessionId }` → note-taking view

## Supabase Setup
1. Enable anonymous sign-ins: Dashboard → Authentication → Settings → "Allow anonymous sign-ins"
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Run `supabase/migrations/002_subscriptions.sql` in the SQL editor
4. Set all secrets (see above)
5. Deploy edge functions:
   ```bash
   supabase functions deploy clarify-terms
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   supabase functions deploy verify-payment
   ```
6. Register Stripe webhook endpoint: `https://<project>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Adding a New Language
1. Create `src/locales/<lang>.json` mirroring the structure of `en.json`
2. In `src/lib/i18n.ts`, import it and add it to the `resources` object and `SUPPORTED` array
3. Update `LanguageSwitcher.tsx` to cycle through the new language

## Design Rules (do not violate)
- **No dividers**: no `border-b`, `border-t`, `<hr>`, horizontal rules between content areas
- **No dark mode**
- **No toast notifications** — inline feedback only
- **No shadows** darker than `rgba(0,0,0,0.04)` except the Clarify button
- **No rounded corners** larger than `rounded-lg` (8px)
- **Accent color only** on: Clarify All button, active states, primary action per screen
- **Header logo centered** always — use `grid grid-cols-3` with spacer + centered + right controls
- Colors live in `tailwind.config.ts`: accent = `#3B5A40` (forest green), cream/brown for base

## Layout Widths
- Dashboard / lists: `max-w-2xl mx-auto` — narrow, focused
- Note session: `max-w-5xl mx-auto` — wider workspace feel
- Note session outer padding: `px-4 md:px-6` (slightly tighter than dashboard's `px-6 md:px-8`)

## AI / Edge Function
- Located at `supabase/functions/clarify-terms/index.ts`
- Called with `{ terms: string[], notes: string, sessionId?: string }`
- Returns `Record<string, string>` — term → definition
- Never expose the Anthropic API key to the client

## Email (custom SMTP)
Configure in Supabase Dashboard → Project Settings → Authentication → SMTP.
Use Resend, Postmark, or similar. Set sender to a domain you own.

## User Preferences
- No dividers anywhere (was explicitly requested multiple times)
- Earthy palette: dark forest green accent, warm cream/brown base
- Content centered on all pages
- Logo (Clarifio) always top-center, clicking it navigates to Programs
- Language switcher (EN/PT) always on the LEFT side of the header
- Sign in / Sign out button always visible on the RIGHT side of the header (all views including NoteSession)
