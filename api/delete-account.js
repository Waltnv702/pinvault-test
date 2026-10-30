import { requireUser, deleteUserCompletely } from './_auth.js'

// Lets a signed-in user delete their own account and data (required by the privacy policy and both app stores).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireUser(req, res, { limit: 5 })
  if (!auth) return
  try {
    // NOTE: if the user has an active Stripe subscription, cancel it here before deleting (see README).
    await deleteUserCompletely(auth.user.id)
    res.json({ ok: true })
  } catch (err) {
    console.error('delete-account error:', err)
    res.status(500).json({ error: err.message })
  }
}
