import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function upsertSubscription(userId, stripeCustomerId, status, plan, periodEnd) {
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    status,
    plan,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  const { type, data } = event

  try {
    if (type === 'checkout.session.completed') {
      const session = data.object
      const userId = session.metadata?.userId
      if (!userId) return res.json({ received: true })
      const sub = await stripe.subscriptions.retrieve(session.subscription)
      const plan = sub.items.data[0].price.id === process.env.STRIPE_PRICE_ANNUAL ? 'annual' : 'monthly'
      await upsertSubscription(userId, session.customer, 'active', plan, sub.current_period_end)
    }

    else if (type === 'customer.subscription.updated') {
      const sub = data.object
      const userId = sub.metadata?.userId
      if (!userId) return res.json({ received: true })
      const plan = sub.items.data[0].price.id === process.env.STRIPE_PRICE_ANNUAL ? 'annual' : 'monthly'
      const status = sub.status === 'active' || sub.status === 'trialing' ? 'active' : 'inactive'
      await upsertSubscription(userId, sub.customer, status, plan, sub.current_period_end)
    }

    else if (type === 'customer.subscription.deleted') {
      const sub = data.object
      const userId = sub.metadata?.userId
      if (!userId) return res.json({ received: true })
      await upsertSubscription(userId, sub.customer, 'inactive', null, null)
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).json({ error: err.message })
  }
}
