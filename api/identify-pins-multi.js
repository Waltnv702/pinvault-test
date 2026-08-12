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
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: `You are a world-class Disney pin trading expert with deep knowledge of Disney collectible pins from all eras and parks worldwide (Walt Disney World, Disneyland, Tokyo Disney, Paris, Hong Kong, Shanghai).

Carefully examine this image and identify EVERY Disney collectible pin you can see. Scan the entire image systematically — look at every pin, even partially visible ones at the edges.

Disney pins typically feature:
- Disney characters (Mickey, Minnie, princesses, villains, Pixar characters, Star Wars, Marvel, etc.)
- Park attractions, landmarks, or logos
- Limited edition markings (LE with edition size)
- Hidden Mickey designs
- Annual Passholder exclusives
- Park-specific series (WDW, DL, EPCOT, Hollywood Studios, Animal Kingdom, etc.)
- Special events (holidays, anniversaries, runDisney, D23, food & wine festivals)
- Artist series or designer collaborations

IMPORTANT RULES:
- Identify EVERY pin visible, even if only partially visible
- Always provide your BEST GUESS — a partial identification is better than skipping a pin
- Be specific about characters, colors, and design elements you can see
- Note if a pin appears to be Limited Edition (LE) if you can see edition markings
- If you can see text on the pin, include it in the name or description

Return ONLY a valid JSON object in this exact format, no other text:
{
  "pins": [
    {
      "name": "Specific pin name or best character/theme description",
      "series": "Series, collection, park name, or event — empty string if unknown",
      "description": "Detailed description: characters shown, colors, design elements, any visible text or edition info"
    }
  ],
  "count": 5,
  "notes": "Any notes about image quality, lighting, or partially obscured pins"
}

If no pins are visible at all:
{"pins": [], "count": 0, "notes": "Explanation of why no pins could be identified"}`
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
