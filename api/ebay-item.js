import { requireAdmin } from './_auth.js'
import { extractPinFields } from './_extract.js'

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
    const { EBAY_CLIENT_ID, EBAY_CLIENT_SECRET } = process.env
    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) return res.status(500).json({ error: 'eBay API not configured' })

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

    const f = await extractPinFields(listingText)

    res.json({
      fields: {
        ...f,
        estimated_value: item.price?.value ? parseFloat(item.price.value) : null,
        source_link: item.itemWebUrl || ''
      }
    })
  } catch (err) {
    console.error('ebay-item error:', err)
    res.status(500).json({ error: err.message })
  }
}
