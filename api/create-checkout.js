import Stripe from 'stripe'
import { requireUser } from './_auth.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual:  process.env.STRIPE_PRICE_ANNUAL,
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // The user comes from the verified login token, never from the request body
  const auth = await requireUser(req, res, { limit: 10 })
  if (!auth) return
  const { id: userId, email } = auth.user

  try {
    const { plan } = req.body || {}
    const priceId = PRICES[plan]
    if (!priceId) return res.status(400).json({ error: 'Invalid plan' })

    // Optional: set SITE_URL in Vercel (e.g. https://castlepins.com) to pin the redirect address
    const base = process.env.SITE_URL || req.headers.origin

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/?checkout=success`,
      cancel_url:  `${base}/?checkout=cancel`,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    res.status(500).json({ error: err.message })
  }
}
