import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  terms: string[]
  notes: string
  sessionId?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  let body: RequestBody
  try {
    body = await req.json() as RequestBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const { terms, notes } = body

  if (!terms || !Array.isArray(terms) || terms.length === 0) {
    return new Response(JSON.stringify({ error: 'terms must be a non-empty array' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const termsJson = JSON.stringify(terms)
  const notesContext = notes?.trim()
    ? `\n\nLecture notes context:\n"""\n${notes.slice(0, 4000)}\n"""`
    : ''

  const userMessage = `Please define the following terms:${notesContext}\n\nTerms to define: ${termsJson}\n\nRespond with ONLY a valid JSON object mapping each term (exactly as provided) to its definition. Example: {"Reynolds number": "A dimensionless quantity..."}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: 'You are a concise academic assistant. Define the following terms in the context of these lecture notes. Keep definitions clear, brief (2-3 sentences max), and accessible to a university student. Return a JSON object mapping each term to its definition. Respond with valid JSON only — no markdown fences, no extra text.',
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', errText)
      return new Response(JSON.stringify({ error: 'AI service error', detail: errText }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const anthropicData = await response.json() as {
      content: Array<{ type: string; text: string }>
    }

    const rawText = anthropicData.content?.[0]?.text ?? '{}'

    // Parse and validate the JSON response
    let definitions: Record<string, string>
    try {
      // Strip any accidental markdown fences
      const cleaned = rawText.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()
      definitions = JSON.parse(cleaned) as Record<string, string>
    } catch {
      console.error('Failed to parse AI response as JSON:', rawText)
      return new Response(JSON.stringify({ error: 'AI returned invalid JSON', raw: rawText }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(definitions), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
