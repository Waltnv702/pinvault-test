import { requireAdmin } from './_auth.js'
import { extractPinFields } from './_extract.js'

// Admin tool: fill pin database fields from a photo-search result's title text.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireAdmin(req, res)
  if (!auth) return
  try {
    const { title, source, snippet } = req.body || {}
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'No title provided' })
    const text = [`TITLE: ${String(title).slice(0, 300)}`, source && `SOURCE SITE: ${String(source).slice(0, 80)}`, snippet && `SNIPPET: ${String(snippet).slice(0, 500)}`].filter(Boolean).join('\n')
    res.json({ fields: await extractPinFields(text) })
  } catch (err) {
    console.error('pin-from-text error:', err)
    res.status(500).json({ error: err.message })
  }
}
