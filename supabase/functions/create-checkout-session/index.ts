import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PRICES = {
  monthly: { amount: 599,  interval: 'month' as const },
  annual:  { amount: 4999, interval: 'year'  as const },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() })

  // Authenticate the caller
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } })

  const { plan = 'monthly', email } = await req.json() as { plan?: string; email?: string }
  const priceConfig = PRICES[plan as keyof typeof PRICES] ?? PRICES.monthly

  const origin = req.headers.get('origin') || 'https://clarifio.com'

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email ?? user.email ?? undefined,
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: 'Clarifio Pro', description: 'Unlimited notes, courses, and AI definitions.' },
        unit_amount: priceConfig.amount,
        recurring: { interval: priceConfig.interval },
      },
      quantity: 1,
    }],
    metadata: { user_id: user.id },
    success_url: `${origin}?checkout_success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}?checkout_cancelled=1`,
    allow_promotion_codes: true,
  })

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
