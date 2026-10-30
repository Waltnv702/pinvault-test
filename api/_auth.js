// Shared helpers for serverless endpoints. Files starting with "_" are not deployed as routes.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Accepts either variable name for the service key (the webhook already uses SUPABASE_SERVICE_KEY)
export const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
export const supabaseUrl = () => SUPABASE_URL

// Best-effort per-instance rate limit. For hard limits add Upstash or Vercel KV later.
const buckets = new Map()
function rateLimited(key, max, windowMs) {
  const now = Date.now()
  const entry = buckets.get(key) || { count: 0, reset: now + windowMs }
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs }
  entry.count++
  buckets.set(key, entry)
  if (buckets.size > 5000) for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k)
  return entry.count > max
}

// Verifies the Supabase access token sent as "Authorization: Bearer <jwt>".
// Returns the user object, or sends a 401/429 and returns null.
export async function requireUser(req, res, { limit = 30, windowMs = 60_000 } = {}) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) { res.status(401).json({ error: 'Please sign in.' }); return null }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { res.status(500).json({ error: 'Auth is not configured on the server.' }); return null }

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY }
  })
  if (!r.ok) { res.status(401).json({ error: 'Your session has expired. Please sign in again.' }); return null }
  const user = await r.json()
  if (!user?.id) { res.status(401).json({ error: 'Please sign in.' }); return null }

  const route = (req.url || '').split('?')[0]
  if (rateLimited(`${user.id}:${route}`, limit, windowMs)) {
    res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' }); return null
  }
  return { user, token }
}

// Same check, plus the caller must have profiles.is_admin = true (read with the service key).
export async function requireAdmin(req, res) {
  const auth = await requireUser(req, res, { limit: 20 })
  if (!auth) return null
  const key = serviceKey()
  if (!key) { res.status(500).json({ error: 'Service key not configured.' }); return null }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${auth.user.id}&select=is_admin`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  })
  const rows = r.ok ? await r.json() : []
  if (rows[0]?.is_admin !== true) { res.status(403).json({ error: 'Admins only.' }); return null }
  return auth
}

// Deletes everything belonging to one user, then the auth account itself.
export async function deleteUserCompletely(userId) {
  const key = serviceKey()
  const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const rest = (path, method = 'GET') => fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers: h })

  // 0. Cancel any active Stripe subscription so a deleted account is never billed again
  if (process.env.STRIPE_SECRET_KEY) {
    const subRes = await rest(`subscriptions?user_id=eq.${userId}&select=stripe_customer_id`)
    const customer = subRes.ok ? (await subRes.json())[0]?.stripe_customer_id : null
    if (customer) {
      const { default: Stripe } = await import('stripe')
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const subs = await stripe.subscriptions.list({ customer, status: 'active', limit: 10 })
      for (const sub of subs.data) await stripe.subscriptions.cancel(sub.id)
    }
  }

  // 1. Storage: everything under pin-images/<userId>/
  const list = await fetch(`${SUPABASE_URL}/storage/v1/object/list/pin-images`, {
    method: 'POST', headers: h, body: JSON.stringify({ prefix: userId, limit: 1000 })
  })
  if (list.ok) {
    const files = await list.json()
    if (files.length) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/pin-images`, {
        method: 'DELETE', headers: h, body: JSON.stringify({ prefixes: files.map(f => `${userId}/${f.name}`) })
      })
    }
  }

  // 2. Rows (pin_books first via the user's books/pins, then the rest)
  const pinsRes = await rest(`pins?user_id=eq.${userId}&select=id`)
  const pinIds = pinsRes.ok ? (await pinsRes.json()).map(p => p.id) : []
  if (pinIds.length) await rest(`pin_books?pin_id=in.(${pinIds.join(',')})`, 'DELETE')
  for (const table of ['pins', 'books', 'mystery_boxes', 'checklist_progress', 'subscriptions']) {
    await rest(`${table}?user_id=eq.${userId}`, 'DELETE')
  }
  await rest(`profiles?id=eq.${userId}`, 'DELETE')

  // 3. The auth user
  const del = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: h })
  if (!del.ok) throw new Error(`Could not delete auth user: ${del.status} ${await del.text()}`)
}
