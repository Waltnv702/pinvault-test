import { requireAdmin } from './_auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireAdmin(req, res)
  if (!auth) return
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const r = await fetch(`${url}/rest/v1/profiles?select=id,email,display_name,is_admin,created_at&order=created_at.desc&limit=500`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  })
  if (!r.ok) return res.status(500).json({ error: await r.text() })
  res.json({ users: await r.json() })
}
