export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: 'No image provided' })

    const base64 = image.replace(/^data:image\/\w+;base64,/, '')
    const mediaType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: `You are a Disney pin expert. Examine this image and identify ALL Disney collectible pins you can see.

For each pin you can identify, provide:
- name: the specific pin name or best description
- series: the collection or series it belongs to (if known)
- description: brief description of what's depicted (characters, theme, etc.)

Return ONLY a valid JSON object in this exact format, no other text:
{
  "pins": [
    {
      "name": "Pin name here",
      "series": "Series name or empty string",
      "description": "Description here"
    }
  ],
  "count": 3,
  "notes": "Any relevant notes about image quality or partial identifications"
}

If you cannot identify any pins at all, return:
{"pins": [], "count": 0, "notes": "Reason why"}`
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
      const clean = text.replace(/```json|```/g, '').trim()
      result = JSON.parse(clean)
    } catch(e) {
      return res.json({ pins: [], count: 0, notes: 'Could not parse pin data from image' })
    }

    res.json(result)
  } catch(err) {
    console.error('Multi-pin identify error:', err)
    res.status(500).json({ error: err.message })
  }
}
