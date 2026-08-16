export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: `Method ${req.method} not allowed` })

  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: 'No image provided' })
    if (!image.startsWith('http')) return res.status(400).json({ error: 'A public image URL is required' })

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Anthropic API key not configured' })

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: image } },
            {
              type: 'text',
              text: `This is a Disney pin product sheet. It's organized into rows/series, each with a colored banner heading, and each pin below has a text label with its name.

Read the sheet from top to bottom, and within each row read left to right. Return ONLY valid JSON, no markdown, no extra text, in this exact shape:

{
  "rows": [
    { "series": "Series 1: Ear Headbands", "names": ["Enchanted Tiki Birds", "Mad Tea Party", "..."] },
    { "series": "Series 2: ...", "names": ["...", "..."] }
  ]
}

Include every row/series section you see, and every pin name label in that row in left-to-right order. Read the text labels exactly as printed, including any "Chaser:" or "Super Chaser:" prefixes.`
            }
          ]
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      return res.status(500).json({ error: `Claude API error: ${claudeResponse.status} - ${errText}` })
    }

    const data = await claudeResponse.json()
    const text = data.content?.[0]?.text?.trim() || ''
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return res.status(200).json(parsed)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
