import Stripe from 'stripe'
import { requireUser, serviceKey, supabaseUrl } from './_auth.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = await requireUser(req, res, { limit: 10 })
  if (!auth) return

  try {
    // The Stripe customer is looked up from the signed-in user's own subscription row,
    // never taken from the request body.
    const key = serviceKey()
    const r = await fetch(`${supabaseUrl()}/rest/v1/subscriptions?user_id=eq.${auth.user.id}&select=stripe_customer_id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    })
    const rows = r.ok ? await r.json() : []
    const customerId = rows[0]?.stripe_customer_id
    if (!customerId) return res.status(404).json({ error: 'No subscription found for this account.' })

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.SITE_URL || req.headers.origin,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Portal error:', err)
    res.status(500).json({ error: err.message })
  }
}
