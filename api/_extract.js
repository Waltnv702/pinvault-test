// Shared by the admin "Fill form" tools: turns listing text into pin database fields using only what the text says.
const MODEL = 'claude-sonnet-4-6' // same model ID used by the other endpoints

export async function extractPinFields(listingText) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Anthropic API key not configured')
  const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      messages: [{ role: 'user', content: `You help build a database of Disney collectible pins. Below is the text of one web or eBay listing. Extract details about the PIN ITSELF using only what the text states. Do not guess or fill gaps from memory. Use an empty string (or null for the year) when the text does not say.

Fields:
- name: the pin's name (characters and design), without seller wording such as NEW, RARE, FAST SHIPPING, Disney Pin, or the edition size.
- series: the set, collection, wave or event the pin belongs to, if stated.
- park: the park or resort (for example WDW, Disneyland, DLP, Shanghai), only if stated.
- release_year: the year the pin was released, as a number, only if stated.
- edition_size: for example "LE 4000", "LE 250", "Open Edition", only if stated.
- description: one or two sentences about the pin's design and features taken from the text. No price, shipping, condition or seller language. Empty if the text only has a title.

Return ONLY valid JSON: {"name":"","series":"","park":"","release_year":null,"edition_size":"","description":""}

LISTING:
${listingText}` }]
    })
  })
  if (!aiResp.ok) throw new Error(`AI error: ${aiResp.status}`)
  const aiData = await aiResp.json()
  const raw = (aiData.content?.[0]?.text || '').replace(/```json|```/g, '').trim()
  let f
  try { f = JSON.parse(raw) } catch { throw new Error('Could not read the listing details.') }
  const year = parseInt(f.release_year)
  return {
    name: (f.name || '').trim(), series: (f.series || '').trim(), park: (f.park || '').trim(),
    release_year: year >= 1955 && year <= 2100 ? year : null,
    edition_size: (f.edition_size || '').trim(), description: (f.description || '').trim()
  }
}
