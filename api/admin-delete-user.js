import { requireAdmin, deleteUserCompletely } from './_auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireAdmin(req, res)
  if (!auth) return
  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'userId is required' })
  if (userId === auth.user.id) return res.status(400).json({ error: 'Use Delete my account to remove your own account.' })

  try {
    await deleteUserCompletely(userId)
    res.json({ ok: true })
  } catch (err) {
    console.error('admin-delete-user error:', err)
    res.status(500).json({ error: err.message })
  }
}
