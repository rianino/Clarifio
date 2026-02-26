import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })
  }

  const { session_id } = await req.json() as { session_id: string }

  let stripeSession: Stripe.Checkout.Session
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(session_id)
  } catch {
    return new Response(JSON.stringify({ verified: false, error: 'Session not found' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  if (stripeSession.payment_status !== 'paid') {
    return new Response(JSON.stringify({ verified: false }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // Upsert subscription — handles the case where the webhook hasn't fired yet
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  await supabaseAdmin.from('subscriptions').upsert({
    user_id: user.id,
    stripe_customer_id: stripeSession.customer as string,
    stripe_subscription_id: stripeSession.subscription as string,
    status: 'active',
    plan: 'monthly',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return new Response(JSON.stringify({ verified: true }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
