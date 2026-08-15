// Extract dollar amounts from eBay listing prices and compute a value estimate
function estimateValueFromListings(items) {
  const prices = items
    .map(i => parseFloat(i.price?.value))
    .filter(v => !isNaN(v) && v >= 2 && v <= 2000)

  if (prices.length === 0) return null
  prices.sort((a, b) => a - b)
  const mid = Math.floor(prices.length / 2)
  const median = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
  return {
    estimated_value: Math.round(median * 100) / 100,
    price_range: { low: prices[0], high: prices[prices.length - 1] },
    sample_size: prices.length
  }
}

// Get an OAuth token from eBay using the Client Credentials flow (no user login needed for search)
async function getEbayToken(clientId, clientSecret) {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const resp = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
  })
  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`eBay OAuth error: ${resp.status} - ${errText}`)
  }
  const data = await resp.json()
  return data.access_token
}

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
    const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID
    const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET

    if (!ANTHROPIC_API_KEY) return res.status(500).json({ found: false, reason: 'Anthropic API key not configured' })
    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) return res.status(500).json({ found: false, reason: 'eBay API not configured' })

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

Your job is to generate the best possible search query to find this exact pin on eBay — not to guess the final answer yourself.

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
  "search_query": "optimized 4-6 word eBay search query for finding this exact pin (do not include the word 'pin' more than once, keep it concise)",
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

    // --- STEP 2: Get eBay OAuth token ---
    const ebayToken = await getEbayToken(EBAY_CLIENT_ID, EBAY_CLIENT_SECRET)

    // --- STEP 3: Search eBay Browse API for matching pins ---
    const searchQuery = `Disney pin ${pinDescription.search_query}`
    const searchUrl = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search')
    searchUrl.searchParams.set('q', searchQuery)
    searchUrl.searchParams.set('category_ids', '3946') // Disneyana/Pins category
    searchUrl.searchParams.set('limit', '8')

    const ebaySearchResponse = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${ebayToken}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type': 'application/json'
      }
    })

    if (!ebaySearchResponse.ok) {
      const errText = await ebaySearchResponse.text()
      return res.status(500).json({ found: false, reason: `eBay search error: ${ebaySearchResponse.status} - ${errText}` })
    }

    const ebayData = await ebaySearchResponse.json()
    const items = ebayData.itemSummaries || []

    // --- STEP 4: Format matches for the frontend (same shape as before) ---
    const matches = items.slice(0, 8).map(item => ({
      title: item.title,
      thumbnail: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
      link: item.itemWebUrl,
      source: 'eBay',
      price: item.price?.value ? `$${item.price.value}` : null,
      condition: item.condition || null
    }))

    // --- STEP 5: Estimate value from real eBay listing prices ---
    const valueEstimate = estimateValueFromListings(items)

    const valueResults = items.slice(0, 5).map(item => ({
      title: item.title,
      snippet: item.condition ? `${item.condition} — $${item.price?.value || '?'}` : `$${item.price?.value || '?'}`,
      link: item.itemWebUrl
    }))

    // --- STEP 6: Return everything to the frontend ---
    return res.status(200).json({
      found: true,
      character: pinDescription.character,
      description: pinDescription.description,
      visual_elements: pinDescription.visual_elements,
      park_association: pinDescription.park_association,
      visible_text: pinDescription.visible_text,
      search_query: pinDescription.search_query,
      matches: matches,
      value_results: valueResults,
      value_estimate: valueEstimate
    })

  } catch (err) {
    return res.status(500).json({ found: false, reason: err.message })
  }
}
