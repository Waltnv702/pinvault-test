import { requireUser } from './_auth.js'
// Multi-pin scan: one photo in, a list of described pins out.
// The prompt asks the model to DESCRIBE what is visible rather than recall pin names,
// which cuts down on invented titles and edition details.
const MODEL = 'claude-sonnet-4-6' // same model ID as detect-pin-names.js; change here to upgrade

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireUser(req, res)
  if (!auth) return

  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: 'No image provided' })

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Anthropic API key not configured' })

    const base64 = image.replace(/^data:image\/\w+;base64,/, '')
    const mediaType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            {
              type: 'text',
              text: `You are a Disney pin trading assistant helping a collector catalog their pins.

Look at this image and find EVERY collectible pin you can see, including partially visible ones at the edges. For each pin, describe exactly what is visible. Do NOT invent or guess specific pin names, series names, or edition details that you cannot clearly read in the image.

RULES:
- Only include information you can actually see.
- If you can read text on a pin, include it exactly as written.
- Name characters you can recognize (Mickey Mouse, Stitch, Cinderella, etc.) and attractions or landmarks you can recognize.
- Do NOT make up edition sizes, series names, or release years unless they are printed on the pin.
- "name": a short descriptive name from what is shown, e.g. "Mickey Mouse in sorcerer hat" or "Haunted Mansion hitchhiking ghosts".
- "series": only if a series name is readable on the pin, otherwise an empty string.
- "description": colors, shapes, any visible text, and what makes the pin distinctive.

Return ONLY valid JSON, no markdown and no other text:
{
  "pins": [
    { "name": "...", "series": "", "description": "..." }
  ],
  "count": 3,
  "notes": "Anything about image quality or pins that were hard to see"
}

If no pins are visible: {"pins": [], "count": 0, "notes": "Why no pins could be found"}`
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    let result
    try {
      result = JSON.parse(text.replace(/```json|```/g, '').trim())
    } catch (e) {
      return res.json({ pins: [], count: 0, notes: 'Could not read the scan results. Try again with a clearer photo.' })
    }
    if (!Array.isArray(result.pins)) result = { pins: [], count: 0, notes: 'No pins found in the response.' }

    res.json(result)
  } catch (err) {
    console.error('Multi-pin identify error:', err)
    res.status(500).json({ error: err.message })
  }
}
