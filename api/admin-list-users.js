import { requireAdmin, serviceKey, supabaseUrl } from './_auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireAdmin(req, res)
  if (!auth) return
  const url = supabaseUrl()
  const key = serviceKey()
  const h = { apikey: key, Authorization: `Bearer ${key}` }

  try {
    // Source of truth for accounts: the auth users list (always has email + sign-up date)
    const users = []
    for (let page = 1; page <= 10; page++) {
      const r = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: h })
      if (!r.ok) return res.status(500).json({ error: await r.text() })
      const batch = (await r.json()).users || []
      users.push(...batch)
      if (batch.length < 200) break
    }

    // Profile details (admin flag, display name) are optional extras
    const pr = await fetch(`${url}/rest/v1/profiles?select=id,display_name,first_name,last_name,is_admin`, { headers: h })
    const profiles = pr.ok ? await pr.json() : []
    const byId = Object.fromEntries(profiles.map(p => [p.id, p]))

    const out = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      display_name: [byId[u.id]?.first_name || u.user_metadata?.first_name, byId[u.id]?.last_name || u.user_metadata?.last_name].filter(Boolean).join(' ') || byId[u.id]?.display_name || null,
      is_admin: byId[u.id]?.is_admin === true,
    })).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

    res.json({ users: out })
  } catch (err) {
    console.error('admin-list-users error:', err)
    res.status(500).json({ error: err.message })
  }
}
