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
  if (req.method !== 'POST') return res.status(405).json({ error: `Method ${req.method} not allowed` })

  try {
    const { query } = req.body
    if (!query || !query.trim()) return res.status(400).json({ error: 'No search query provided' })

    const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID
    const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET
    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) return res.status(500).json({ error: 'eBay API not configured' })

    const token = await getEbayToken(EBAY_CLIENT_ID, EBAY_CLIENT_SECRET)

    const searchUrl = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search')
    searchUrl.searchParams.set('q', query.trim())
    searchUrl.searchParams.set('limit', '10')

    const ebayResp = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type': 'application/json'
      }
    })

    if (!ebayResp.ok) {
      const errText = await ebayResp.text()
      return res.status(500).json({ error: `eBay search error: ${ebayResp.status} - ${errText}` })
    }

    const data = await ebayResp.json()
    const items = (data.itemSummaries || []).map(item => ({
      title: item.title,
      price: item.price?.value ? `$${item.price.value}` : null,
      condition: item.condition || null,
      link: item.itemWebUrl,
      thumbnail: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || ''
    }))

    return res.status(200).json({ results: items, total: data.total ?? items.length })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
