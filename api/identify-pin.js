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
    const SERPAPI_KEY = process.env.SERPAPI_KEY

    if (!ANTHROPIC_API_KEY) return res.status(500).json({ found: false, reason: 'Anthropic API key not configured' })
    if (!SERPAPI_KEY) return res.status(500).json({ found: false, reason: 'SerpAPI key not configured' })

    // --- STEP 1: Claude vision describes the pin ---
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
              text: `You are a Disney pin trading expert. Analyze this Disney collectible pin image.

Your job is to generate the best possible search query to find this exact pin online — not to guess the final answer yourself.

Focus on:
1. Exact character name (be as specific as possible)
2. What the character is doing or wearing
3. Any visible text on the pin
4. Pin shape (round, square, character-shaped)
5. Any visible series markings, LE numbers, or edition info
6. Park association if visible (WDW, DL, EPCOT, Tokyo, Paris etc)
7. Color scheme and key visual elements
8. Any event association (holiday, anniversary, D23 etc)

Respond with ONLY a valid JSON object, no markdown, no extra text:

{
  "found": true,
  "character": "Most specific character name you can identify",
  "visual_elements": ["element1", "element2", "element3"],
  "pin_shape": "shape description",
  "visible_text": "any text you can read on the pin or null",
  "park_association": "park name or null",
  "event_association": "event name or null",
  "search_query": "optimized 5-7 word search query for finding this exact pin",
  "description": "2 sentence human readable description"
}

If image contains no pin: {"found": false, "reason": "explanation"}`
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

    let pinDescription
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
      pinDescription = JSON.parse(cleaned)
    } catch {
      return res.status(500).json({ found: false, reason: 'Could not parse Claude response' })
    }

    if (!pinDescription.found) return res.status(200).json(pinDescription)

    // --- STEP 2: SerpAPI Google Image Search for real pin matches ---
    const imageSearchQuery = `Disney pin ${pinDescription.search_query}`
    const imageSearchUrl = new URL('https://serpapi.com/search.json')
    imageSearchUrl.searchParams.set('engine', 'google_images')
    imageSearchUrl.searchParams.set('q', imageSearchQuery)
    imageSearchUrl.searchParams.set('api_key', SERPAPI_KEY)
    imageSearchUrl.searchParams.set('num', '6')

    const imageSearchResponse = await fetch(imageSearchUrl.toString())
    const imageSearchData = await imageSearchResponse.json()

    const matches = (imageSearchData.images_results || []).slice(0, 6).map(item => ({
      title: item.title,
      thumbnail: item.thumbnail,
      link: item.link,
      source: item.source
    }))

    // --- STEP 3: SerpAPI eBay sold listings search for value ---
    const valueSearchQuery = `Disney pin ${pinDescription.search_query} ebay sold`
    const valueSearchUrl = new URL('https://serpapi.com/search.json')
    valueSearchUrl.searchParams.set('engine', 'google')
    valueSearchUrl.searchParams.set('q', valueSearchQuery)
    valueSearchUrl.searchParams.set('api_key', SERPAPI_KEY)
    valueSearchUrl.searchParams.set('num', '5')

    const valueSearchResponse = await fetch(valueSearchUrl.toString())
    const valueSearchData = await valueSearchResponse.json()

    const valueResults = (valueSearchData.organic_results || []).slice(0, 5).map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    }))

    // --- STEP 4: Return everything to the frontend ---
    return res.status(200).json({
      found: true,
      character: pinDescription.character,
      description: pinDescription.description,
      visual_elements: pinDescription.visual_elements,
      park_association: pinDescription.park_association,
      visible_text: pinDescription.visible_text,
      search_query: pinDescription.search_query,
      matches: matches,
      value_results: valueResults
    })

  } catch (err) {
    return res.status(500).json({ found: false, reason: err.message })
  }
}