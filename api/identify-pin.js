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

    // Reverse image search requires a real public URL, not base64 —
    // the frontend now uploads to Supabase Storage first and passes that URL here
    if (!image.startsWith('http')) {
      return res.status(400).json({ found: false, reason: 'A public image URL is required for reverse image search. Base64 images are no longer supported by this endpoint.' })
    }

    const SERPAPI_KEY = process.env.SERPAPI_KEY
    const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID
    const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET

    if (!SERPAPI_KEY) return res.status(500).json({ found: false, reason: 'SerpAPI key not configured' })
    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) return res.status(500).json({ found: false, reason: 'eBay API not configured' })

    // --- STEP 1: Google Lens reverse image search ---
    // This matches the actual pixels of the photo against images across the web,
    // rather than asking an AI to guess a character name from a description.
    const lensUrl = new URL('https://serpapi.com/search.json')
    lensUrl.searchParams.set('engine', 'google_lens')
    lensUrl.searchParams.set('url', image)
    lensUrl.searchParams.set('api_key', SERPAPI_KEY)

    const lensResponse = await fetch(lensUrl.toString())
    if (!lensResponse.ok) {
      const errText = await lensResponse.text()
      return res.status(500).json({ found: false, reason: `Google Lens error: ${lensResponse.status} - ${errText}` })
    }
    const lensData = await lensResponse.json()

    // Google Lens returns "visual_matches" - real pages containing visually similar images
    const visualMatches = (lensData.visual_matches || []).slice(0, 10)

    if (visualMatches.length === 0) {
      return res.status(200).json({
        found: false,
        reason: 'No visual matches found for this photo. Try a clearer, closer photo with good lighting.'
      })
    }

    // Build our match list directly from Lens results (real photos, real titles, real links)
    // Include price when Google Lens found it on the source page (common for shopping/marketplace listings)
    const matches = visualMatches.map(m => ({
      title: m.title || '',
      thumbnail: m.thumbnail || m.image || '',
      link: m.link || '',
      source: m.source || 'Web',
      price: m.price?.extracted_value ?? (typeof m.price?.value === 'number' ? m.price.value : null)
    }))

    // Use the top match's title as our best-guess name/search anchor.
    // This is a STARTING POINT for the user to confirm, not a final answer.
    const bestGuessTitle = visualMatches[0]?.title || 'Disney pin'

    // --- STEP 2: Get eBay OAuth token ---
    const ebayToken = await getEbayToken(EBAY_CLIENT_ID, EBAY_CLIENT_SECRET)

    // --- STEP 3: Search eBay Browse API using the top visual match's title ---
    // Keep it short — eBay's search can return zero results for long, over-specific strings
    const searchQuery = `Disney pin ${bestGuessTitle}`.split(' ').slice(0, 8).join(' ')
    const searchUrl = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search')
    searchUrl.searchParams.set('q', searchQuery)
    searchUrl.searchParams.set('limit', '8')

    const ebaySearchResponse = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${ebayToken}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type': 'application/json'
      }
    })

    let ebayMatches = []
    let valueResults = []
    let valueEstimate = null

    if (ebaySearchResponse.ok) {
      const ebayData = await ebaySearchResponse.json()
      const items = ebayData.itemSummaries || []

      ebayMatches = items.slice(0, 8).map(item => ({
        title: item.title,
        thumbnail: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
        link: item.itemWebUrl,
        source: 'eBay',
        price: item.price?.value ? `$${item.price.value}` : null,
        condition: item.condition || null
      }))

      valueEstimate = estimateValueFromListings(items)
      valueResults = items.slice(0, 5).map(item => ({
        title: item.title,
        snippet: item.condition ? `${item.condition} — $${item.price?.value || '?'}` : `$${item.price?.value || '?'}`,
        link: item.itemWebUrl
      }))
    }
    // If eBay search fails for any reason, we still return the Lens matches below —
    // visual identification is more important than pricing and shouldn't block on it

    // --- STEP 4: Return everything to the frontend ---
    // "matches" = real visual matches (photos to confirm identity)
    // "ebay_matches" = real eBay listings (for pricing / buying reference)
    return res.status(200).json({
      found: true,
      character: bestGuessTitle,
      description: `Best visual match: ${bestGuessTitle}`,
      search_query: searchQuery,
      matches: matches,
      ebay_matches: ebayMatches,
      value_results: valueResults,
      value_estimate: valueEstimate
    })

  } catch (err) {
    return res.status(500).json({ found: false, reason: err.message })
  }
}
