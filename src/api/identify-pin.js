export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ found: false, reason: 'Method not allowed' })
  }

  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ found: false, reason: 'No image provided' })
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ found: false, reason: 'API key not configured' })
    }

    const isUrl = image.startsWith('http')

    let mediaType = 'image/jpeg'
    if (!isUrl) {
      if (image.includes('data:image/png')) mediaType = 'image/png'
      else if (image.includes('data:image/webp')) mediaType = 'image/webp'
    }

    const imageContent = isUrl
      ? { type: 'image', source: { type: 'url', url: image } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: image.replace(/^data:image\/\w+;base64,/, '') } }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              imageContent,
              {
                type: 'text',
                text: `You are an expert on Disney pins and pin trading. Analyze this image and identify the Disney pin shown.

Respond with ONLY a valid JSON object, no markdown, no extra text:

If you can identify it:
{"found":true,"name":"Full pin name","series":"Series or collection name","description":"Detailed description including characters, design, colors, edition details"}

If you cannot identify it:
{"found":false,"reason":"Brief explanation"}`
              }
            ]
          }
        ]
      })
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      return res.status(500).json({ found: false, reason: `Claude API error: ${claudeResponse.status}` })
    }

    const claudeData = await claudeResponse.json()
    const text = claudeData.content?.[0]?.text?.trim() || ''

    let pinData
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
      pinData = JSON.parse(cleaned)
    } catch {
      pinData = { found: false, reason: 'Could not parse response' }
    }

    return res.status(200).json(pinData)

  } catch (err) {
    return res.status(500).json({ found: false, reason: err.message })
  }
}
