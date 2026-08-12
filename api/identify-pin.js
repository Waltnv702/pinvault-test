export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ found: false, reason: `Method ${req.method} not allowed` })

  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ found: false, reason: 'No image provided' })

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) return res.status(500).json({ found: false, reason: 'API key not configured on server' })

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
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            imageContent,
            {
              type: 'text',
              text: `You are a world-class Disney pin trading expert with deep knowledge of Disney collectible pins from all eras and parks worldwide (Walt Disney World, Disneyland, Tokyo Disney, Paris, Hong Kong, Shanghai).

Analyze this image of a Disney collectible pin and identify it as specifically as possible.

Disney pins typically feature:
- Disney characters (Mickey, Minnie, princesses, villains, Pixar characters, Star Wars, Marvel, etc.)
- Park attractions, landmarks, or logos
- Limited edition markings (LE with edition size)
- Hidden Mickey designs
- Annual Passholder exclusives
- Park-specific series (WDW, DL, EPCOT, etc.)
- Special events (holidays, anniversaries, runDisney, D23)
- Artist series or designer collaborations

IMPORTANT: Always provide your BEST GUESS even if not 100% certain. It is better to give a partial identification than to say you cannot identify it. Only return found:false if the image contains no pin at all or is completely unrecognizable.

Respond with ONLY a valid JSON object, no markdown, no extra text:

If you can identify or partially identify it:
{"found":true,"name":"Full pin name or best description","series":"Series, collection, or park name","description":"Detailed description: characters shown, design elements, colors, any visible edition info, park or event association, approximate era if known"}

If the image contains no pin or is completely unrecognizable:
{"found":false,"reason":"Brief explanation"}`
            }
          ]
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      return res.status(500).json({ found: false, reason: `Claude API error: ${claudeResponse.status} - ${errText}` })
    }

    const claudeData = await claudeResponse.json()
    const text = claudeData.content?.[0]?.text?.trim() || ''

    let pinData
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
      pinData = JSON.parse(cleaned)
    } catch {
      pinData = { found: false, reason: 'Could not parse AI response' }
    }

    return res.status(200).json(pinData)

  } catch (err) {
    return res.status(500).json({ found: false, reason: err.message })
  }
}
