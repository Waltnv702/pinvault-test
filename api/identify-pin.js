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
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
    const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID

    if (!ANTHROPIC_API_KEY) return res.status(500).json({ found: false, reason: 'Anthropic API key not configured' })
    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) return res.status(500).json({ found: false, reason: 'Google API not configured' })

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

Your job is NOT to guess the pin name — instead generate the best possible search query to find this pin on Google.

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
  "ebay_search_query": "optimized 4-6 word search query for finding this pin",
  "google_search_query": "Disney pin [character] [series hints] [park] site:pinpics.com OR site:ebay.com",
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

    // --- STEP 2: Google Custom Search for real pin matches ---
    const searchQuery = `Disney pin ${pinDescription.google_search_query || pinDescription.ebay_search_query}`
    
    const googleUrl = new URL('https://www.googleapis.com/customsearch/v1')
    googleUrl.searchParams.set('key', GOOGLE_API_KEY)
    googleUrl.searchParams.set('cx', GOOGLE_SEARCH_ENGINE_ID)
    googleUrl.searchParams.set('q', searchQuery)
    googleUrl.searchParams.set('num', '5')
    googleUrl.searchParams.set('searchType', 'image')

    const googleResponse = await fetch(googleUrl.toString())
    const googleData = await googleResponse.json()

    const matches = (googleData.items || []).map(item => ({
      title: item.title,
      link: item.image?.contextLink || item.link,
      thumbnail: item.link,
      snippet: item.snippet || ''
    }))

    // --- STEP 3: Also search for value on eBay sold listings via Google ---
    const valueQuery = `Disney pin ${pinDescription.ebay_search_query} sold site:ebay.com`
    const valueUrl = new URL('https://www.googleapis.com/customsearch/v1')
    valueUrl.searchParams.set('key', GOOGLE_API_KEY)
    valueUrl.searchParams.set('cx', GOOGLE_SEARCH_ENGINE_ID)
    valueUrl.searchParams.set('q', valueQuery)
    valueUrl.searchParams.set('num', '3')

    const valueResponse = await fetch(valueUrl.toString())
    const valueData = await valueResponse.json()

    const valueResults = (valueData.items || []).map(item => ({
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
      ebay_search_query: pinDescription.ebay_search_query,
      google_search_query: searchQuery,
      matches: matches,
      value_results: valueResults
    })

  } catch (err) {
    return res.status(500).json({ found: false, reason: err.message })
  }
}