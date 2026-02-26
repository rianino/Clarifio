-- Subscription tracking for Clarifio Pro
-- Populated by the stripe-webhook edge function (service role)

create table if not exists subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text not null default 'active',
    -- 'active' | 'canceled' | 'past_due' | 'trialing'
  plan                   text not null default 'monthly',
    -- 'monthly' | 'annual'
  current_period_end     timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- Only the authenticated user can read their own subscription.
-- All writes come from the webhook (service role key) — no client write policy needed.
alter table subscriptions enable row level security;

create policy "Users can read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function update_updated_at();
