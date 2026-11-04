import { requireAdmin } from './_auth.js'

const MODEL = 'claude-sonnet-4-6' // same model ID used by the other endpoints

async function getEbayToken(clientId, clientSecret) {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const resp = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basicAuth}` },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
  })
  if (!resp.ok) throw new Error(`eBay OAuth error: ${resp.status}`)
  return (await resp.json()).access_token
}

function htmlToText(html) {
  return (html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim()
}

// Reads one eBay listing (title, item specifics, description) and extracts pin database fields from the TEXT only.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireAdmin(req, res)
  if (!auth) return

  try {
    const { itemId } = req.body || {}
    if (!itemId) return res.status(400).json({ error: 'No listing selected' })
    const { EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, ANTHROPIC_API_KEY } = process.env
    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) return res.status(500).json({ error: 'eBay API not configured' })
    if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Anthropic API key not configured' })

    const token = await getEbayToken(EBAY_CLIENT_ID, EBAY_CLIENT_SECRET)
    const itemResp = await fetch(`https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(itemId)}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' }
    })
    if (!itemResp.ok) return res.status(500).json({ error: `eBay item error: ${itemResp.status}` })
    const item = await itemResp.json()

    const specifics = (item.localizedAspects || []).map(a => `${a.name}: ${a.value}`).join('\n')
    const listingText = [
      `TITLE: ${item.title || ''}`,
      specifics && `ITEM SPECIFICS:\n${specifics}`,
      `DESCRIPTION:\n${htmlToText(item.shortDescription || '') || ''}\n${htmlToText(item.description || '').slice(0, 3500)}`
    ].filter(Boolean).join('\n\n')

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        messages: [{ role: 'user', content: `You help build a database of Disney collectible pins. Below is the text of one eBay listing. Extract details about the PIN ITSELF using only what the text states. Do not guess or fill gaps from memory. Use an empty string (or null for the year) when the text does not say.

Fields:
- name: the pin's name (characters and design), without seller wording such as NEW, RARE, FAST SHIPPING, Disney Pin, or the edition size.
- series: the set, collection, wave or event the pin belongs to, if stated.
- park: the park or resort (for example WDW, Disneyland, DLP, Shanghai), only if stated.
- release_year: the year the pin was released, as a number, only if stated.
- edition_size: for example "LE 4000", "LE 250", "Open Edition", only if stated.
- description: one or two sentences about the pin's design and features taken from the text. No price, shipping, condition or seller language.

Return ONLY valid JSON: {"name":"","series":"","park":"","release_year":null,"edition_size":"","description":""}

LISTING:
${listingText}` }]
      })
    })
    if (!aiResp.ok) return res.status(500).json({ error: `AI error: ${aiResp.status}` })
    const aiData = await aiResp.json()
    const raw = (aiData.content?.[0]?.text || '').replace(/```json|```/g, '').trim()
    let f
    try { f = JSON.parse(raw) } catch { return res.status(500).json({ error: 'Could not read the listing details.' }) }

    const year = parseInt(f.release_year)
    res.json({
      fields: {
        name: (f.name || '').trim(), series: (f.series || '').trim(), park: (f.park || '').trim(),
        release_year: year >= 1955 && year <= 2100 ? year : null,
        edition_size: (f.edition_size || '').trim(), description: (f.description || '').trim(),
        estimated_value: item.price?.value ? parseFloat(item.price.value) : null,
        source_link: item.itemWebUrl || ''
      }
    })
  } catch (err) {
    console.error('ebay-item error:', err)
    res.status(500).json({ error: err.message })
  }
}
