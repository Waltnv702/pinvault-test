import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// Headers for our /api endpoints: includes the signed-in user's token so the server can verify who is calling
async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

const COLORS = ['#7c3aed','#db2777','#0891b2','#d97706','#059669','#be185d']
function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
  return Math.abs(h)
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0a1e; font-family: Georgia, serif; color: #f1f5f9; }
  input, textarea, button { font-family: Georgia, serif; }
  input::placeholder, textarea::placeholder { color: #4a5568; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 2px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
  .fade-up { animation: fadeUp 0.35s ease both; }

  .main-content {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px 14px 90px 14px;
  }
  @media (min-width: 768px) {
    .main-content { padding: 28px 24px 40px 24px; }
  }

  /* Top nav desktop */
  .top-nav { display: none; }
  @media (min-width: 768px) {
    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 28px;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      position: sticky; top: 0; z-index: 100;
    }
  }

  /* Mobile header */
  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    position: sticky; top: 0; z-index: 100;
  }
  @media (min-width: 768px) { .mobile-header { display: none; } }

  /* Bottom nav mobile */
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: rgba(13,9,26,0.98);
    border-top: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 200;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  @media (min-width: 768px) { .bottom-nav { display: none; } }

  .nav-tab-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px 4px 8px;
    border: none;
    background: transparent;
    color: #4a5568;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3px;
    transition: color 0.2s;
    gap: 3px;
    min-height: 58px;
    position: relative;
  }
  .nav-tab-btn.active { color: #a78bfa; }
  .more-backdrop { position: fixed; inset: 0; z-index: 140; background: rgba(0,0,0,0.5); }
  .more-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 150; background: #1a1040; border-top: 1px solid rgba(124,58,237,0.4); border-radius: 18px 18px 0 0; padding: 14px 14px calc(80px + env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .more-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 6px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #cbd5e1; font-size: 12px; font-weight: bold; cursor: pointer; }
  .more-item.active { border-color: rgba(124,58,237,0.6); color: #e2d9f3; background: rgba(124,58,237,0.2); }
  .nav-tab-btn .nav-icon { font-size: 21px; line-height: 1; }

  /* Pin grid */
  .pin-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (min-width: 600px) { .pin-grid { gap: 14px; } }
  @media (min-width: 768px) { .pin-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
  @media (min-width: 1024px) { .pin-grid { grid-template-columns: repeat(4, 1fr); gap: 18px; } }

  .card-img { width: 100%; height: 130px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  @media (min-width: 768px) { .card-img { height: 160px; } }

  /* Inputs */
  .field-input {
    width: 100%;
    padding: 13px 14px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 11px;
    color: #f1f5f9;
    font-size: 16px;
    margin-bottom: 14px;
    outline: none;
    display: block;
    -webkit-appearance: none;
  }
  @media (min-width: 768px) { .field-input { font-size: 14px; padding: 11px 14px; } }

  .search-bar {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 12px;
    color: #f1f5f9;
    font-size: 16px;
    margin-bottom: 16px;
    outline: none;
    display: block;
    -webkit-appearance: none;
  }
  @media (min-width: 768px) { .search-bar { max-width: 380px; font-size: 14px; } }

  .page-title { font-size: 20px; font-weight: bold; color: #f9fafb; margin-bottom: 6px; letter-spacing: 1px; }
  @media (min-width: 768px) { .page-title { font-size: 24px; } }

  .card-name { font-size: 12px; font-weight: bold; color: #f1f5f9; margin-bottom: 2px; line-height: 1.3; }
  .card-series { font-size: 10px; color: #a78bfa; margin-bottom: 4px; font-weight: 600; }
  .card-desc { font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 8px; }
  @media (min-width: 768px) {
    .card-name { font-size: 14px; }
    .card-series { font-size: 11px; }
    .card-desc { font-size: 12px; min-height: 32px; }
  }

  .primary-btn {
    width: 100%; padding: 15px; border: none; border-radius: 13px;
    color: #fff; font-size: 16px; font-weight: bold; cursor: pointer;
    transition: opacity 0.2s, transform 0.1s; letter-spacing: 0.3px;
  }
  .primary-btn:active { opacity: 0.85; transform: scale(0.99); }

  .auth-card {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px;
    width: 100%; max-width: 420px;
    text-align: center;
    box-shadow: 0 25px 60px rgba(0,0,0,0.6);
    padding: 32px 22px;
  }
  @media (min-width: 480px) { .auth-card { padding: 44px 36px; } }
`

// ── Auth ──────────────────────────────────────────────────────────────────────
// ── Reset Password Screen ─────────────────────────────────────────────────────
// Master switch for the trading feature. Flip to true to bring trading back.
const TRADING_ENABLED = false

function ResetPasswordScreen({ onDone }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (pw.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (pw !== pw2) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) throw error
      setMsg('✅ Password updated! Signing you in...')
      setTimeout(onDone, 1500)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f0a1e,#1e1040,#0f172a)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="fade-up" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:'44px 36px', width:'100%', maxWidth:420, textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize:60, marginBottom:8 }}>🔑</div>
        <div style={{ fontSize:26, color:'#f9fafb', marginBottom:8, fontWeight:'bold' }}>Set New Password</div>
        <div style={{ color:'#a78bfa', fontSize:13, marginBottom:28 }}>Choose a new password for your CastlePins account ✨</div>
        <input className="field-input" type="password" placeholder="New password (min 6 chars)" value={pw} onChange={e => { setPw(e.target.value); setError('') }} />
        <input className="field-input" type="password" placeholder="Confirm new password" value={pw2} onChange={e => { setPw2(e.target.value); setError('') }} onKeyDown={e => e.key==='Enter' && submit()} />
        {error && <div style={{ color:'#f87171', fontSize:13, marginBottom:10, textAlign:'left' }}>⚠️ {error}</div>}
        {msg && <div style={{ color:'#34d399', fontSize:13, marginBottom:10, textAlign:'left' }}>{msg}</div>}
        <button className="primary-btn" onClick={submit} disabled={loading}
          style={{ background:loading?'rgba(124,58,237,0.4)':'linear-gradient(135deg,#7c3aed,#db2777)', marginTop:6, fontSize:15 }}>
          {loading ? '⏳ Updating...' : '🔑 Update Password'}
        </button>
      </div>
    </div>
  )
}

// ── Legal Page ────────────────────────────────────────────────────────────────
function LegalPage({ page, onBack }) {
  const isTerms = page === 'terms'
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f0a1e,#1e1040,#0f172a)', padding:'20px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, paddingTop:8 }}>
          <button onClick={onBack}
            style={{ background:'none', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:20, padding:0, flexShrink:0 }}>←</button>
          <div>
            <div style={{ fontSize:20, fontWeight:'bold', color:'#f9fafb' }}>
              {isTerms ? '📋 Terms of Service' : '🔒 Privacy Policy'}
            </div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>CastlePins — Last updated: [INSERT DATE]</div>
          </div>
        </div>

        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, padding:'28px 24px' }}>

          {isTerms ? (
            <>
              <Section title="1. Acceptance of Terms">
                By creating an account or using CastlePins, you agree to be bound by these Terms of Service. If you do not agree, please do not use the App. We reserve the right to update these Terms at any time. Continued use after changes constitutes acceptance.
              </Section>
              <Section title="2. About CastlePins">
                CastlePins is an application for cataloging, organizing, and trading physical Disney-themed collectible pins. CastlePins is not affiliated with, endorsed by, or sponsored by The Walt Disney Company or any of its subsidiaries. All Disney-related trademarks remain the property of their respective owners.
              </Section>
              <Section title="3. Eligibility">
                You must be at least 13 years of age to use CastlePins. By using the App, you represent that all information you provide is accurate and that you have the legal capacity to enter into these Terms.
              </Section>
              <Section title="4. Accounts">
                You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at support@castlepins.com of any unauthorized use.
              </Section>
              <Section title="5. Subscriptions and Payments">
                CastlePins offers a free tier and a paid Castle Pass subscription ($4.99/month or $44.99/year). Subscriptions renew automatically and may be cancelled at any time. Payments are processed by Stripe, Inc. All fees are non-refundable except as required by law.
              </Section>
              <Section title={TRADING_ENABLED ? "6. Pin Trading" : "6. Community Features"}>
                {!TRADING_ENABLED ? "CastlePins may introduce community features in the future. Any such features will be subject to additional terms, which you will be asked to accept before using them." : "Trading features are available to Castle Pass subscribers who opt in. By opting in, you consent to your email address being shared with trade partners to facilitate trades. CastlePins is not a party to any trade and is not responsible for the condition, authenticity, delivery, or completion of traded items. You are solely responsible for any trade you enter into."}
              </Section>
              <Section title="7. User Content">
                You retain ownership of content you upload. By uploading, you grant CastlePins a license to display and store your content to operate the App. You agree not to upload unlawful, offensive, or infringing content.
              </Section>
              <Section title="8. AI Pin Identification">
                The AI identifier is provided "as is" and may be inaccurate. CastlePins is not liable for decisions made based on AI-generated pin information.
              </Section>
              <Section title="9. Limitation of Liability">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CASTLEPINS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE THREE MONTHS PRECEDING ANY CLAIM.
              </Section>
              <Section title="10. Governing Law">
                These Terms are governed by the laws of the State of Nevada. Disputes shall be subject to the jurisdiction of courts in Clark County, Nevada.
              </Section>
              <Section title="11. Contact">
                For questions about these Terms: support@castlepins.com
              </Section>
            </>
          ) : (
            <>
              <Section title="1. Information We Collect">
                We collect your name, email address, password (stored securely as a hash), a record of when you accepted these terms, and pin collection data including photos you upload. Payment details are handled by Stripe and never stored by CastlePins.
              </Section>
              <Section title="2. How We Use Your Information">
                We use your information to provide and improve the App, process payments, send transactional emails (such as password resets), {TRADING_ENABLED ? 'facilitate pin trading, ' : ''}and respond to support requests.
              </Section>
              <Section title={TRADING_ENABLED ? "3. Pin Trading and Email Sharing" : "3. Your Email Address"}>
                {!TRADING_ENABLED ? "Your email address is used only for your account, billing, and service messages. We do not display your email address to other users." : "If you enable pin trading, your email address may be shared with users who initiate or receive trade requests with you. This is limited to trade partners and used solely to facilitate trades. You may disable trading at any time in your Profile settings."}
              </Section>
              <Section title="4. Information We Share">
                We do not sell your personal information. We share data only with Stripe (payments), Supabase (database), Vercel (hosting), and Anthropic (AI identification) — all governed by their own privacy policies.{TRADING_ENABLED ? ' We also share limited information with trade partners as described above.' : ''}
              </Section>
              <Section title="5. Data Security">
                Your data is stored securely using industry-standard encryption. While we take reasonable precautions, no internet transmission is 100% secure.
              </Section>
              <Section title="6. Your Rights">
                You may access, update, or delete your account data at any time. To request account deletion, contact support@castlepins.com. We will process requests within 30 days.
              </Section>
              <Section title="7. Children's Privacy">
                CastlePins is not directed to children under 13. We do not knowingly collect information from children under 13.
              </Section>
              <Section title="8. Changes to This Policy">
                We may update this Privacy Policy and will notify you of significant changes within the App.
              </Section>
              <Section title="9. Contact">
                For privacy questions: support@castlepins.com
              </Section>
            </>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:20, marginBottom:40, color:'#475569', fontSize:11 }}>
          CastlePins — Not affiliated with The Walt Disney Company
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:14, fontWeight:'bold', color:'#a78bfa', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.7 }}>{children}</div>
    </div>
  )
}

function AuthScreen({ onLogin, onLegal }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [agree, setAgree] = useState(false)
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return }
    if (mode === 'forgot') {
      setLoading(true); setError('')
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/?reset=true'
        })
        if (error) throw error
        setMsg('✅ Password reset email sent! Check your inbox and follow the link.')
      } catch(e) { setError(e.message) }
      setLoading(false)
      return
    }
    if (pw.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (mode === 'register') {
      if (!firstName.trim() || !lastName.trim()) { setError('Please enter your first and last name.'); return }
      if (!agree) { setError('Please agree to the Terms of Service and Privacy Policy to continue.'); return }
    }
    setLoading(true); setError('')
    try {
      if (mode === 'register') {
        const fn = firstName.trim(), ln = lastName.trim()
        const { data, error } = await supabase.auth.signUp({
          email, password: pw,
          options: { data: { first_name: fn, last_name: ln, display_name: `${fn} ${ln[0].toUpperCase()}.`, terms_accepted_at: new Date().toISOString() } }
        })
        if (error) throw error
        // Supabase returns no error for an existing email; the user object comes back with no identities
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setError('An account with this email already exists. Please sign in, or use "Forgot your password?" to reset it.')
          setMode('login')
          setLoading(false)
          return
        }
        setMsg('✅ Account created! Check your email to confirm, then sign in.')
        setMode('login')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw })
        if (error) throw error
        onLogin(data.user)
      }
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f0a1e,#1e1040,#0f172a)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="fade-up" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:'44px 36px', width:'100%', maxWidth:420, textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize:60, marginBottom:8 }}>🏰</div>
        <div style={{ fontSize:32, color:'#f9fafb', letterSpacing:3, marginBottom:4, fontWeight:'bold' }}>CastlePins</div>
        <div style={{ color:'#a78bfa', fontSize:13, marginBottom:28 }}>Your Disney Pin Collection ✨</div>

        {mode !== 'forgot' && (
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setMsg('') }}
                style={{ flex:1, padding:'11px 0', border:`1px solid ${mode===m?'#7c3aed':'rgba(255,255,255,0.1)'}`, borderRadius:10, background:mode===m?'rgba(124,58,237,0.35)':'transparent', color:mode===m?'#e2d9f3':'#94a3b8', cursor:'pointer', fontSize:14, fontWeight:600 }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>
        )}

        {mode === 'forgot' && (
          <div style={{ color:'#a78bfa', fontSize:14, marginBottom:20 }}>
            Enter your email and we'll send you a reset link 💌
          </div>
        )}

        {mode === 'register' && (
          <div style={{ display:'flex', gap:8 }}>
            <input className="field-input" placeholder="First name" autoComplete="given-name" value={firstName} onChange={e => { setFirstName(e.target.value); setError('') }} />
            <input className="field-input" placeholder="Last name" autoComplete="family-name" value={lastName} onChange={e => { setLastName(e.target.value); setError('') }} />
          </div>
        )}
        <input className="field-input" type="email" placeholder="Email address" value={email} onChange={e => { setEmail(e.target.value); setError('') }} />

        {mode !== 'forgot' && (
          <input className="field-input" type="password" placeholder="Password (min 6 chars)" value={pw} onChange={e => { setPw(e.target.value); setError('') }} onKeyDown={e => e.key==='Enter' && submit()} />
        )}

        {error && <div style={{ color:'#f87171', fontSize:13, marginBottom:10, textAlign:'left' }}>⚠️ {error}</div>}
        {msg && <div style={{ color:'#34d399', fontSize:13, marginBottom:10, textAlign:'left', lineHeight:1.5 }}>{msg}</div>}

        <button className="primary-btn" onClick={submit} disabled={loading}
          style={{ background:loading?'rgba(124,58,237,0.4)':'linear-gradient(135deg,#7c3aed,#db2777)', marginTop:6, fontSize:15, letterSpacing:1 }}>
          {loading ? '⏳ Please wait...' : mode==='login' ? '✨ Enter the Magic' : mode==='register' ? '🏰 Start My Collection' : '📧 Send Reset Link'}
        </button>

        {mode === 'login' && (
          <button onClick={() => { setMode('forgot'); setError(''); setMsg('') }}
            style={{ background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:13, marginTop:14, textDecoration:'underline' }}>
            Forgot your password?
          </button>
        )}
        {mode === 'register' && (
          <label style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:11, color:'#94a3b8', marginTop:14, lineHeight:1.6, textAlign:'left', cursor:'pointer' }}>
            <input type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); setError('') }} style={{ marginTop:3, flexShrink:0 }} />
            <span>I am at least 13 years old and agree to the{' '}
            <button type="button" onClick={e => { e.preventDefault(); onLegal('terms') }} style={{ background:'none', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:11, padding:0, textDecoration:'underline' }}>Terms of Service</button>
            {' '}and{' '}
            <button type="button" onClick={e => { e.preventDefault(); onLegal('privacy') }} style={{ background:'none', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:11, padding:0, textDecoration:'underline' }}>Privacy Policy</button>.</span>
          </label>
        )}
        {false && (
          <div style={{ fontSize:11, color:'#64748b', marginTop:14, lineHeight:1.7, textAlign:'center' }}>
            By creating an account you agree to our{' '}
            <button onClick={() => onLegal('terms')} style={{ background:'none', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:11, padding:0, textDecoration:'underline' }}>Terms of Service</button>
            {' '}and{' '}
            <button onClick={() => onLegal('privacy')} style={{ background:'none', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:11, padding:0, textDecoration:'underline' }}>Privacy Policy</button>.
          </div>
        )}
        {mode === 'forgot' && (
          <button onClick={() => { setMode('login'); setError(''); setMsg('') }}
            style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:13, marginTop:14, textDecoration:'underline' }}>
            ← Back to Sign In
          </button>
        )}
      </div>
    </div>
  )
}

// ── Pin Card ──────────────────────────────────────────────────────────────────
function PinCard({ pin, onDelete, onMove, onToggleTrader, onOpen, showDesc=true }) {
  const [hov, setHov] = useState(false)
  const bg = COLORS[hashCode(pin.id) % COLORS.length]
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onOpen && onOpen(pin)}
      style={{ cursor: onOpen ? 'pointer' : 'default', background:'rgba(255,255,255,0.05)', border:`1px solid ${hov?'rgba(124,58,237,0.5)':'rgba(255,255,255,0.09)'}`, borderRadius:14, overflow:'hidden', transition:'all .22s', transform:hov?'translateY(-3px)':'none', boxShadow:hov?'0 10px 28px rgba(124,58,237,0.2)':'0 2px 10px rgba(0,0,0,0.3)' }}>
      <div className="card-img" style={{ background:bg }}>
        {pin.image_url
          ? <img src={pin.image_url} alt={pin.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
          : <span style={{ fontSize:36, opacity:.65 }}>📌</span>}
        <div style={{ position:'absolute', top:6, right:6, display:'flex', gap:4 }}>
          {TRADING_ENABLED && pin.is_trader && (
            <div style={{ background:'rgba(16,185,129,0.85)', border:'1px solid rgba(16,185,129,0.5)', borderRadius:5, padding:'2px 5px', fontSize:9, fontWeight:'bold', color:'#fff' }}>
              TRADER
            </div>
          )}
          <div style={{ background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:5, padding:'2px 6px', fontSize:9, fontWeight:'bold', color:'#e2d9f3', letterSpacing:1 }}>
            {pin.list==='have'?'HAVE':'WANT'}
          </div>
          {pin.database_id && <div title="Linked to the pin database" style={{ background:'rgba(52,211,153,0.85)', borderRadius:5, padding:'2px 5px', fontSize:9, fontWeight:'bold', color:'#042f2e' }}>DB ✓</div>}
        </div>
      </div>
      <div style={{ padding:'10px 10px 10px' }}>
        <div className="card-name">{pin.name}</div>
        {pin.series && <div className="card-series">{pin.series}</div>}
        {pin.estimated_value != null && (
          <div style={{ color:'#34d399', fontSize:11, fontWeight:'bold', marginTop:2 }} title="Based on active eBay listing prices, not confirmed sold prices">
            💰 ${pin.estimated_value} <span style={{ color:'#64748b', fontWeight:'normal', fontSize:9 }}>(active listings)</span>
          </div>
        )}
        {showDesc && pin.description && <div className="card-desc">{pin.description}</div>}
        <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onMove(pin.id, pin.list==='have'?'want':'have')}
            style={{ flex:1, padding:'7px 0', border:'1px solid rgba(124,58,237,0.4)', borderRadius:7, background:'rgba(124,58,237,0.15)', color:'#c4b5fd', cursor:'pointer', fontSize:11, fontWeight:600 }}>
            {pin.list==='have'?'→ Wish List':'→ Collection'}
          </button>
          {TRADING_ENABLED && onToggleTrader && (
            <button onClick={() => onToggleTrader(pin.id, !pin.is_trader)}
              title={pin.is_trader ? 'Remove from traders' : 'Mark as trader'}
              style={{ width:28, height:28, border:`1px solid ${pin.is_trader?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.15)'}`, borderRadius:7, background:pin.is_trader?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.05)', color:pin.is_trader?'#34d399':'#64748b', cursor:'pointer', fontSize:12, flexShrink:0 }}>🤝</button>
          )}
          <button onClick={() => onDelete(pin.id, pin.image_url)}
            style={{ width:28, height:28, border:'1px solid rgba(255,99,99,0.3)', borderRadius:7, background:'rgba(220,38,38,0.12)', color:'#f87171', cursor:'pointer', fontSize:12, fontWeight:'bold', flexShrink:0 }}>✕</button>
        </div>
      </div>
    </div>
  )
}

// ── Add Pin ───────────────────────────────────────────────────────────────────
// ── Multi-Pin Scanner ─────────────────────────────────────────────────────────
function MultiPinScanner({ onAddMultiple, userId, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState(null)
  const [results, setResults] = useState(null)
  const [confirmed, setConfirmed] = useState([])
  const [editingIdx, setEditingIdx] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [list, setList] = useState('have')
  const [scanImage, setScanImage] = useState(null) // compressed copy of the photo, saved with the pins
  const fileRef = useRef()

  function compressAndScan(file) {
    const reader = new FileReader()
    reader.onload = ev => {
      setPreview(ev.target.result)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 1600
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize }
          else { width = (width / height) * maxSize; height = maxSize }
        }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        setScanImage(compressed)
        scanPins(compressed)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  async function scanPins(imageData) {
    setScanning(true); setError(''); setResults(null); setConfirmed([])
    try {
      const res = await fetch('/api/identify-pins-multi', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ image: imageData })
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setResults(data)
      setConfirmed(data.pins.map((_, i) => i))
    } catch(e) {
      setError('Scan failed: ' + e.message)
    }
    setScanning(false)
  }

  function togglePin(idx) {
    setConfirmed(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  function startEdit(idx) {
    setEditingIdx(idx)
    setEditData({ ...results.pins[idx] })
  }

  function saveEdit() {
    const updated = [...results.pins]
    updated[editingIdx] = { ...editData }
    setResults({ ...results, pins: updated })
    setEditingIdx(null)
  }

  async function addConfirmed() {
    if (confirmed.length === 0) return
    setSaving(true)
    const pinsToAdd = confirmed.map(i => results.pins[i])
    await onAddMultiple(pinsToAdd, list, scanImage)
    setSaved(true)
    setTimeout(() => {
      setSaved(false); setResults(null); setPreview(null)
      setConfirmed([]); if (fileRef.current) fileRef.current.value = ''
    }, 2000)
    setSaving(false)
  }

  return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={onClose}
          style={{ background:'none', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div className="page-title" style={{ marginBottom:0 }}>📷 Scan Multiple Pins</div>
      </div>

      {!results && !scanning && (
        <>
          <div style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:14, padding:'14px 16px', marginBottom:20 }}>
            <div style={{ fontSize:13, color:'#c4b5fd', lineHeight:1.7 }}>
              📌 Lay your pins flat on a contrasting surface<br/>
              💡 Good lighting makes a big difference<br/>
              📐 Try to fit 3–10 pins per photo for best results
            </div>
          </div>
          <label style={{ display:'block', textAlign:'center', padding:'20px', border:'2px dashed rgba(124,58,237,0.5)', borderRadius:14, color:'#c4b5fd', cursor:'pointer', fontSize:15, fontWeight:600, marginBottom:12 }}>
            📷 Take Photo of Pins
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              style={{ display:'none' }} onChange={e => e.target.files[0] && compressAndScan(e.target.files[0])} />
          </label>
          <label style={{ display:'block', textAlign:'center', padding:'14px', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:14, color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            📁 Choose from Library
            <input type="file" accept="image/*"
              style={{ display:'none' }} onChange={e => e.target.files[0] && compressAndScan(e.target.files[0])} />
          </label>
        </>
      )}

      {scanning && (
        <div style={{ textAlign:'center', padding:'50px 20px' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
          <div style={{ color:'#a78bfa', fontSize:16, fontWeight:'bold', marginBottom:8 }}>Scanning your pins...</div>
          <div style={{ color:'#64748b', fontSize:13 }}>Claude is identifying each pin in your photo</div>
        </div>
      )}

      {preview && results && (
        <div style={{ marginBottom:16 }}>
          <img src={preview} alt="Scanned pins"
            style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)' }} />
        </div>
      )}

      {results && !scanning && (
        <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ color:'#34d399', fontWeight:'bold', fontSize:15 }}>
              ✅ Found {results.pins.length} pin{results.pins.length !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize:11, color:'#64748b' }}>{confirmed.length} selected</div>
          </div>

          {results.notes && (
            <div style={{ fontSize:11, color:'#64748b', marginBottom:12, fontStyle:'italic' }}>💬 {results.notes}</div>
          )}

          {results.pins.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'#64748b' }}>
              No pins could be identified. Try a clearer photo with better lighting.
              <br/>
              <button onClick={() => { setResults(null); setPreview(null) }}
                style={{ marginTop:14, padding:'8px 20px', borderRadius:10, border:'1px solid rgba(255,255,255,0.2)', background:'transparent', color:'#a78bfa', cursor:'pointer', fontSize:13 }}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {['have','want'].map(l => (
                  <button key={l} onClick={() => setList(l)}
                    style={{ flex:1, padding:'9px', borderRadius:10, border:`1px solid ${list===l?'rgba(124,58,237,0.5)':'rgba(255,255,255,0.1)'}`, background:list===l?'rgba(124,58,237,0.25)':'transparent', color:list===l?'#e2d9f3':'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                    {l === 'have' ? '🎒 Collection' : '⭐ Wish List'}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <button onClick={() => setConfirmed(results.pins.map((_,i) => i))}
                  style={{ flex:1, padding:'6px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11 }}>
                  Select All
                </button>
                <button onClick={() => setConfirmed([])}
                  style={{ flex:1, padding:'6px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11 }}>
                  Clear All
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {results.pins.map((pin, idx) => (
                  <div key={idx}
                    style={{ background:confirmed.includes(idx)?'rgba(124,58,237,0.12)':'rgba(255,255,255,0.03)', border:`1px solid ${confirmed.includes(idx)?'rgba(124,58,237,0.4)':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'12px 14px', transition:'all .2s' }}>
                    {editingIdx === idx ? (
                      <div>
                        <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})}
                          style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 10px', color:'#f1f5f9', fontSize:13, marginBottom:6, boxSizing:'border-box' }}
                          placeholder="Pin name" />
                        <input value={editData.series || ''} onChange={e => setEditData({...editData, series: e.target.value})}
                          style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 10px', color:'#f1f5f9', fontSize:12, marginBottom:8, boxSizing:'border-box' }}
                          placeholder="Series (optional)" />
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={saveEdit}
                            style={{ flex:1, padding:'6px', borderRadius:8, border:'none', background:'rgba(124,58,237,0.4)', color:'#e2d9f3', cursor:'pointer', fontSize:12, fontWeight:'bold' }}>Save</button>
                          <button onClick={() => setEditingIdx(null)}
                            style={{ padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:12 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div onClick={() => togglePin(idx)}
                          style={{ width:22, height:22, borderRadius:6, border:`2px solid ${confirmed.includes(idx)?'#7c3aed':'rgba(255,255,255,0.2)'}`, background:confirmed.includes(idx)?'rgba(124,58,237,0.5)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                          {confirmed.includes(idx) && <span style={{ color:'#fff', fontSize:13, fontWeight:'bold' }}>✓</span>}
                        </div>
                        <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => togglePin(idx)}>
                          <div style={{ color:'#f1f5f9', fontWeight:'bold', fontSize:13 }}>{pin.name}</div>
                          {pin.series && <div style={{ color:'#a78bfa', fontSize:11, marginTop:1 }}>{pin.series}</div>}
                          {pin.description && <div style={{ color:'#64748b', fontSize:11, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pin.description}</div>}
                        </div>
                        <button onClick={() => startEdit(idx)}
                          style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:16, padding:'4px', flexShrink:0 }}>✏️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && <div style={{ color:'#f87171', fontSize:13, marginBottom:12 }}>⚠️ {error}</div>}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={addConfirmed} disabled={saving || confirmed.length === 0 || saved}
                  style={{ flex:1, padding:'14px', borderRadius:12, border:'none', background:saved?'linear-gradient(135deg,#059669,#0891b2)':confirmed.length===0?'rgba(255,255,255,0.1)':'linear-gradient(135deg,#7c3aed,#db2777)', color:confirmed.length===0?'#64748b':'#fff', cursor:confirmed.length===0?'default':'pointer', fontSize:14, fontWeight:'bold' }}>
                  {saved ? `✅ ${confirmed.length} Pin${confirmed.length!==1?'s':''} Added!` : saving ? '⏳ Adding...' : `✨ Add ${confirmed.length} Pin${confirmed.length!==1?'s':''}`}
                </button>
                <button onClick={() => { setResults(null); setPreview(null); setConfirmed([]) }}
                  style={{ padding:'14px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:13 }}>
                  Rescan
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function AddPinForm({ onAdd, userId, hasAccess, onUpgrade, onMultiScan }) {
  const [name, setName] = useState('')
  const [series, setSeries] = useState('')
  const [desc, setDesc] = useState('')
  const [estValue, setEstValue] = useState('')
  const [list, setList] = useState('have')
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState('')
  const [identifying, setIdentifying] = useState(false)
  const [identified, setIdentified] = useState(false)
  const [matches, setMatches] = useState([])
  const [showMatches, setShowMatches] = useState(false)
  const [aiGuess, setAiGuess] = useState(null)
  const [showDbPanel, setShowDbPanel] = useState(false)
  const [submitToDb, setSubmitToDb] = useState(true)
  const fileRef = useRef()
  const aiRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file); setImageUrl(''); setIdentified(false)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleAiFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file); setImageUrl(''); setIdentified(false)
    const reader = new FileReader()
    reader.onload = ev => {
      setPreview(ev.target.result)
      // Compress image before uploading/sending to AI
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const maxSize = 1000
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize }
          else { width = (width / height) * maxSize; height = maxSize }
        }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)

        setIdentifying(true); setError('')
        try {
          // Convert canvas to a blob and upload to Supabase first so we have a
          // public URL — reverse image search needs a real URL, not base64
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
          const path = `${userId}/scan-${Date.now()}.jpg`
          const { error: upErr } = await supabase.storage.from('pin-images').upload(path, blob)
          if (upErr) throw new Error('Upload failed: ' + upErr.message)
          const { data: pub } = supabase.storage.from('pin-images').getPublicUrl(path)
          setImageUrl(pub.publicUrl)
          setIdentifying(false)
          identifyPin(pub.publicUrl)
        } catch (err) {
          setIdentifying(false)
          setError('Upload failed: ' + err.message)
        }
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  async function identifyPin(imageData) {
    setIdentifying(true); setError(''); setMatches([]); setShowMatches(false)
    try {
      const response = await fetch('/api/identify-pin', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ image: imageData })
      })
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errText}`)
      }
      const data = await response.json()
      if (data.found) {
        // Claude's guess — used as a fallback and as pre-fill, NOT trusted blindly
        setAiGuess({
          character: data.character || data.name || '',
          series: data.park_association || data.series || '',
          description: data.description || '',
          estimated_value: data.value_estimate?.estimated_value || null,
          value_range: data.value_estimate?.price_range || null,
          value_sample_size: data.value_estimate?.sample_size || 0
        })
        if (data.matches && data.matches.length > 0) {
          // Real photos found — let the user pick the correct one instead of guessing
          setMatches(data.matches)
          setShowMatches(true)
        } else {
          // No real matches came back — fall back to Claude's guess directly
          setName(data.character || data.name || '')
          setSeries(data.park_association || data.series || '')
          setDesc(data.description || '')
          setEstValue(data.value_estimate?.estimated_value ? String(data.value_estimate.estimated_value) : '')
          setIdentified(true)
        }
      } else {
        setError(`Could not identify pin: ${data.reason || 'Please fill in details manually'}`)
      }
    } catch(e) {
      setError('AI identification failed: ' + e.message)
    }
    setIdentifying(false)
  }

  function pickMatch(match) {
    setName(match.title || '')
    setSeries('')
    setDesc(match.title || '')
    setEstValue(aiGuess?.estimated_value ? String(aiGuess.estimated_value) : '')
    setShowMatches(false)
    setIdentified(true)
  }

  function useAiGuessInstead() {
    setName(aiGuess?.character || '')
    setSeries('')
    setDesc(aiGuess?.character || '')
    setEstValue(aiGuess?.estimated_value ? String(aiGuess.estimated_value) : '')
    setShowMatches(false)
    setIdentified(true)
  }

  async function submit() {
    if (!name.trim()) { setError('Pin name is required.'); return }
    setLoading(true); setError('')
    let finalUrl = imageUrl
    try {
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${userId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('pin-images').upload(path, imageFile)
        if (upErr) throw upErr
        const { data } = supabase.storage.from('pin-images').getPublicUrl(path)
        finalUrl = data.publicUrl
      }
      // Manual pins are also sent to the pin database for review, so they can be used in books.
      // If an approved record with this exact name already exists, nothing is submitted: link it later from the pin's detail page.
      let databaseId = null
      if (submitToDb) {
        const esc = name.trim().replace(/[\\%_]/g, m => '\\' + m)
        const { data: existing } = await supabase.from('pin_database').select('id').ilike('name', esc).limit(1)
        if (!existing || existing.length === 0) {
          const { data: created } = await supabase.from('pin_database').insert([{
            name: name.trim(), series: series.trim() || null, description: desc.trim() || null,
            estimated_value: estValue ? parseFloat(estValue) : null, image_url: finalUrl || null, status:'pending', submitted_by: userId
          }]).select('id').single()
          databaseId = created?.id || null
        }
      }
      await onAdd({ name:name.trim(), series:series.trim(), description:desc.trim(), image_url:finalUrl, list, estimated_value: estValue ? parseFloat(estValue) : null,
        ...(databaseId ? { database_id: databaseId, image_source: finalUrl ? 'own' : null, own_image_url: finalUrl || null } : {}) })
      setName(''); setSeries(''); setDesc(''); setEstValue(''); setImageUrl(''); setPreview(''); setImageFile(null); setIdentified(false)
      if (fileRef.current) fileRef.current.value = ''
      if (aiRef.current) aiRef.current.value = ''
      setOk(true); setTimeout(() => setOk(false), 2500)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const lbl = { display:'block', fontSize:12, fontWeight:'bold', color:'#a78bfa', marginBottom:6, letterSpacing:.5 }

  return (
    <div style={{ maxWidth:540 }} className="fade-up">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div className="page-title" style={{ marginBottom:0 }}>✨ Add a New Pin</div>
        {hasAccess && (
          <button onClick={onMultiScan}
            style={{ padding:'7px 12px', borderRadius:10, border:'1px solid rgba(124,58,237,0.4)', background:'rgba(124,58,237,0.2)', color:'#c4b5fd', cursor:'pointer', fontSize:12, fontWeight:'bold', whiteSpace:'nowrap' }}>
            📷 Scan Multiple
          </button>
        )}
      </div>

      {showDbPanel ? (
        <DatabaseAddPanel userId={userId} onCancel={() => setShowDbPanel(false)} onConfirm={async payload => { await onAdd(payload); setShowDbPanel(false) }} />
      ) : (
        <button onClick={() => setShowDbPanel(true)} style={{ width:'100%', padding:'14px', marginBottom:18, border:'1px solid rgba(124,58,237,0.5)', borderRadius:14, background:'rgba(124,58,237,0.18)', color:'#e2d9f3', cursor:'pointer', fontSize:15, fontWeight:'bold' }}>
          🔎 Pick a pin from the database
        </button>
      )}

      {/* AI Identifier Section */}
      <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(219,39,119,0.15))', border:'1px solid rgba(124,58,237,0.4)', borderRadius:16, padding:'18px', marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ fontSize:22 }}>🤖</span>
          <div>
            <div style={{ color:'#e2d9f3', fontWeight:'bold', fontSize:14 }}>AI Pin Identifier</div>
            <div style={{ color:'#a78bfa', fontSize:11 }}>
              {hasAccess ? 'Take a photo and Claude will identify your pin!' : '✨ Castle Pass feature — upgrade to unlock!'}
            </div>
          </div>
        </div>

        {!hasAccess ? (
          <div style={{ textAlign:'center', padding:'10px 0' }}>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:10 }}>
              Instantly identify any Disney pin with AI — name, series, and description auto-filled.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => onUpgrade('monthly')}
                style={{ flex:1, padding:'9px 6px', borderRadius:10, border:'1px solid rgba(124,58,237,0.5)', background:'rgba(124,58,237,0.3)', color:'#e2d9f3', cursor:'pointer', fontSize:12, fontWeight:'bold' }}>
                $4.99/mo
              </button>
              <button onClick={() => onUpgrade('annual')}
                style={{ flex:1, padding:'9px 6px', borderRadius:10, border:'1px solid rgba(219,39,119,0.5)', background:'rgba(219,39,119,0.3)', color:'#fce7f3', cursor:'pointer', fontSize:12, fontWeight:'bold' }}>
                $44.99/yr 🔥
              </button>
            </div>
          </div>
        ) : identifying ? (
          <div style={{ textAlign:'center', padding:'16px 0', color:'#a78bfa' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
            <div style={{ fontSize:13 }}>Claude is identifying your pin...</div>
          </div>
        ) : showMatches ? (
          <div style={{ padding:'6px 0' }}>
            <div style={{ fontSize:12, color:'#c4b5fd', marginBottom:10, textAlign:'center' }}>
              Tap the photo below that matches your pin 👇
              {aiGuess?.estimated_value && (
                <div style={{ marginTop:6, color:'#34d399', fontWeight:'bold' }}>
                  💰 Est. value: ${aiGuess.estimated_value}
                  {aiGuess.value_range && ` (range $${aiGuess.value_range.low}–$${aiGuess.value_range.high}, based on ${aiGuess.value_sample_size} listings)`}
                  <div style={{ fontWeight:'normal', fontSize:10, color:'#64748b', marginTop:2 }}>
                    Based on active eBay listing prices, not confirmed sold prices
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:12 }}>
              {matches.map((m, i) => (
                <button key={i} onClick={() => pickMatch(m)}
                  style={{ padding:0, border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, overflow:'hidden', background:'rgba(255,255,255,0.04)', cursor:'pointer', textAlign:'left' }}>
                  <img src={m.thumbnail} alt={m.title} style={{ width:'100%', height:70, objectFit:'cover', display:'block' }} />
                  <div style={{ padding:'4px 6px', fontSize:9, color:'#94a3b8', lineHeight:1.3, maxHeight:32, overflow:'hidden' }}>
                    {m.title}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={useAiGuessInstead}
                style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11 }}>
                None match — use AI guess
              </button>
              <button onClick={() => { setShowMatches(false); setMatches([]); if(aiRef.current) aiRef.current.value='' }}
                style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11 }}>
                Try another photo
              </button>
            </div>
          </div>
        ) : identified ? (
          <div style={{ textAlign:'center', padding:'10px 0' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>✅</div>
            <div style={{ color:'#34d399', fontSize:13, fontWeight:'bold' }}>Pin identified! Details filled in below.</div>
            <button onClick={() => { setIdentified(false); if(aiRef.current) aiRef.current.value='' }}
              style={{ marginTop:8, padding:'5px 14px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:12 }}>
              Try another photo
            </button>
          </div>
        ) : (
          <label style={{ display:'block', textAlign:'center', padding:'14px', border:'2px dashed rgba(124,58,237,0.5)', borderRadius:12, color:'#c4b5fd', cursor:'pointer', fontSize:14, fontWeight:600, transition:'all .2s' }}>
            📷 Take Photo to Auto-Identify
            <input ref={aiRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleAiFile} />
          </label>
        )}
      </div>

      {/* Manual form */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, padding:'22px 18px' }}>
        <label style={lbl}>Pin Name *</label>
        <input className="field-input" placeholder="e.g. Mickey Mouse 50th Anniversary" value={name} onChange={e => setName(e.target.value)} />
        <label style={lbl}>Series / Collection</label>
        <input className="field-input" placeholder="e.g. Walt Disney World 2024" value={series} onChange={e => setSeries(e.target.value)} />
        <label style={lbl}>Description</label>
        <textarea className="field-input" style={{ resize:'vertical', minHeight:85 }} rows={3}
          placeholder="Describe the pin design, edition, special features..."
          value={desc} onChange={e => setDesc(e.target.value)} />
        <label style={lbl}>Estimated Value ($) <span style={{ fontWeight:'normal', color:'#64748b', fontSize:10 }}>— active eBay listings only, not sold prices</span></label>
        <input className="field-input" type="number" step="0.01" min="0" placeholder="e.g. 12.50"
          value={estValue} onChange={e => setEstValue(e.target.value)} />
        <label style={lbl}>Add to</label>
        <div style={{ display:'flex', gap:8, marginBottom:18 }}>
          {['have','want'].map(l => (
            <button key={l} onClick={() => setList(l)}
              style={{ flex:1, padding:'12px 0', border:`1px solid ${list===l?'#7c3aed':'rgba(255,255,255,0.1)'}`, borderRadius:10, background:list===l?'rgba(124,58,237,0.3)':'transparent', color:list===l?'#e2d9f3':'#94a3b8', cursor:'pointer', fontSize:14, fontWeight:'bold' }}>
              {l==='have'?'🎒 My Collection':'⭐ Wish List'}
            </button>
          ))}
        </div>

        <label style={lbl}>Pin Image</label>
        {preview ? (
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
            <div style={{ width:90, height:90, borderRadius:10, overflow:'hidden', border:'2px solid rgba(124,58,237,0.5)', flexShrink:0 }}>
              <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
            <button onClick={() => { setPreview(''); setImageFile(null); setImageUrl(''); setIdentified(false); if(fileRef.current) fileRef.current.value=''; if(aiRef.current) aiRef.current.value='' }}
              style={{ padding:'8px 14px', border:'1px solid rgba(255,99,99,0.3)', borderRadius:8, background:'rgba(220,38,38,0.1)', color:'#f87171', cursor:'pointer', fontSize:13 }}>
              Remove
            </button>
          </div>
        ) : (
          <>
            <input className="field-input" placeholder="Paste image URL..." value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setPreview(e.target.value); setImageFile(null) }} />
            <div style={{ textAlign:'center', color:'#475569', fontSize:12, margin:'-6px 0 12px' }}>— or —</div>
            <label style={{ display:'block', textAlign:'center', padding:'13px', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:12, color:'#94a3b8', cursor:'pointer', fontSize:14, fontWeight:600, marginBottom:14 }}>
              📁 Choose from Library
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
            </label>
          </>
        )}

        <label style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:12, color:'#94a3b8', lineHeight:1.5, marginBottom:14, cursor:'pointer' }}>
          <input type="checkbox" checked={submitToDb} onChange={e => setSubmitToDb(e.target.checked)} style={{ marginTop:3, flexShrink:0 }} />
          <span>Also submit this pin to the pin database for review. Pins must be in the database to be added to a book.</span>
        </label>
        {error && <div style={{ color:'#f87171', fontSize:13, marginBottom:12 }}>⚠️ {error}</div>}
        <button className="primary-btn" onClick={submit} disabled={loading}
          style={{ background:ok?'linear-gradient(135deg,#059669,#0891b2)':loading?'rgba(124,58,237,0.4)':'linear-gradient(135deg,#7c3aed,#db2777)' }}>
          {loading?'⏳ Saving...':ok?'✓ Pin Added!':'✨ Add Pin'}
        </button>
      </div>
    </div>
  )
}

// ── Pin List ──────────────────────────────────────────────────────────────────
function PinList({ pins, listType, onDelete, onMove, onToggleTrader, onPinChange, loading, userId }) {
  const [search, setSearch] = useState('')
  const [detailPin, setDetailPin] = useState(null)
  const storageKey = `castlepins_showdesc_list_${userId}`
  const [showDesc, setShowDesc] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved === null ? true : saved === 'true'
  })
  function toggleDesc() {
    setShowDesc(v => {
      localStorage.setItem(storageKey, String(!v))
      return !v
    })
  }
  const filtered = pins.filter(p => p.list===listType && (
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.series||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.description||'').toLowerCase().includes(search.toLowerCase())
  ))
  return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        <div className="page-title" style={{ marginBottom:0 }}>{listType==='have'?'🎒 My Pin Collection':'⭐ My Wish List'}</div>
        <button onClick={toggleDesc}
          style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'5px 10px', color: showDesc ? '#a78bfa' : '#64748b', cursor:'pointer', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
          {showDesc ? '📝 Hide Desc' : '📝 Show Desc'}
        </button>
      </div>
      <div style={{ display:'inline-block', background:'rgba(124,58,237,0.3)', border:'1px solid rgba(124,58,237,0.5)', borderRadius:20, padding:'3px 14px', fontSize:12, color:'#c4b5fd', marginBottom:14, marginTop:4 }}>
        {loading ? 'Loading...' : `${filtered.length} pin${filtered.length!==1?'s':''}`}
      </div>
      <input className="search-bar" placeholder="🔍 Search pins..." value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#64748b' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>Loading your pins...
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:54, marginBottom:14, opacity:.4 }}>{listType==='have'?'🎒':'⭐'}</div>
          <div style={{ color:'#64748b', fontSize:15 }}>
            {search?'No pins match your search.':listType==='have'?'No pins yet — add your first pin!':'Your wish list is empty!'}
          </div>
        </div>
      ) : (
        <div className="pin-grid">
          {filtered.map(pin => <PinCard key={pin.id} pin={pin} onDelete={onDelete} onMove={onMove} onToggleTrader={onToggleTrader} onOpen={setDetailPin} showDesc={showDesc} />)}
        </div>
      )}
      {detailPin && <PinDetailModal pin={detailPin} userId={userId} onPinChange={onPinChange} onClose={() => setDetailPin(null)} />}
    </div>
  )
}

// ── Mystery Boxes ────────────────────────────────────────────────────────────
function BoxImageSlot({ label, preview, onFile, onRemove }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:'bold', color:'#a78bfa', marginBottom:6, letterSpacing:.5 }}>{label}</div>
      {preview ? (
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ width:72, height:72, borderRadius:10, overflow:'hidden', border:'2px solid rgba(124,58,237,0.5)', flexShrink:0 }}>
            <img src={preview} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <button type="button" onClick={onRemove}
            style={{ padding:'7px 12px', border:'1px solid rgba(255,99,99,0.3)', borderRadius:8, background:'rgba(220,38,38,0.1)', color:'#f87171', cursor:'pointer', fontSize:12 }}>
            Remove
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', gap:8 }}>
          <label style={{ flex:1, display:'block', textAlign:'center', padding:'11px 6px', border:'1px dashed rgba(124,58,237,0.4)', borderRadius:10, color:'#c4b5fd', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            📷 Camera
            <input type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => { onFile(e.target.files[0]); e.target.value='' }} />
          </label>
          <label style={{ flex:1, display:'block', textAlign:'center', padding:'11px 6px', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:10, color:'#94a3b8', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            📁 Library
            <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => { onFile(e.target.files[0]); e.target.value='' }} />
          </label>
        </div>
      )}
    </div>
  )
}

function MysteryBoxForm({ onSave, onCancel, userId, editingBox }) {
  const [name, setName] = useState(editingBox?.name || '')
  const [year, setYear] = useState(editingBox?.year ? String(editingBox.year) : '')
  const [notes, setNotes] = useState(editingBox?.notes || '')
  const [front, setFront] = useState({ file:null, preview: editingBox?.front_image_url || '' })
  const [back, setBack] = useState({ file:null, preview: editingBox?.back_image_url || '' })
  const [sides, setSides] = useState(() => (editingBox?.side_image_urls || []).map(url => ({ file:null, preview:url })))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function readFile(file, cb) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => cb(ev.target.result)
    reader.readAsDataURL(file)
  }
  function handleFrontFile(file) { readFile(file, preview => setFront({ file, preview })) }
  function handleBackFile(file) { readFile(file, preview => setBack({ file, preview })) }
  function handleSideFile(idx, file) {
    readFile(file, preview => setSides(prev => prev.map((s,i) => i===idx ? { file, preview } : s)))
  }
  function addSideSlot() { if (sides.length < 4) setSides(prev => [...prev, { file:null, preview:'' }]) }
  function removeSideSlot(idx) { setSides(prev => prev.filter((_,i) => i!==idx)) }

  async function uploadIfNeeded(imgObj, tag) {
    if (!imgObj.file) return imgObj.preview || null
    const ext = (imgObj.file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${userId}/mysterybox-${Date.now()}-${tag}.${ext}`
    const { error: upErr } = await supabase.storage.from('pin-images').upload(path, imgObj.file)
    if (upErr) throw upErr
    const { data } = supabase.storage.from('pin-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function submit() {
    if (!name.trim()) { setError('Mystery Box Name is required.'); return }
    setLoading(true); setError('')
    try {
      const frontUrl = await uploadIfNeeded(front, 'front')
      const backUrl = await uploadIfNeeded(back, 'back')
      const sideUrls = []
      for (let i=0; i<sides.length; i++) {
        const url = await uploadIfNeeded(sides[i], `side${i+1}`)
        if (url) sideUrls.push(url)
      }
      await onSave({
        id: editingBox?.id,
        name: name.trim(),
        year: year.trim() ? parseInt(year.trim(), 10) : null,
        notes: notes.trim(),
        front_image_url: frontUrl,
        back_image_url: backUrl,
        side_image_urls: sideUrls,
      })
    } catch (err) {
      setError('Save failed: ' + err.message)
      setLoading(false)
    }
  }

  const lbl = { display:'block', fontSize:12, fontWeight:'bold', color:'#a78bfa', marginBottom:6, letterSpacing:.5 }

  return (
    <div className="fade-up" style={{ maxWidth:560, margin:'0 auto' }}>
      <div className="page-title">{editingBox ? '✏️ Edit Mystery Box' : '🎁 Add Mystery Box'}</div>
      <div style={{ color:'#94a3b8', fontSize:12, marginBottom:18 }}>
        Track sealed or opened mystery pin boxes with photos of every side.
      </div>

      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, padding:'22px 18px' }}>
        <label style={lbl}>Mystery Box Name *</label>
        <input className="field-input" placeholder="e.g. Park Life Mystery Box" value={name} onChange={e => setName(e.target.value)} />

        <label style={lbl}>Year</label>
        <input className="field-input" type="number" placeholder="e.g. 2024" value={year} onChange={e => setYear(e.target.value)} />

        <label style={lbl}>Notes</label>
        <textarea className="field-input" style={{ resize:'vertical', minHeight:80 }} rows={3}
          placeholder="Series, number of pins inside, chaser odds, where purchased..."
          value={notes} onChange={e => setNotes(e.target.value)} />

        <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'6px 0 18px' }} />

        <BoxImageSlot label="FRONT OF BOX" preview={front.preview} onFile={handleFrontFile} onRemove={() => setFront({ file:null, preview:'' })} />
        <BoxImageSlot label="BACK OF BOX" preview={back.preview} onFile={handleBackFile} onRemove={() => setBack({ file:null, preview:'' })} />

        <div style={{ fontSize:11, fontWeight:'bold', color:'#a78bfa', marginBottom:6, letterSpacing:.5, marginTop:4 }}>
          SIDE PANELS (optional)
        </div>
        {sides.map((s, i) => (
          <BoxImageSlot key={i} label={`SIDE ${i+1}`} preview={s.preview} onFile={f => handleSideFile(i, f)} onRemove={() => removeSideSlot(i)} />
        ))}
        {sides.length < 4 && (
          <button type="button" onClick={addSideSlot}
            style={{ width:'100%', padding:'10px', borderRadius:10, border:'1px dashed rgba(255,255,255,0.2)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:12, fontWeight:600, marginBottom:16 }}>
            ＋ Add Side Panel Photo
          </button>
        )}

        {error && <div style={{ color:'#f87171', fontSize:13, marginBottom:12 }}>⚠️ {error}</div>}

        <div style={{ display:'flex', gap:10 }}>
          {onCancel && (
            <button onClick={onCancel} disabled={loading}
              style={{ flex:1, padding:'15px', borderRadius:13, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:14, fontWeight:'bold' }}>
              Cancel
            </button>
          )}
          <button className="primary-btn" onClick={submit} disabled={loading}
            style={{ flex:2, background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
            {loading ? '⏳ Saving...' : editingBox ? '✓ Save Changes' : '✨ Add Mystery Box'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MysteryBoxCard({ box, onView, onEdit, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false)
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, overflow:'hidden' }}>
      <div className="card-img" style={{ background:'linear-gradient(135deg,#312e81,#4c1d95)', cursor:'pointer' }} onClick={() => onView(box)}>
        {box.front_image_url
          ? <img src={box.front_image_url} alt={box.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <span style={{ fontSize:36, opacity:.5 }}>🎁</span>}
      </div>
      <div style={{ padding:'10px 12px' }}>
        <div className="card-name" style={{ cursor:'pointer' }} onClick={() => onView(box)}>{box.name}</div>
        {box.year && <div className="card-series">{box.year}</div>}
        {box.notes && <div className="card-desc">{box.notes}</div>}
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <button onClick={() => onView(box)}
            style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11, fontWeight:'bold' }}>
            👁️ View
          </button>
          <button onClick={() => onEdit(box)}
            style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(124,58,237,0.4)', background:'rgba(124,58,237,0.15)', color:'#c4b5fd', cursor:'pointer', fontSize:11, fontWeight:'bold' }}>
            ✏️ Edit
          </button>
          {confirmDel ? (
            <button onClick={() => onDelete(box)}
              style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(220,38,38,0.5)', background:'rgba(220,38,38,0.25)', color:'#fca5a5', cursor:'pointer', fontSize:11, fontWeight:'bold' }}>
              Confirm?
            </button>
          ) : (
            <button onClick={() => setConfirmDel(true)}
              style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11, fontWeight:'bold' }}>
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function MysteryBoxViewer({ box, onBack, onEdit, onDelete }) {
  const photos = [
    box.front_image_url && { label:'Front', url:box.front_image_url },
    box.back_image_url && { label:'Back', url:box.back_image_url },
    ...(box.side_image_urls || []).map((url, i) => ({ label:`Side ${i+1}`, url })),
  ].filter(Boolean)
  const [activeIdx, setActiveIdx] = useState(0)
  const [confirmDel, setConfirmDel] = useState(false)
  const active = photos[activeIdx]

  return (
    <div className="fade-up" style={{ maxWidth:560, margin:'0 auto' }}>
      <button onClick={onBack}
        style={{ background:'transparent', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:13, fontWeight:'bold', marginBottom:14, padding:0 }}>
        ← Back to Mystery Boxes
      </button>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:14 }}>
        <div>
          <div className="page-title" style={{ marginBottom:2 }}>{box.name}</div>
          {box.year && <div style={{ color:'#a78bfa', fontSize:12, fontWeight:600 }}>{box.year}</div>}
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={() => onEdit(box)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid rgba(124,58,237,0.4)', background:'rgba(124,58,237,0.15)', color:'#c4b5fd', cursor:'pointer', fontSize:11, fontWeight:'bold' }}>
            ✏️ Edit
          </button>
          {confirmDel ? (
            <button onClick={() => onDelete(box)}
              style={{ padding:'8px 12px', borderRadius:8, border:'1px solid rgba(220,38,38,0.5)', background:'rgba(220,38,38,0.25)', color:'#fca5a5', cursor:'pointer', fontSize:11, fontWeight:'bold' }}>
              Confirm?
            </button>
          ) : (
            <button onClick={() => setConfirmDel(true)}
              style={{ padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11, fontWeight:'bold' }}>
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {photos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px 0', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, marginBottom:16 }}>
          <div style={{ fontSize:44, marginBottom:10, opacity:.4 }}>🎁</div>
          <div style={{ color:'#64748b', fontSize:14 }}>No photos added yet for this box.</div>
        </div>
      ) : (
        <>
          <div style={{ position:'relative', width:'100%', aspectRatio:'1', borderRadius:16, overflow:'hidden', border:'2px solid rgba(124,58,237,0.5)', background:'rgba(0,0,0,0.3)', marginBottom:10 }}>
            <img src={active.url} alt={active.label} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            <div style={{ position:'absolute', bottom:8, left:8, background:'rgba(15,10,30,0.85)', color:'#e2d9f3', fontSize:11, fontWeight:'bold', padding:'4px 10px', borderRadius:20 }}>
              {active.label}
            </div>
          </div>
          {photos.length > 1 && (
            <div style={{ display:'flex', gap:8, marginBottom:18, overflowX:'auto', paddingBottom:4 }}>
              {photos.map((p, i) => (
                <button key={i} onClick={() => setActiveIdx(i)}
                  style={{ flexShrink:0, width:60, height:60, padding:0, borderRadius:10, overflow:'hidden', cursor:'pointer',
                    border:`2px solid ${i===activeIdx ? '#7c3aed' : 'rgba(255,255,255,0.15)'}` }}>
                  <img src={p.url} alt={p.label} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {box.notes && (
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:'16px 18px' }}>
          <div style={{ fontSize:11, fontWeight:'bold', color:'#a78bfa', marginBottom:6, letterSpacing:.5 }}>NOTES</div>
          <div style={{ color:'#cbd5e1', fontSize:13, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{box.notes}</div>
        </div>
      )}
    </div>
  )
}

function MysteryBoxesPage({ boxes, userId, onAdd, onUpdate, onDelete, loading }) {
  const [mode, setMode] = useState('list') // 'list' | 'add' | 'edit' | 'view'
  const [editingBox, setEditingBox] = useState(null)
  const [viewingBox, setViewingBox] = useState(null)
  const [search, setSearch] = useState('')

  async function handleSave(data) {
    if (data.id) await onUpdate(data)
    else await onAdd(data)
    setMode('list'); setEditingBox(null)
  }
  function startEdit(box) { setEditingBox(box); setViewingBox(null); setMode('edit') }
  function startView(box) { setViewingBox(box); setMode('view') }
  async function handleDelete(box) {
    await onDelete(box)
    if (viewingBox?.id === box.id) { setViewingBox(null); setMode('list') }
  }

  if (mode === 'add' || mode === 'edit') {
    return <MysteryBoxForm userId={userId} editingBox={mode==='edit' ? editingBox : null}
      onSave={handleSave} onCancel={() => { setMode('list'); setEditingBox(null) }} />
  }

  if (mode === 'view' && viewingBox) {
    // Keep the viewed box's data fresh (e.g. after an edit) by pulling the latest copy from the list
    const current = boxes.find(b => b.id === viewingBox.id) || viewingBox
    return <MysteryBoxViewer box={current} onBack={() => { setMode('list'); setViewingBox(null) }} onEdit={startEdit} onDelete={handleDelete} />
  }

  const filtered = boxes.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.notes||'').toLowerCase().includes(search.toLowerCase()) ||
    String(b.year||'').includes(search)
  )

  return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        <div className="page-title" style={{ marginBottom:0 }}>🎁 Mystery Boxes</div>
        <button onClick={() => setMode('add')}
          style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)', border:'none', borderRadius:10, padding:'8px 16px', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:'bold' }}>
          ＋ Add Box
        </button>
      </div>
      <div style={{ display:'inline-block', background:'rgba(124,58,237,0.3)', border:'1px solid rgba(124,58,237,0.5)', borderRadius:20, padding:'3px 14px', fontSize:12, color:'#c4b5fd', marginBottom:14, marginTop:4 }}>
        {loading ? 'Loading...' : `${filtered.length} box${filtered.length!==1?'es':''}`}
      </div>
      <input className="search-bar" placeholder="🔍 Search mystery boxes..." value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#64748b' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>Loading mystery boxes...
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:54, marginBottom:14, opacity:.4 }}>🎁</div>
          <div style={{ color:'#64748b', fontSize:15 }}>
            {search ? 'No mystery boxes match your search.' : 'No mystery boxes yet — add your first one!'}
          </div>
        </div>
      ) : (
        <div className="pin-grid">
          {filtered.map(box => <MysteryBoxCard key={box.id} box={box} onView={startView} onEdit={startEdit} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────────
function ProfilePage({ user, haveCount, wantCount, subscription, onUpgrade, profile, onUpdateProfile, onLegal }) {
  const isPaid = subscription?.status === 'active'
  const isAdmin = subscription?.is_admin === true
  const hasAccess = isPaid || isAdmin

  async function deleteMyAccount() {
    const sub = isPaid && !isAdmin ? '\n\nYour Castle Pass subscription will also be cancelled.' : ''
    if (!window.confirm('Permanently delete your account?\n\nAll of your pins, books, mystery boxes, photos and settings will be erased. This cannot be undone.' + sub)) return
    if (window.prompt('Type DELETE to confirm.') !== 'DELETE') return
    try {
      const res = await fetch('/api/delete-account', { method:'POST', headers: await authHeaders() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not delete account')
      await supabase.auth.signOut()
    } catch (err) {
      window.alert('Account deletion failed: ' + err.message + '\nPlease contact support.')
    }
  }
  const [portalLoading, setPortalLoading] = useState(false)

  async function openPortal() {
    if (!subscription?.stripe_customer_id) return
    setPortalLoading(true)
    try {
      const res = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ customerId: subscription.stripe_customer_id })
      })
      const { url } = await res.json()
      window.location.href = url
    } catch(e) { console.error(e) }
    setPortalLoading(false)
  }

  return (
    <div className="fade-up">
      <div className="page-title">👤 My Profile</div>
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, padding:'22px 18px', marginTop:16, maxWidth:420 }}>
        {/* Avatar + email */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22 }}>
          <div style={{ width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:'bold', color:'#fff', flexShrink:0 }}>
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <div style={{ color:'#f1f5f9', fontWeight:'bold', fontSize:15 }}>{user.email}</div>
            <div style={{ color: hasAccess ? '#fde68a' : '#64748b', fontSize:12, marginTop:3 }}>
              {isAdmin ? '👑 Admin' : hasAccess ? '✨ Castle Pass' : '🏰 Free Member'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22 }}>
          <div style={{ background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:12, padding:'16px 12px', textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:'bold', color:'#e2d9f3' }}>{haveCount}</div>
            <div style={{ fontSize:11, color:'#a78bfa', marginTop:2 }}>🎒 In Collection</div>
          </div>
          <div style={{ background:'rgba(219,39,119,0.15)', border:'1px solid rgba(219,39,119,0.3)', borderRadius:12, padding:'16px 12px', textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:'bold', color:'#e2d9f3' }}>{wantCount}</div>
            <div style={{ fontSize:11, color:'#f9a8d4', marginTop:2 }}>⭐ On Wish List</div>
          </div>
        </div>

        {/* Subscription status / upgrade */}
        {!hasAccess && (
          <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(219,39,119,0.2))', border:'1px solid rgba(124,58,237,0.4)', borderRadius:14, padding:'18px', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:'bold', color:'#f9fafb', marginBottom:6 }}>✨ Upgrade to Castle Pass</div>
            <div style={{ fontSize:12, color:'#c4b5fd', marginBottom:14, lineHeight:1.6 }}>
              Unlock the AI pin identifier, multi-pin scanning, and unlimited pin books.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => onUpgrade('monthly')}
                style={{ flex:1, padding:'10px 6px', borderRadius:10, border:'1px solid rgba(124,58,237,0.5)', background:'rgba(124,58,237,0.3)', color:'#e2d9f3', cursor:'pointer', fontSize:12, fontWeight:'bold' }}>
                $4.99/mo
              </button>
              <button onClick={() => onUpgrade('annual')}
                style={{ flex:1, padding:'10px 6px', borderRadius:10, border:'1px solid rgba(219,39,119,0.5)', background:'rgba(219,39,119,0.3)', color:'#fce7f3', cursor:'pointer', fontSize:12, fontWeight:'bold' }}>
                $44.99/yr 🔥
              </button>
            </div>
          </div>
        )}

        {isPaid && !isAdmin && (
          <button onClick={openPortal} disabled={portalLoading}
            style={{ width:'100%', padding:'12px', border:'1px solid rgba(124,58,237,0.3)', borderRadius:12, background:'rgba(124,58,237,0.1)', color:'#c4b5fd', cursor:'pointer', fontSize:14, fontWeight:'bold', marginBottom:12 }}>
            {portalLoading ? '⏳ Loading...' : '⚙️ Manage Subscription'}
          </button>
        )}

        {/* Trading opt-in */}
        {TRADING_ENABLED && hasAccess && (
          <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${profile?.trading_enabled ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.09)'}`, borderRadius:14, padding:'16px', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:'bold', color:'#e2d9f3', marginBottom:6 }}>🤝 Pin Trading</div>
            {profile?.trading_enabled ? (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#34d399', flexShrink:0 }} />
                  <div style={{ fontSize:13, color:'#34d399', fontWeight:'bold' }}>Active Pin Trader</div>
                </div>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:12, lineHeight:1.5 }}>
                  You are visible to other traders and can send and receive trade requests.
                </div>
                <button onClick={() => {
                    if (window.confirm('Are you sure you want to disable pin trading?\n\nYou will no longer appear in the trader directory and will not be able to send or receive new trade requests.')) {
                      onUpdateProfile({ trading_enabled: false })
                    }
                  }}
                  style={{ width:'100%', padding:'9px', borderRadius:10, border:'1px solid rgba(255,99,99,0.3)', background:'rgba(220,38,38,0.08)', color:'#f87171', cursor:'pointer', fontSize:12, fontWeight:'bold' }}>
                  Disable Trading
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize:11, color:'#94a3b8', marginBottom:12, lineHeight:1.6 }}>
                  Join the CastlePins trading community! Your email address (<span style={{color:'#a78bfa'}}>{user.email}</span>) may be shared with potential trade partners so they can contact you. See our{' '}
                  <button onClick={() => onLegal('privacy')} style={{ background:'none', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:11, padding:0, textDecoration:'underline' }}>Privacy Policy</button> for details.
                </div>
                <button onClick={() => onUpdateProfile({ trading_enabled: true })}
                  style={{ width:'100%', padding:'10px', borderRadius:10, border:'1px solid rgba(16,185,129,0.4)', background:'rgba(16,185,129,0.15)', color:'#34d399', cursor:'pointer', fontSize:13, fontWeight:'bold' }}>
                  ✅ Join Pin Trading Community
                </button>
              </>
            )}
          </div>
        )}

        {/* Legal links */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:12 }}>
          <button onClick={() => onLegal('terms')}
            style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:11, textDecoration:'underline' }}>
            Terms of Service
          </button>
          <button onClick={() => onLegal('privacy')}
            style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:11, textDecoration:'underline' }}>
            Privacy Policy
          </button>
        </div>

        <button onClick={() => supabase.auth.signOut()}
          style={{ width:'100%', padding:'14px', border:'1px solid rgba(255,99,99,0.3)', borderRadius:12, background:'rgba(220,38,38,0.1)', color:'#f87171', cursor:'pointer', fontSize:15, fontWeight:'bold' }}>
          Sign Out
        </button>

        <button onClick={deleteMyAccount}
          style={{ width:'100%', marginTop:14, padding:'10px', border:'none', background:'none', color:'#64748b', cursor:'pointer', fontSize:12, textDecoration:'underline' }}>
          Delete my account
        </button>
      </div>
    </div>
  )
}

// ── Pin Books Page ────────────────────────────────────────────────────────────
const BOOK_ICONS = [
  { icon:'🏰', label:'Castle' },
  { icon:'✨', label:'Magic' },
  { icon:'👸', label:'Princess' },
  { icon:'🤴', label:'Prince' },
  { icon:'🚀', label:'Space' },
  { icon:'🌊', label:'Ocean' },
  { icon:'🦁', label:'Animals' },
  { icon:'🧊', label:'Frozen' },
  { icon:'🎄', label:'Holiday' },
  { icon:'🎃', label:'Halloween' },
  { icon:'💎', label:'Rare' },
  { icon:'🔥', label:'Hot' },
  { icon:'🌹', label:'Beauty' },
  { icon:'🍎', label:'Snow White' },
  { icon:'🧚', label:'Fairy' },
  { icon:'🦋', label:'Fantasy' },
  { icon:'⚡', label:'Power' },
  { icon:'🎭', label:'Villain' },
  { icon:'🎪', label:'Circus' },
  { icon:'🌟', label:'Star' },
  { icon:'🎠', label:'Carousel' },
  { icon:'🧜', label:'Mermaid' },
  { icon:'🦄', label:'Unicorn' },
  { icon:'🐭', label:'Mickey' },
  { icon:'🎶', label:'Music' },
  { icon:'🏆', label:'Limited Ed' },
  { icon:'🌺', label:'Tropical' },
  { icon:'🎯', label:'Traders' },
  { icon:'💫', label:'Wish List' },
  { icon:'🗺️', label:'Adventure' },
]

function SelectablePinCard({ pin, selected, onToggle }) {
  return (
    <div onClick={() => onToggle(pin.id)}
      style={{ background: selected ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)', border: `2px solid ${selected ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`, borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'all .15s', position:'relative' }}>
      {/* Checkmark */}
      <div style={{ position:'absolute', top:6, left:6, width:22, height:22, borderRadius:'50%', background: selected ? '#7c3aed' : 'rgba(0,0,0,0.5)', border: selected ? '2px solid #a78bfa' : '2px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, zIndex:2, transition:'all .15s' }}>
        {selected && '✓'}
      </div>
      <div style={{ width:'100%', height:100, background:COLORS[hashCode(pin.id)%COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        {pin.image_url
          ? <img src={pin.image_url} alt={pin.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
          : <span style={{ fontSize:28, opacity:.65 }}>📌</span>}
      </div>
      <div style={{ padding:'8px 10px' }}>
        <div className="card-name">{pin.name}</div>
        {pin.series && <div className="card-series">{pin.series}</div>}
      </div>
    </div>
  )
}


// ── Trading Page ──────────────────────────────────────────────────────────────
function TradingPage({ user, pins, hasAccess, profile, onUpdateProfile, onUpgrade, onLegal }) {
  const [view, setView] = useState('browse') // 'browse' | 'trade_form'
  const [traders, setTraders] = useState([])
  const [search, setSearch] = useState('')
  const [selectedTrader, setSelectedTrader] = useState(null)
  const [traderPins, setTraderPins] = useState([])
  const [loadingTraders, setLoadingTraders] = useState(false)
  const [loadingTraderPins, setLoadingTraderPins] = useState(false)
  // Trade form
  const [wantPins, setWantPins] = useState([])   // pins from the other trader
  const [offerPins, setOfferPins] = useState([]) // own trader pins to offer
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState('')
  const [sendErr, setSendErr] = useState('')

  const myTraderPins = pins.filter(p => p.is_trader)

  useEffect(() => { fetchTraders() }, [])

  async function fetchTraders() {
    setLoadingTraders(true)
    const { data } = await supabase
      .from('trader_directory')
      .select('id, display_name, trading_enabled')
      .eq('trading_enabled', true)
      .neq('id', user.id)
    setTraders(data || [])
    setLoadingTraders(false)
  }

  async function selectTrader(trader) {
    setSelectedTrader(trader)
    setWantPins([]); setOfferPins([]); setComment(''); setSendMsg(''); setSendErr('')
    setLoadingTraderPins(true)
    const { data } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', trader.id)
      .eq('is_trader', true)
    setTraderPins(data || [])
    setLoadingTraderPins(false)
    setView('trade_form')
  }

  async function sendTradeRequest() {
    setSendErr('')
    if (!selectedTrader) { setSendErr('Please select a trader.'); return }
    if (wantPins.length === 0) { setSendErr('Select at least 1 pin you want.'); return }
    if (offerPins.length === 0) { setSendErr('Select at least 1 pin to offer.'); return }
    setSending(true)
    try {
      const { error } = await supabase.from('trade_requests').insert([{
        from_user_id: user.id,
        to_user_id: selectedTrader.id,
        want_pin_ids: wantPins,
        offer_pin_ids: offerPins,
        comment: comment.trim() || null,
        status: 'pending',
      }])
      if (error) throw error
      setSendMsg('✅ Trade request sent!')
      setTimeout(() => { setView('browse'); setSelectedTrader(null); setWantPins([]); setOfferPins([]); setComment(''); setSendMsg('') }, 2000)
    } catch(e) { setSendErr(e.message) }
    setSending(false)
  }

  function toggleWant(id) { setWantPins(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]) }
  function toggleOffer(id) { setOfferPins(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]) }

  const filteredTraders = traders.filter(t =>
    (t.display_name||'').toLowerCase().includes(search.toLowerCase())
  )

  // ── Not subscribed ──
  if (!hasAccess) return (
    <div className="fade-up" style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:54, marginBottom:16 }}>🤝</div>
      <div style={{ fontSize:20, fontWeight:'bold', color:'#f9fafb', marginBottom:8 }}>Pin Trading</div>
      <div style={{ fontSize:13, color:'#94a3b8', marginBottom:24, lineHeight:1.6 }}>
        Trade pins with collectors worldwide.<br/>Upgrade to Castle Pass to participate.
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
        <button onClick={() => onUpgrade('monthly')}
          style={{ padding:'10px 20px', borderRadius:10, border:'1px solid rgba(124,58,237,0.5)', background:'rgba(124,58,237,0.3)', color:'#e2d9f3', cursor:'pointer', fontSize:13, fontWeight:'bold' }}>
          $4.99/mo
        </button>
        <button onClick={() => onUpgrade('annual')}
          style={{ padding:'10px 20px', borderRadius:10, border:'1px solid rgba(219,39,119,0.5)', background:'rgba(219,39,119,0.3)', color:'#fce7f3', cursor:'pointer', fontSize:13, fontWeight:'bold' }}>
          $44.99/yr 🔥
        </button>
      </div>
    </div>
  )

  // ── Trading not enabled ──
  if (!profile?.trading_enabled) return (
    <div className="fade-up" style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:54, marginBottom:16 }}>🤝</div>
      <div style={{ fontSize:20, fontWeight:'bold', color:'#f9fafb', marginBottom:8 }}>Pin Trading</div>
      <div style={{ fontSize:13, color:'#94a3b8', marginBottom:8, lineHeight:1.6 }}>
        To participate in trading, you need to enable it in your profile.
      </div>
      <div style={{ fontSize:11, color:'#64748b', marginBottom:24, lineHeight:1.6, maxWidth:320, margin:'0 auto 24px' }}>
        Your email (<span style={{color:'#a78bfa'}}>{user.email}</span>) may be shared with trade partners so they can contact you. See our{' '}
        <button onClick={() => onLegal && onLegal('privacy')} style={{ background:'none', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:11, padding:0, textDecoration:'underline' }}>Privacy Policy</button>.
      </div>
      <button onClick={() => onUpdateProfile({ trading_enabled: true })}
        style={{ padding:'12px 28px', borderRadius:12, border:'1px solid rgba(16,185,129,0.4)', background:'rgba(16,185,129,0.2)', color:'#34d399', cursor:'pointer', fontSize:14, fontWeight:'bold' }}>
        ✅ Enable Pin Trading
      </button>
    </div>
  )

  // ── No trader pins ──
  if (myTraderPins.length === 0 && view !== 'trade_form') return (
    <div className="fade-up" style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:54, marginBottom:16 }}>📌</div>
      <div style={{ fontSize:20, fontWeight:'bold', color:'#f9fafb', marginBottom:8 }}>No Trader Pins Yet</div>
      <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6 }}>
        Mark pins as traders using the 🤝 button on your Collection page to add them to your traders list.
      </div>
    </div>
  )

  // ── Trade form ──
  if (view === 'trade_form' && selectedTrader) return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={() => { setView('browse'); setSelectedTrader(null) }}
          style={{ background:'none', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div className="page-title" style={{ marginBottom:0 }}>🤝 New Trade Request</div>
      </div>

      {/* Trader info */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:14, padding:'14px', marginBottom:20 }}>
        <div style={{ fontSize:11, color:'#a78bfa', fontWeight:'bold', marginBottom:4 }}>TRADING WITH</div>
        <div style={{ color:'#f1f5f9', fontWeight:'bold' }}>{selectedTrader.display_name || 'Pin Trader'}</div>
      </div>

      {/* Pins to receive */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:'bold', color:'#a78bfa', marginBottom:10, letterSpacing:.5 }}>
          PINS I WANT ({wantPins.length} selected)
        </div>
        {loadingTraderPins ? (
          <div style={{ color:'#64748b', fontSize:13 }}>Loading their pins...</div>
        ) : traderPins.length === 0 ? (
          <div style={{ color:'#64748b', fontSize:13 }}>This trader has no trader pins listed.</div>
        ) : (
          <div className="pin-grid">
            {traderPins.map(pin => (
              <div key={pin.id} onClick={() => toggleWant(pin.id)}
                style={{ background: wantPins.includes(pin.id) ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border:`1px solid ${wantPins.includes(pin.id)?'rgba(16,185,129,0.5)':'rgba(255,255,255,0.09)'}`, borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'all .2s' }}>
                <div style={{ height:80, background:COLORS[hashCode(pin.id)%COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
                  {pin.image_url ? <img src={pin.image_url} alt={pin.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:24, opacity:.6 }}>📌</span>}
                  {wantPins.includes(pin.id) && <div style={{ position:'absolute', top:4, right:4, background:'rgba(16,185,129,0.9)', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✓</div>}
                </div>
                <div style={{ padding:'6px 8px' }}>
                  <div className="card-name" style={{ fontSize:11 }}>{pin.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pins to offer */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:'bold', color:'#db2777', marginBottom:10, letterSpacing:.5 }}>
          PINS I OFFER ({offerPins.length} selected)
        </div>
        {myTraderPins.length === 0 ? (
          <div style={{ color:'#64748b', fontSize:13 }}>You have no trader pins. Mark pins as traders from your Collection.</div>
        ) : (
          <div className="pin-grid">
            {myTraderPins.map(pin => (
              <div key={pin.id} onClick={() => toggleOffer(pin.id)}
                style={{ background: offerPins.includes(pin.id) ? 'rgba(219,39,119,0.15)' : 'rgba(255,255,255,0.04)', border:`1px solid ${offerPins.includes(pin.id)?'rgba(219,39,119,0.5)':'rgba(255,255,255,0.09)'}`, borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'all .2s' }}>
                <div style={{ height:80, background:COLORS[hashCode(pin.id)%COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
                  {pin.image_url ? <img src={pin.image_url} alt={pin.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:24, opacity:.6 }}>📌</span>}
                  {offerPins.includes(pin.id) && <div style={{ position:'absolute', top:4, right:4, background:'rgba(219,39,119,0.9)', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✓</div>}
                </div>
                <div style={{ padding:'6px 8px' }}>
                  <div className="card-name" style={{ fontSize:11 }}>{pin.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:'bold', color:'#a78bfa', marginBottom:8, letterSpacing:.5 }}>COMMENT (optional)</div>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Add a message to your trade request..."
          style={{ width:'100%', minHeight:80, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'10px 12px', color:'#f1f5f9', fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
      </div>

      {sendErr && <div style={{ color:'#f87171', fontSize:13, marginBottom:12 }}>⚠️ {sendErr}</div>}
      {sendMsg && <div style={{ color:'#34d399', fontSize:13, marginBottom:12 }}>{sendMsg}</div>}

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={sendTradeRequest} disabled={sending}
          style={{ flex:1, padding:'14px', borderRadius:12, border:'none', background:sending?'rgba(16,185,129,0.3)':'linear-gradient(135deg,#059669,#0891b2)', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:'bold' }}>
          {sending ? '⏳ Sending...' : '🤝 Send Trade Request'}
        </button>
        <button onClick={() => { setView('browse'); setSelectedTrader(null) }}
          style={{ padding:'14px 20px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:14, fontWeight:'bold' }}>
          Cancel
        </button>
      </div>
    </div>
  )

  // ── Browse traders ──
  return (
    <div className="fade-up">
      <div className="page-title">🤝 Pin Trading</div>
      <div style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>
        Your trader pins: <span style={{ color:'#34d399', fontWeight:'bold' }}>{myTraderPins.length}</span>
      </div>

      <input className="search-bar" placeholder="🔍 Search traders by name..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {loadingTraders ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'#64748b' }}>Loading traders...</div>
      ) : filteredTraders.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontSize:40, marginBottom:12, opacity:.4 }}>🤝</div>
          <div style={{ color:'#64748b', fontSize:14 }}>{search ? 'No traders match your search.' : 'No other traders yet — invite friends!'}</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filteredTraders.map(trader => (
            <div key={trader.id}
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:'bold', color:'#fff', flexShrink:0 }}>
                  {(trader.display_name||'?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ color:'#f1f5f9', fontWeight:'bold', fontSize:14 }}>{trader.display_name || 'Pin Trader'}</div>
                  <div style={{ color:'#64748b', fontSize:11, marginTop:2 }}>🤝 Active trader</div>
                </div>
              </div>
              <button onClick={() => selectTrader(trader)}
                style={{ padding:'8px 16px', borderRadius:10, border:'1px solid rgba(124,58,237,0.4)', background:'rgba(124,58,237,0.2)', color:'#c4b5fd', cursor:'pointer', fontSize:12, fontWeight:'bold', whiteSpace:'nowrap' }}>
                Trade →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Preloaded Pin Checklists ────────────────────────────────────────────────
// Image lives in /public — reference by root-relative path so Vercel serves it statically
const CHECKLISTS = [
  {
    id: 'hd-2026-wavea',
    title: 'Hidden Disney 2026 Wave A',
    image: '/pinbooks/2026-wavea.jpg',
    pins: [
      // Series 1: Ear Headbands (7 columns)
      { id:'s1-1', name:'Enchanted Tiki Birds', top:12.4, left:0,        width:14.28, height:12.5 },
      { id:'s1-2', name:'Mad Tea Party',        top:12.4, left:14.28,   width:14.28, height:12.5 },
      { id:'s1-3', name:'Pain & Panic',         top:12.4, left:28.56,   width:14.28, height:12.5 },
      { id:'s1-4', name:'Evil Queen',           top:12.4, left:42.84,   width:14.28, height:12.5 },
      { id:'s1-5', name:'Snow White',           top:12.4, left:57.12,   width:14.28, height:12.5 },
      { id:'s1-6', name:'Chaser: Sleeping Beauty', top:12.4, left:71.4, width:14.28, height:12.5 },
      { id:'s1-7', name:'Super Chaser: Madame Leota', top:12.4, left:85.68, width:14.28, height:12.5 },
      // Series 2: Film Anniversaries (6 columns)
      { id:'s2-1', name:'Pongo',        top:27.4, left:0,     width:16.67, height:9.8 },
      { id:'s2-2', name:'Mater',        top:27.4, left:16.67, width:16.67, height:9.8 },
      { id:'s2-3', name:'Nick Wilde',   top:27.4, left:33.34, width:16.67, height:9.8 },
      { id:'s2-4', name:'Dory',         top:27.4, left:50.01, width:16.67, height:9.8 },
      { id:'s2-5', name:'Milo',         top:27.4, left:66.68, width:16.67, height:9.8 },
      { id:'s2-6', name:'Chaser: Sisu', top:27.4, left:83.35, width:16.67, height:9.8 },
      // Series 3: Castles (6 columns)
      { id:'s3-1', name:"it's a small world",  top:39.7, left:0,     width:16.67, height:12.0 },
      { id:'s3-2', name:'Matterhorn Bobsleds', top:39.7, left:16.67, width:16.67, height:12.0 },
      { id:'s3-3', name:'101 Dalmatians',      top:39.7, left:33.34, width:16.67, height:12.0 },
      { id:'s3-4', name:'Peter Pan',           top:39.7, left:50.01, width:16.67, height:12.0 },
      { id:'s3-5', name:"Disney's Grand Californian Hotel & Spa", top:39.7, left:66.68, width:16.67, height:12.0 },
      { id:'s3-6', name:'Chaser: Pixar Place Hotel', top:39.7, left:83.35, width:16.67, height:12.0 },
      // Series 4: Disney Buses (6 columns)
      { id:'s4-1', name:'Winnie-the-Pooh',        top:54.2, left:0,     width:16.67, height:12.8 },
      { id:'s4-2', name:'Marie',                  top:54.2, left:16.67, width:16.67, height:12.8 },
      { id:'s4-3', name:'Dumbo',                  top:54.2, left:33.34, width:16.67, height:12.8 },
      { id:'s4-4', name:'Cheshire Cat',            top:54.2, left:50.01, width:16.67, height:12.8 },
      { id:'s4-5', name:'Ariel',                  top:54.2, left:66.68, width:16.67, height:12.8 },
      { id:'s4-6', name:'Chaser: Queen of Hearts', top:54.2, left:83.35, width:16.67, height:12.8 },
      // Series 5: Cupcakes (6 columns)
      { id:'s5-1', name:'Donald',            top:69.5, left:0,     width:16.67, height:12.8 },
      { id:'s5-2', name:'Minnie Mouse',      top:69.5, left:16.67, width:16.67, height:12.8 },
      { id:'s5-3', name:'Pluto',             top:69.5, left:33.34, width:16.67, height:12.8 },
      { id:'s5-4', name:'Dale',              top:69.5, left:50.01, width:16.67, height:12.8 },
      { id:'s5-5', name:'Angel',             top:69.5, left:66.68, width:16.67, height:12.8 },
      { id:'s5-6', name:'Chaser: Tiki Bird', top:69.5, left:83.35, width:16.67, height:12.8 },
      // Series 6: Holiday (6 columns)
      { id:'s6-1', name:'Summer',             top:84.8, left:0,     width:16.67, height:12.2 },
      { id:'s6-2', name:'Winter',             top:84.8, left:16.67, width:16.67, height:12.2 },
      { id:'s6-3', name:'Easter',             top:84.8, left:33.34, width:16.67, height:12.2 },
      { id:'s6-4', name:'Thanksgiving',       top:84.8, left:50.01, width:16.67, height:12.2 },
      { id:'s6-5', name:'Halloween',          top:84.8, left:66.68, width:16.67, height:12.2 },
      { id:'s6-6', name:'Chaser: Christmas',  top:84.8, left:83.35, width:16.67, height:12.2 },
    ]
  }
]

function PinChecklistViewer({ checklist, userId, onBack }) {
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('checklist_progress').select('progress').eq('user_id', userId).eq('checklist_id', checklist.id).maybeSingle()
      setProgress(data?.progress || {})
      setLoading(false)
    }
    load()
  }, [checklist.id, userId])

  async function saveProgress(next) {
    setProgress(next)
    await supabase.from('checklist_progress').upsert({
      user_id: userId, checklist_id: checklist.id, progress: next, updated_at: new Date().toISOString()
    })
  }

  function cycleStatus(pinId) {
    const current = progress[pinId]
    const next = current === undefined ? 'found' : current === 'found' ? 'missing' : undefined
    const updated = { ...progress }
    if (next === undefined) delete updated[pinId]
    else updated[pinId] = next
    saveProgress(updated)
  }

  const foundCount = Object.values(progress).filter(v => v === 'found').length
  const total = checklist.pins.length

  if (loading) return <div style={{ textAlign:'center', color:'#64748b', padding:30 }}>Loading checklist...</div>

  return (
    <div style={{ padding:'8px 0' }}>
      <button onClick={onBack} style={{ background:'none', border:'none', color:'#c4b5fd', fontSize:13, cursor:'pointer', marginBottom:10, padding:0 }}>← Back to checklists</button>
      <div style={{ fontSize:16, fontWeight:'bold', color:'#f1f5f9', marginBottom:4 }}>{checklist.title}</div>
      <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>{foundCount} / {total} found</div>
      <div style={{ fontSize:11, color:'#64748b', marginBottom:14 }}>Tap a pin: first tap = ✅ found, second tap = ❌ missing, third tap = clear</div>

      <div style={{ position:'relative', width:'100%', lineHeight:0, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
        <img src={checklist.image} alt={checklist.title} style={{ width:'100%', height:'auto', display:'block' }} />
        {checklist.pins.map(pin => {
          const status = progress[pin.id]
          return (
            <button
              key={pin.id}
              onClick={() => cycleStatus(pin.id)}
              title={pin.name}
              style={{
                position:'absolute',
                top: `${pin.top}%`, left: `${pin.left}%`,
                width: `${pin.width}%`, height: `${pin.height}%`,
                background: status === 'found' ? 'rgba(52,211,153,0.28)' : status === 'missing' ? 'rgba(248,113,113,0.28)' : 'transparent',
                border: status ? '2px solid ' + (status==='found' ? '#34d399' : '#f87171') : '2px solid transparent',
                borderRadius:8, cursor:'pointer', padding:0
              }}
            >
              {status && (
                <span style={{
                  position:'absolute', top:2, right:2, fontSize:16,
                  background: status==='found' ? '#34d399' : '#f87171',
                  color:'#0b0f1a', borderRadius:'50%', width:20, height:20,
                  display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'
                }}>
                  {status === 'found' ? '✓' : '✕'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PinChecklistsPage({ userId }) {
  const [selected, setSelected] = useState(null)
  const [dbChecklists, setDbChecklists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('pin_checklists').select('*').order('created_at', { ascending:false })
      setDbChecklists((data || []).map(c => ({ id:c.id, title:c.title, image:c.image_url, pins:c.pins || [] })))
      setLoading(false)
    }
    load()
  }, [])

  const allChecklists = [...CHECKLISTS, ...dbChecklists]

  if (selected) {
    return <PinChecklistViewer checklist={selected} userId={userId} onBack={() => setSelected(null)} />
  }

  return (
    <div style={{ padding:'8px 0' }}>
      <div style={{ fontSize:16, fontWeight:'bold', color:'#f1f5f9', marginBottom:4 }}>📖 Series Checklists</div>
      <div style={{ fontSize:12, color:'#94a3b8', marginBottom:14 }}>Tap a checklist, then tap each pin as you find it.</div>
      {loading ? (
        <div style={{ color:'#64748b', fontSize:12 }}>Loading...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {allChecklists.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              style={{ display:'flex', gap:12, alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:12, cursor:'pointer', textAlign:'left' }}>
              <img src={c.image} alt={c.title} style={{ width:56, height:56, borderRadius:8, objectFit:'cover' }} />
              <div>
                <div style={{ fontSize:14, fontWeight:'bold', color:'#f1f5f9' }}>{c.title}</div>
                <div style={{ fontSize:11, color:'#64748b' }}>{c.pins.length} pins</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pin database: search, add-from-database, and pin detail ──────────────────
const DB_CHIP = active => ({ padding:'7px 12px', borderRadius:10, border:`1px solid ${active?'rgba(124,58,237,0.7)':'rgba(255,255,255,0.15)'}`, background:active?'rgba(124,58,237,0.3)':'transparent', color:active?'#e2d9f3':'#94a3b8', fontSize:12, cursor:'pointer', fontWeight:'bold' })
const DB_PRIMARY = { padding:'10px 16px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#7c3aed,#db2777)', color:'#fff', fontSize:13, fontWeight:'bold', cursor:'pointer' }

function dbFacts(e) {
  return [['Series', e.series], ['Park', e.park], ['Release year', e.release_year], ['Edition size', e.edition_size],
    ['Estimated value', e.estimated_value != null ? `$${e.estimated_value}` : null]].filter(([, v]) => v)
}

// Search box + results from the approved pin database
function DatabaseSearch({ onSelect, autoFocus }) {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      let query = supabase.from('pin_database').select('*').eq('status', 'approved').order('name').limit(30)
      const term = q.trim().replace(/[,()]/g, ' ').replace(/[\\%_]/g, m => '\\' + m)
      if (term) query = query.or(`name.ilike.%${term}%,series.ilike.%${term}%`)
      const { data } = await query
      setRows(data || []); setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [q])
  return (
    <div>
      <input className="search-bar" autoFocus={autoFocus} placeholder="🔍 Search by pin name or series..." value={q} onChange={e => setQ(e.target.value)} />
      <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:340, overflowY:'auto', marginTop:8 }}>
        {loading && rows.length === 0 && <div style={{ color:'#64748b', fontSize:12, padding:8 }}>Searching...</div>}
        {!loading && rows.length === 0 && <div style={{ color:'#64748b', fontSize:12, padding:8 }}>No pins found. If it's missing, you can add it as a new pin and submit it to the database.</div>}
        {rows.map(r => (
          <button key={r.id} onClick={() => onSelect(r)} style={{ display:'flex', gap:10, alignItems:'center', textAlign:'left', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:8, cursor:'pointer' }}>
            <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'#e2e8f0', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {r.image_url ? <img src={r.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span>📌</span>}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:'bold', color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>{[r.series, r.park, r.release_year].filter(Boolean).join(' • ') || 'No details'}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Builds the pin row to save for a chosen database entry and picture choice
async function pinPayloadFromEntry(userId, entry, { imageChoice, file, list }) {
  let image_url = null, own_image_url = null, image_source = null
  if (imageChoice === 'own' && file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('pin-images').upload(path, file)
    if (error) throw error
    image_url = own_image_url = supabase.storage.from('pin-images').getPublicUrl(path).data.publicUrl
    image_source = 'own'
  } else if (entry.image_url) {
    image_url = entry.image_url; image_source = 'database'
  }
  return {
    name: entry.name, series: entry.series || '', description: entry.description || '',
    estimated_value: entry.estimated_value ?? null, image_url, own_image_url, image_source,
    database_id: entry.id, list
  }
}

// Pick a pin from the database, choose picture (database or your own), then add it
function DatabaseAddPanel({ userId, onConfirm, onCancel, defaultList = 'have', showList = true }) {
  const [entry, setEntry] = useState(null)
  const [imageChoice, setImageChoice] = useState('database')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [list, setList] = useState(defaultList)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function pick(e) { setEntry(e); setImageChoice(e.image_url ? 'database' : 'own'); setFile(null); setPreview(''); setError('') }
  function onFile(ev) {
    const f = ev.target.files[0]; if (!f) return
    setFile(f); const r = new FileReader(); r.onload = x => setPreview(x.target.result); r.readAsDataURL(f)
  }
  async function confirm() {
    if (imageChoice === 'own' && !file) { setError('Choose your photo, or switch to the database picture.'); return }
    setBusy(true); setError('')
    try { await onConfirm(await pinPayloadFromEntry(userId, entry, { imageChoice, file, list })) }
    catch (e) { setError(e.message || 'Could not add this pin.'); setBusy(false) }
  }

  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(124,58,237,0.35)', borderRadius:14, padding:14, marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontSize:14, fontWeight:'bold', color:'#c4b5fd' }}>🔎 Add from the pin database</div>
        <button onClick={onCancel} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:13 }}>Cancel</button>
      </div>
      {!entry ? <DatabaseSearch onSelect={pick} autoFocus /> : (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:12 }}>
            <div style={{ width:84, height:84, borderRadius:10, overflow:'hidden', background:'#e2e8f0', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {(imageChoice === 'own' && preview) ? <img src={preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : entry.image_url ? <img src={entry.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:30 }}>📌</span>}
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:'bold', color:'#f1f5f9' }}>{entry.name}</div>
              <div style={{ fontSize:12, color:'#94a3b8' }}>{dbFacts(entry).map(([, v]) => v).join(' • ')}</div>
              <button onClick={() => setEntry(null)} style={{ background:'none', border:'none', color:'#a78bfa', fontSize:12, cursor:'pointer', padding:0, marginTop:4 }}>← Choose a different pin</button>
            </div>
          </div>

          <div style={{ fontSize:12, color:'#a78bfa', fontWeight:'bold', marginBottom:6 }}>Picture</div>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <button disabled={!entry.image_url} onClick={() => setImageChoice('database')} style={{ ...DB_CHIP(imageChoice === 'database'), opacity: entry.image_url ? 1 : .4 }}>Database picture</button>
            <button onClick={() => setImageChoice('own')} style={DB_CHIP(imageChoice === 'own')}>My own picture</button>
          </div>
          {imageChoice === 'own' && (
            <label style={{ display:'block', textAlign:'center', padding:11, border:'1px dashed rgba(255,255,255,0.25)', borderRadius:10, color:'#94a3b8', cursor:'pointer', fontSize:13, marginBottom:10 }}>
              {file ? `📷 ${file.name}` : '📁 Choose or take a photo'}
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={onFile} />
            </label>
          )}

          {showList && (
            <div style={{ display:'flex', gap:8, margin:'8px 0 12px' }}>
              {[['have','🎒 My Collection'],['want','⭐ Wish List']].map(([k, l]) => <button key={k} onClick={() => setList(k)} style={{ ...DB_CHIP(list === k), flex:1 }}>{l}</button>)}
            </div>
          )}
          {error && <div style={{ color:'#f87171', fontSize:12, marginBottom:8 }}>⚠️ {error}</div>}
          <button onClick={confirm} disabled={busy} style={{ ...DB_PRIMARY, width:'100%', opacity: busy ? .6 : 1 }}>{busy ? 'Adding...' : '✨ Add this pin'}</button>
        </div>
      )}
    </div>
  )
}

// ── Pin detail: link a pin to its database record, choose its picture ────────
function PinDetailModal({ pin, userId, onClose, onPinChange }) {
  const [local, setLocal] = useState(pin)
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState(null)             // the linked database record
  const [candidate, setCandidate] = useState(null)     // possible match waiting for "yes, same pin"
  const [ownSubmission, setOwnSubmission] = useState(null)
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  async function patch(p) {
    const { error } = await supabase.from('pins').update(p).eq('id', local.id)
    if (error) { setMsg('Could not save: ' + error.message); return false }
    setLocal(prev => ({ ...prev, ...p })); onPinChange && onPinChange(local.id, p)
    return true
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (local.database_id) {
        const { data } = await supabase.from('pin_database').select('*').eq('id', local.database_id).maybeSingle()
        if (cancelled) return
        if (data) { setEntry(data); setLoading(false); return }
      }
      const name = (local.name || '').trim()
      if (name) {
        const esc = name.replace(/[\\%_]/g, m => '\\' + m)
        const { data } = await supabase.from('pin_database').select('*').ilike('name', esc).limit(20)
        if (cancelled) return
        const rows = data || []
        const sameSeries = r => (r.series || '').toLowerCase() === (local.series || '').trim().toLowerCase()
        const approved = rows.filter(r => r.status === 'approved')
        setCandidate(approved.find(sameSeries) || approved[0] || null)
        setOwnSubmission(rows.find(r => r.submitted_by === userId && r.status !== 'rejected') || null)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  async function link(e) {
    setBusy(true); setMsg('')
    const p = { database_id: e.id }
    if (local.image_url && local.image_source !== 'database') { p.own_image_url = local.own_image_url || local.image_url; p.image_source = 'own' }
    else if (!local.image_url && e.image_url) { p.image_url = e.image_url; p.image_source = 'database' }
    if (await patch(p)) { setEntry(e); setCandidate(null); setSearching(false) }
    setBusy(false)
  }
  async function unlink() {
    if (!window.confirm('Unlink this pin from the database record? It will no longer be allowed in pin books until you link it again.')) return
    if (await patch({ database_id: null })) { setEntry(null); setCandidate(null) }
  }
  async function submitToDatabase() {
    setBusy(true); setMsg('')
    const image = local.own_image_url || local.image_url
    const { data, error } = await supabase.from('pin_database').insert([{
      name: (local.name || '').trim(), series: (local.series || '').trim() || null, description: (local.description || '').trim() || null,
      image_url: image && !image.includes('/multiscan-') ? image : null, status: 'pending', submitted_by: userId
    }]).select().single()
    if (error) { setMsg('Could not submit: ' + error.message); setBusy(false); return }
    await link(data)
    setMsg('Submitted for review. You can add this pin to books now; the database record is marked pending until it is approved.')
    setBusy(false)
  }

  async function usePicture(which) {
    setMsg('')
    if (which === 'database') {
      if (!entry?.image_url) return
      const p = { image_url: entry.image_url, image_source: 'database' }
      if (local.image_source !== 'database' && local.image_url) p.own_image_url = local.own_image_url || local.image_url
      await patch(p)
    } else if (local.own_image_url) {
      await patch({ image_url: local.own_image_url, image_source: 'own' })
    } else fileRef.current?.click()
  }
  async function onOwnFile(ev) {
    const f = ev.target.files[0]; if (!f) return
    setBusy(true)
    try {
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('pin-images').upload(path, f)
      if (error) throw error
      const url = supabase.storage.from('pin-images').getPublicUrl(path).data.publicUrl
      await patch({ image_url: url, own_image_url: url, image_source: 'own' })
    } catch (e) { setMsg('Upload failed: ' + e.message) }
    setBusy(false); ev.target.value = ''
  }

  const shownName = entry?.name || local.name
  const shownImage = local.image_url || entry?.image_url
  const box = { marginTop:14, fontSize:12, borderRadius:10, padding:'8px 10px', lineHeight:1.5 }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto', background:'#1a1040', border:'1px solid rgba(124,58,237,0.4)', borderRadius:18, padding:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:12 }}>
          <div style={{ fontSize:18, fontWeight:'bold', color:'#f1f5f9' }}>{shownName}</div>
          <button onClick={onClose} aria-label="Close" style={{ background:'none', border:'none', color:'#94a3b8', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div style={{ borderRadius:12, overflow:'hidden', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', minHeight:160, maxHeight:340, marginBottom:12 }}>
          {shownImage ? <img src={shownImage} alt={shownName} style={{ maxWidth:'100%', maxHeight:340, objectFit:'contain' }} /> : <span style={{ fontSize:56, opacity:.5 }}>📌</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onOwnFile} />

        {loading ? <div style={{ color:'#64748b', fontSize:13, textAlign:'center', padding:10 }}>Looking up this pin...</div> : entry ? (
          <>
            {entry.status === 'approved'
              ? <div style={{ fontSize:11, color:'#34d399', fontWeight:'bold', marginBottom:8 }}>✓ Linked to the CastlePins pin database</div>
              : <div style={{ ...box, marginTop:0, marginBottom:8, color: entry.status === 'pending' ? '#fbbf24' : '#f87171', background: entry.status === 'pending' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)', border:`1px solid ${entry.status === 'pending' ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                  {entry.status === 'pending' ? 'This database record is waiting for review.' : 'This database record was not approved. You can unlink it and pick a different record.'}
                </div>}
            {dbFacts(entry).map(([k, v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.07)', fontSize:13 }}>
                <span style={{ color:'#94a3b8' }}>{k}</span><span style={{ color:'#f1f5f9', textAlign:'right' }}>{String(v)}</span>
              </div>
            ))}
            {entry.description && <div style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.6, marginTop:12 }}>{entry.description}</div>}
            {entry.source_link && /^https?:\/\//.test(entry.source_link) && <a href={entry.source_link} target="_blank" rel="noopener noreferrer" style={{ display:'inline-block', marginTop:12, fontSize:12, color:'#a78bfa' }}>More info ↗</a>}

            <div style={{ fontSize:12, color:'#a78bfa', fontWeight:'bold', margin:'16px 0 6px' }}>Picture for my pin</div>
            <div style={{ display:'flex', gap:8 }}>
              <button disabled={!entry.image_url || busy} onClick={() => usePicture('database')} style={{ ...DB_CHIP(local.image_source === 'database'), opacity: entry.image_url ? 1 : .4 }}>Database picture</button>
              <button disabled={busy} onClick={() => usePicture('own')} style={DB_CHIP(local.image_source === 'own')}>{local.own_image_url ? 'My picture' : 'Add my picture'}</button>
            </div>
            <button onClick={unlink} style={{ background:'none', border:'none', color:'#64748b', fontSize:11, textDecoration:'underline', cursor:'pointer', marginTop:16, padding:0 }}>Unlink from database record</button>
          </>
        ) : candidate && !searching ? (
          <div style={{ border:'1px solid rgba(124,58,237,0.5)', background:'rgba(124,58,237,0.1)', borderRadius:12, padding:12 }}>
            <div style={{ fontSize:13, fontWeight:'bold', color:'#e2d9f3', marginBottom:8 }}>Is this the same pin?</div>
            <div style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div style={{ width:72, height:72, borderRadius:8, overflow:'hidden', background:'#e2e8f0', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {candidate.image_url ? <img src={candidate.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:26 }}>📌</span>}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:'bold', color:'#f1f5f9' }}>{candidate.name}</div>
                <div style={{ fontSize:12, color:'#94a3b8' }}>{dbFacts(candidate).map(([, v]) => v).join(' • ') || 'No other details'}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button disabled={busy} onClick={() => link(candidate)} style={{ ...DB_PRIMARY, flex:1 }}>Yes, link it</button>
              <button disabled={busy} onClick={() => setCandidate(null)} style={{ ...DB_CHIP(false), flex:1 }}>No, different pin</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:12, color:'#fbbf24', marginBottom:8 }}>This pin isn't linked to the pin database yet. Pins must be linked before they can go in a book.</div>
            {local.series && <div style={{ fontSize:13, color:'#cbd5e1', marginBottom:6 }}>Series: {local.series}</div>}
            {local.description && <div style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.6 }}>{local.description}</div>}
            {searching ? (
              <div style={{ marginTop:12 }}>
                <DatabaseSearch onSelect={e => { setCandidate(e); setSearching(false) }} autoFocus />
                <button onClick={() => setSearching(false)} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:12, cursor:'pointer', marginTop:8, padding:0 }}>Cancel search</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
                <button onClick={() => setSearching(true)} style={{ ...DB_CHIP(false), padding:'10px' }}>🔎 Search the database for this pin</button>
                {ownSubmission ? (
                  <button disabled={busy} onClick={() => link(ownSubmission)} style={DB_PRIMARY}>Link to my pending submission</button>
                ) : (
                  <button disabled={busy} onClick={submitToDatabase} style={{ ...DB_PRIMARY, opacity: busy ? .6 : 1 }}>{busy ? 'Submitting...' : '📤 Submit to pin database'}</button>
                )}
                <div style={{ fontSize:11, color:'#64748b', lineHeight:1.5 }}>New database entries are reviewed before they go live.</div>
              </div>
            )}
          </>
        )}
        {msg && <div style={{ ...box, color:'#fbbf24', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.3)' }}>{msg}</div>}
      </div>
    </div>
  )
}

function BooksPage({ books, pins, onAddBook, onDeleteBook, onAssignPin, onUpdateBook, onAddFromDatabase, onPinChange, hasAccess, onUpgrade, userId }) {
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🏰')
  const [newPublic, setNewPublic] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [detailPin, setDetailPin] = useState(null)
  const [dbOpen, setDbOpen] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [selectedPins, setSelectedPins] = useState([])
  const [mode, setMode] = useState('view') // 'view' | 'add' | 'remove'
  const storageKeyBooks = `castlepins_showdesc_books_${userId}`
  const [showDesc, setShowDesc] = useState(() => {
    const saved = localStorage.getItem(storageKeyBooks)
    return saved === null ? false : saved === 'true' // default OFF in books
  })
  function toggleDescBooks() {
    setShowDesc(v => {
      localStorage.setItem(storageKeyBooks, String(!v))
      return !v
    })
  }

  const FREE_BOOK_LIMIT = 3

  async function handleAdd() {
    if (!newName.trim()) return
    if (!hasAccess && books.length >= FREE_BOOK_LIMIT) {
      alert('Free accounts can have up to 3 pin books. Upgrade to Castle Pass for unlimited books!')
      return
    }
    setAdding(true)
    await onAddBook({ name: newName.trim(), emoji: newIcon, is_public: newPublic })
    setNewName(''); setNewIcon('🏰'); setNewPublic(true); setShowIconPicker(false)
    setAdding(false)
  }

  function togglePin(id) {
    setSelectedPins(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  async function applyBulk() {
    const book = books.find(b => b.id === selectedBook)
    if (!book) return
    for (const pid of selectedPins) {
      await onAssignPin(pid, book.id, mode === 'remove')
    }
    setSelectedPins([]); setMode('view')
  }

  // ── Book detail view ──
  if (selectedBook) {
    const book = books.find(b => b.id === selectedBook)
    if (!book) { setSelectedBook(null); return null }
    const bookPins = pins.filter(p => (p.book_ids||[]).includes(book.id))
    // Only pins linked to a pin database record can go in a book
    const availablePins = pins.filter(p => p.database_id && !(p.book_ids||[]).includes(book.id))
    const unlinkedPins = pins.filter(p => !p.database_id)

    if (mode === 'add' || mode === 'remove') {
      const pool = mode === 'add' ? availablePins : bookPins
      return (
        <div className="fade-up">
          <button onClick={() => { setMode('view'); setSelectedPins([]); setDbOpen(false) }}
            style={{ background:'transparent', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:14, marginBottom:16, padding:0 }}>
            ← Cancel
          </button>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <div>
              <div className="page-title" style={{ fontSize:17 }}>{mode==='add' ? '＋ Add Pins' : '− Remove Pins'}</div>
              <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>Tap pins to {mode==='add'?'select':'deselect'} • {selectedPins.length} selected</div>
            </div>
            <button onClick={applyBulk} disabled={selectedPins.length===0}
              style={{ padding:'10px 20px', border:'none', borderRadius:10, background: selectedPins.length===0 ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg,#7c3aed,#db2777)', color:'#fff', cursor: selectedPins.length===0 ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:'bold' }}>
              {mode==='add' ? `＋ Add ${selectedPins.length}` : `− Remove ${selectedPins.length}`}
            </button>
          </div>
          {mode==='add' && !dbOpen && (
            <button onClick={() => setDbOpen(true)} style={{ width:'100%', padding:'12px', marginBottom:14, border:'1px solid rgba(124,58,237,0.5)', borderRadius:12, background:'rgba(124,58,237,0.18)', color:'#e2d9f3', cursor:'pointer', fontSize:14, fontWeight:'bold' }}>
              🔎 Add a pin from the pin database
            </button>
          )}
          {mode==='add' && dbOpen ? (
            <DatabaseAddPanel userId={userId} onCancel={() => setDbOpen(false)}
              onConfirm={async payload => { await onAddFromDatabase(payload, book.id); setDbOpen(false); setMode('view') }} />
          ) : pool.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#64748b', fontSize:13, lineHeight:1.6 }}>
              {mode==='add' ? 'No linked pins available. Add one from the pin database above, or link your existing pins below.' : 'No pins in this book yet.'}
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <button onClick={() => setSelectedPins(pool.map(p=>p.id))}
                  style={{ padding:'7px 14px', border:'1px solid rgba(124,58,237,0.4)', borderRadius:8, background:'rgba(124,58,237,0.15)', color:'#c4b5fd', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                  Select All
                </button>
                <button onClick={() => setSelectedPins([])}
                  style={{ padding:'7px 14px', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                  Clear
                </button>
              </div>
              <div className="pin-grid">
                {pool.map(pin => (
                  <SelectablePinCard key={pin.id} pin={pin} selected={selectedPins.includes(pin.id)} onToggle={togglePin} />
                ))}
              </div>
            </>
          )}
          {mode==='add' && !dbOpen && unlinkedPins.length > 0 && (
            <div style={{ marginTop:22 }}>
              <div style={{ fontSize:13, fontWeight:'bold', color:'#fbbf24', marginBottom:4 }}>Not linked to the database yet ({unlinkedPins.length})</div>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:10 }}>Tap a pin to link it to its database record or submit it. Then it can go in a book.</div>
              <div className="pin-grid">
                {unlinkedPins.map(pin => (
                  <div key={pin.id} onClick={() => setDetailPin(pin)} style={{ opacity:.6, cursor:'pointer', background:'rgba(255,255,255,0.04)', border:'1px dashed rgba(251,191,36,0.4)', borderRadius:14, overflow:'hidden' }}>
                    <div style={{ width:'100%', height:80, background:COLORS[hashCode(pin.id)%COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                      {pin.image_url ? <img src={pin.image_url} alt={pin.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} /> : <span style={{ fontSize:24, opacity:.65 }}>📌</span>}
                    </div>
                    <div style={{ padding:'6px 8px' }}><div className="card-name">{pin.name}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {detailPin && <PinDetailModal pin={detailPin} userId={userId} onPinChange={onPinChange} onClose={() => setDetailPin(null)} />}
        </div>
      )
    }

    // Normal book view
    return (
      <div className="fade-up">
        <button onClick={() => setSelectedBook(null)}
          style={{ background:'transparent', border:'none', color:'#a78bfa', cursor:'pointer', fontSize:14, marginBottom:16, padding:0 }}>
          ← Back to Books
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:32 }}>{book.emoji}</span>
          <div className="page-title">{book.name}</div>
          {/* Public/Private toggle */}
          <button onClick={() => onUpdateBook(book.id, { is_public: !book.is_public })}
            style={{ marginLeft:'auto', padding:'5px 12px', border:`1px solid ${book.is_public ? 'rgba(5,150,105,0.5)' : 'rgba(255,255,255,0.15)'}`, borderRadius:20, background: book.is_public ? 'rgba(5,150,105,0.15)' : 'rgba(255,255,255,0.05)', color: book.is_public ? '#34d399' : '#64748b', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            {book.is_public ? '🌐 Public' : '🔒 Private'}
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          <div style={{ background:'rgba(124,58,237,0.3)', border:'1px solid rgba(124,58,237,0.5)', borderRadius:20, padding:'3px 14px', fontSize:12, color:'#c4b5fd' }}>
            {bookPins.length} pin{bookPins.length!==1?'s':''}
          </div>
          <div style={{ fontSize:11, color: book.is_public ? '#34d399' : '#64748b' }}>
            {book.is_public ? (TRADING_ENABLED ? '🌐 Visible to other traders' : '🌐 Public') : '🔒 Only you can see this'}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          <button onClick={() => { setMode('add'); setSelectedPins([]) }}
            style={{ padding:'9px 16px', border:'1px solid rgba(124,58,237,0.4)', borderRadius:10, background:'rgba(124,58,237,0.15)', color:'#c4b5fd', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            ＋ Add Pins
          </button>
          {bookPins.length > 0 && (
            <button onClick={() => { setMode('remove'); setSelectedPins([]) }}
              style={{ padding:'9px 16px', border:'1px solid rgba(255,99,99,0.3)', borderRadius:10, background:'rgba(220,38,38,0.1)', color:'#f87171', cursor:'pointer', fontSize:13, fontWeight:600 }}>
              − Remove Pins
            </button>
          )}
        </div>

        {bookPins.length > 0 && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
            <button onClick={toggleDescBooks}
              style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'5px 10px', color: showDesc ? '#a78bfa' : '#64748b', cursor:'pointer', fontSize:11, fontWeight:600 }}>
              {showDesc ? '📝 Hide Desc' : '📝 Show Desc'}
            </button>
          </div>
        )}
        {bookPins.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#64748b' }}>
            <div style={{ fontSize:40, marginBottom:10, opacity:.4 }}>{book.emoji}</div>
            No pins yet — tap <strong style={{color:'#a78bfa'}}>＋ Add Pins</strong> to get started!
          </div>
        ) : (
          <div className="pin-grid">
            {bookPins.map(pin => (
              <div key={pin.id} onClick={() => setDetailPin(pin)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:14, overflow:'hidden', cursor:'pointer' }}>
                <div style={{ width:'100%', height:110, background:COLORS[hashCode(pin.id)%COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  {pin.image_url
                    ? <img src={pin.image_url} alt={pin.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                    : <span style={{ fontSize:28, opacity:.65 }}>📌</span>}
                </div>
                <div style={{ padding:'8px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <div className="card-name" style={{ marginBottom:0 }}>{pin.name}</div>
                    {TRADING_ENABLED && pin.is_trader && <span style={{ fontSize:9, fontWeight:'bold', color:'#34d399', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:4, padding:'1px 5px', flexShrink:0 }}>Trader</span>}
                  </div>
                  {pin.series && <div className="card-series">{pin.series}</div>}
                  {showDesc && pin.description && <div className="card-desc">{pin.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {detailPin && <PinDetailModal pin={detailPin} userId={userId} onPinChange={onPinChange} onClose={() => setDetailPin(null)} />}
      </div>
    )
  }

  // ── Books list view ──
  return (
    <div className="fade-up">
      <div className="page-title" style={{ marginBottom:6 }}>📚 Pin Books</div>
      <div style={{ color:'#64748b', fontSize:13, marginBottom:20 }}>Organise your pins into named collections</div>

      {/* Create new book */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:'18px', marginBottom:24 }}>
        <div style={{ fontSize:12, fontWeight:'bold', color:'#a78bfa', marginBottom:10, letterSpacing:.5 }}>CREATE NEW BOOK</div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button onClick={() => setShowIconPicker(!showIconPicker)}
            style={{ width:48, height:48, borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.07)', fontSize:24, cursor:'pointer', flexShrink:0 }}>
            {newIcon}
          </button>
          <input className="field-input" style={{ marginBottom:0, flex:1 }} placeholder="Book name e.g. Star Wars, Traders..." value={newName}
            onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==='Enter' && handleAdd()} />
        </div>
        {showIconPicker && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6, marginBottom:12, padding:10, background:'rgba(0,0,0,0.3)', borderRadius:10 }}>
            {BOOK_ICONS.map(({ icon, label }) => (
              <button key={icon} onClick={() => { setNewIcon(icon); setShowIconPicker(false) }} title={label}
                style={{ height:40, borderRadius:8, border:`2px solid ${newIcon===icon?'#7c3aed':'transparent'}`, background: newIcon===icon ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)', fontSize:20, cursor:'pointer' }}>
                {icon}
              </button>
            ))}
          </div>
        )}
        {/* Public/Private toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {[{val:true, label:'🌐 Public', desc:TRADING_ENABLED ? 'Visible to traders' : 'Shareable'}, {val:false, label:'🔒 Private', desc:'Only you'}].map(opt => (
            <button key={String(opt.val)} onClick={() => setNewPublic(opt.val)}
              style={{ flex:1, padding:'10px 8px', border:`1px solid ${newPublic===opt.val ? (opt.val ? 'rgba(5,150,105,0.6)' : 'rgba(124,58,237,0.5)') : 'rgba(255,255,255,0.1)'}`, borderRadius:10, background: newPublic===opt.val ? (opt.val ? 'rgba(5,150,105,0.15)' : 'rgba(124,58,237,0.15)') : 'transparent', color: newPublic===opt.val ? (opt.val ? '#34d399' : '#c4b5fd') : '#64748b', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              <div>{opt.label}</div>
              <div style={{ fontSize:10, opacity:.7, marginTop:2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
        <button className="primary-btn" onClick={handleAdd} disabled={adding || !newName.trim()}
          style={{ background: adding||!newName.trim() ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
          {adding ? '⏳ Creating...' : '＋ Create Book'}
        </button>
      </div>

      {/* Books grid */}
      {books.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px 0', color:'#64748b' }}>
          <div style={{ fontSize:50, marginBottom:14, opacity:.4 }}>📚</div>
          No books yet — create your first one above!
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
          {books.map(book => {
            const count = pins.filter(p => (p.book_ids||[]).includes(book.id)).length
            return (
              <div key={book.id} onClick={() => { setSelectedBook(book.id); setMode('view'); setSelectedPins([]) }}
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:'18px 14px', cursor:'pointer', transition:'all .2s', position:'relative' }}
                onMouseEnter={e => e.currentTarget.style.border='1px solid rgba(124,58,237,0.5)'}
                onMouseLeave={e => e.currentTarget.style.border='1px solid rgba(255,255,255,0.09)'}>
                <div style={{ fontSize:36, marginBottom:8 }}>{book.emoji}</div>
                <div style={{ fontWeight:'bold', color:'#f1f5f9', fontSize:14, marginBottom:4 }}>{book.name}</div>
                <div style={{ fontSize:11, color:'#a78bfa', marginBottom:4 }}>{count} pin{count!==1?'s':''}</div>
                <div style={{ fontSize:10, color: book.is_public ? '#34d399' : '#64748b' }}>
                  {book.is_public ? '🌐 Public' : '🔒 Private'}
                </div>
                <button onClick={e => { e.stopPropagation(); if(window.confirm(`Delete "${book.name}"?`)) onDeleteBook(book.id) }}
                  style={{ position:'absolute', top:8, right:8, width:26, height:26, border:'none', borderRadius:6, background:'rgba(220,38,38,0.15)', color:'#f87171', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Admin: Pin Database ─────────────────────────────────────────────────────
const emptyDbForm = { id:null, name:'', series:'', park:'', release_year:'', edition_size:'', estimated_value:'', image_url:'', description:'', source_link:'' }

// ── Admin: Checklist Builder ────────────────────────────────────────────────
function AdminChecklistBuilder() {
  const [title, setTitle] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [regions, setRegions] = useState([])
  const [drawing, setDrawing] = useState(null) // { startX, startY, curX, curY } in %
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [existing, setExisting] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [drawMode, setDrawMode] = useState('row') // 'row' = draw one box per series row, auto-split + auto-name. 'pin' = draw one box per pin, name manually.
  const [nameQueue, setNameQueue] = useState([]) // flat ordered list of detected names, consumed as rows are drawn
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState('')
  const containerRef = useRef()
  const fileRef = useRef()

  async function loadExisting() {
    const { data } = await supabase.from('pin_checklists').select('*').order('created_at', { ascending:false })
    setExisting(data || [])
  }
  useEffect(() => { loadExisting() }, [])

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file); setRegions([])
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function pctFromEvent(e) {
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
  }

  function startDraw(e) {
    if (!imagePreview) return
    e.preventDefault()
    const { x, y } = pctFromEvent(e)
    setDrawing({ startX:x, startY:y, curX:x, curY:y })
  }
  function moveDraw(e) {
    if (!drawing) return
    e.preventDefault()
    const { x, y } = pctFromEvent(e)
    setDrawing(prev => ({ ...prev, curX:x, curY:y }))
  }
  function endDraw() {
    if (!drawing) return
    const left = Math.min(drawing.startX, drawing.curX)
    const top = Math.min(drawing.startY, drawing.curY)
    const width = Math.abs(drawing.curX - drawing.startX)
    const height = Math.abs(drawing.curY - drawing.startY)
    setDrawing(null)
    if (width < 1 || height < 1) return // ignore accidental clicks

    if (drawMode === 'pin') {
      const name = window.prompt('Pin name for this box:')
      if (!name || !name.trim()) return
      setRegions(prev => [...prev, { id: `p${Date.now()}`, name: name.trim(), top, left, width, height }])
      return
    }

    // Row mode: ask how many pins are in this row, split evenly, auto-name from the detected queue
    const countStr = window.prompt('How many pins are in this row?', '6')
    const count = parseInt(countStr)
    if (!countStr || isNaN(count) || count < 1) return

    const cellWidth = width / count
    const newRegions = []
    for (let i = 0; i < count; i++) {
      const suggestedName = nameQueue[i] || `Pin ${regions.length + i + 1}`
      newRegions.push({
        id: `p${Date.now()}-${i}`,
        name: suggestedName,
        top, height,
        left: left + i * cellWidth,
        width: cellWidth
      })
    }
    setRegions(prev => [...prev, ...newRegions])
    setNameQueue(prev => prev.slice(count)) // consume the names we just used
  }

  async function autoDetectNames() {
    setDetecting(true); setDetectError('')
    try {
      // Reverse/text reading needs a public URL — upload now if we haven't already
      let publicUrl = imagePreview
      if (imageFile && !publicUrl.startsWith('http')) {
        const path = `checklists/scratch-${Date.now()}-${imageFile.name.replace(/\s+/g,'_')}`
        const { error: upErr } = await supabase.storage.from('pin-images').upload(path, imageFile)
        if (upErr) throw upErr
        const { data } = supabase.storage.from('pin-images').getPublicUrl(path)
        publicUrl = data.publicUrl
      }
      const resp = await fetch('/api/detect-pin-names', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ image: publicUrl })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Detection failed')
      const flat = (data.rows || []).flatMap(r => r.names || [])
      setNameQueue(flat)
      setMsg(`Detected ${flat.length} pin names across ${data.rows?.length || 0} rows. Now draw a box around each row below.`)
    } catch (err) {
      setDetectError(err.message)
    }
    setDetecting(false)
  }

  function renameRegion(id) {
    const region = regions.find(r => r.id === id)
    const name = window.prompt('Rename pin:', region?.name || '')
    if (name === null) return
    setRegions(prev => prev.map(r => r.id === id ? { ...r, name: name.trim() || r.name } : r))
  }

  function removeRegion(id) {
    setRegions(prev => prev.filter(r => r.id !== id))
  }

  function startEditChecklist(c) {
    setEditingId(c.id)
    setTitle(c.title)
    setImagePreview(c.image_url)
    setImageFile(null)
    setRegions(c.pins || [])
    setNameQueue([])
    setMsg(''); setError('')
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setTitle(''); setImageFile(null); setImagePreview(''); setRegions([])
    setNameQueue([])
    if (fileRef.current) fileRef.current.value = ''
  }

  async function save() {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!imageFile && !imagePreview) { setError('Please upload a sheet image.'); return }
    if (regions.length === 0) { setError('Draw at least one box on the image.'); return }
    setSaving(true); setError(''); setMsg('')
    try {
      let imageUrl = imagePreview
      if (imageFile) {
        const path = `checklists/${Date.now()}-${imageFile.name.replace(/\s+/g,'_')}`
        const { error: upErr } = await supabase.storage.from('pin-images').upload(path, imageFile)
        if (upErr) throw upErr
        const { data } = supabase.storage.from('pin-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
      const payload = { title: title.trim(), image_url: imageUrl, pins: regions, updated_at: new Date().toISOString() }
      let dbErr
      if (editingId) {
        ({ error: dbErr } = await supabase.from('pin_checklists').update(payload).eq('id', editingId))
      } else {
        ({ error: dbErr } = await supabase.from('pin_checklists').insert([payload]))
      }
      if (dbErr) throw dbErr
      setMsg(editingId ? 'Checklist updated ✓' : 'Checklist saved ✓')
      setEditingId(null)
      setTitle(''); setImageFile(null); setImagePreview(''); setRegions([])
      if (fileRef.current) fileRef.current.value = ''
      loadExisting()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function deleteChecklist(id) {
    if (!window.confirm('Delete this checklist? This cannot be undone.')) return
    await supabase.from('pin_checklists').delete().eq('id', id)
    setExisting(prev => prev.filter(c => c.id !== id))
  }

  const inputStyle = { width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.04)', color:'#f1f5f9', fontSize:13, marginBottom:8 }
  const labelStyle = { fontSize:11, color:'#94a3b8', marginBottom:3, display:'block' }

  const drawBox = drawing ? {
    top: Math.min(drawing.startY, drawing.curY),
    left: Math.min(drawing.startX, drawing.curX),
    width: Math.abs(drawing.curX - drawing.startX),
    height: Math.abs(drawing.curY - drawing.startY)
  } : null

  return (
    <div style={{ padding:'12px 4px' }}>
      <div style={{ fontSize:18, fontWeight:'bold', color:'#f1f5f9', marginBottom:4 }}>🗂️ Checklist Builder</div>
      <div style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>Upload a pin sheet, then click-and-drag a box over each pin and name it.</div>

      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:14, marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:'bold', color:'#c4b5fd', marginBottom:8 }}>
          {editingId ? '✏️ Editing Checklist' : '➕ New Checklist'}
        </div>
        <label style={labelStyle}>Checklist Title</label>
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Hidden Disney 2026 Wave B" />

        {!imagePreview ? (
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{ width:'100%', padding:'20px', borderRadius:10, border:'2px dashed rgba(255,255,255,0.2)', background:'transparent', color:'#94a3b8', fontSize:13, cursor:'pointer' }}>
            📷 Upload pin sheet image
          </button>
        ) : (
          <>
            <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
              <button type="button" onClick={autoDetectNames} disabled={detecting}
                style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:'bold', cursor:'pointer', opacity:detecting?0.6:1 }}>
                {detecting ? 'Reading labels...' : '🪄 Auto-detect pin names'}
              </button>
              <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.15)' }}>
                <button type="button" onClick={() => setDrawMode('row')}
                  style={{ padding:'8px 12px', border:'none', fontSize:11, fontWeight:'bold', cursor:'pointer', background: drawMode==='row' ? '#7c3aed' : 'transparent', color: drawMode==='row' ? '#fff' : '#94a3b8' }}>
                  Row mode
                </button>
                <button type="button" onClick={() => setDrawMode('pin')}
                  style={{ padding:'8px 12px', border:'none', fontSize:11, fontWeight:'bold', cursor:'pointer', background: drawMode==='pin' ? '#7c3aed' : 'transparent', color: drawMode==='pin' ? '#fff' : '#94a3b8' }}>
                  Single-pin mode
                </button>
              </div>
            </div>
            {detectError && <div style={{ color:'#f87171', fontSize:11, marginBottom:8 }}>{detectError}</div>}
            {nameQueue.length > 0 && (
              <div style={{ fontSize:11, color:'#34d399', marginBottom:8 }}>{nameQueue.length} detected names ready — next up: "{nameQueue[0]}"</div>
            )}
            <div style={{ fontSize:11, color:'#94a3b8', margin:'8px 0' }}>
              {drawMode === 'row'
                ? "Drag a box around an entire row of pins (left edge of first pin to right edge of last). You'll be asked how many pins are in it — names fill in automatically from the detected list."
                : 'Drag a box around one pin and name it manually.'}
              {' '}{regions.length} pin{regions.length===1?'':'s'} added so far.
            </div>
            <div
              ref={containerRef}
              onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={() => setDrawing(null)}
              onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
              style={{ position:'relative', width:'100%', lineHeight:0, borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.15)', cursor:'crosshair', userSelect:'none', touchAction:'none' }}
            >
              <img src={imagePreview} alt="sheet" style={{ width:'100%', height:'auto', display:'block', pointerEvents:'none' }} />
              {regions.map(r => (
                <div key={r.id} style={{ position:'absolute', top:`${r.top}%`, left:`${r.left}%`, width:`${r.width}%`, height:`${r.height}%`, border:'2px solid #34d399', background:'rgba(52,211,153,0.15)', borderRadius:4 }}>
                  <span style={{ position:'absolute', top:1, left:1, fontSize:8, background:'#34d399', color:'#0b0f1a', padding:'1px 3px', borderRadius:3, fontWeight:'bold', whiteSpace:'nowrap', maxWidth:'95%', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</span>
                </div>
              ))}
              {drawBox && (
                <div style={{ position:'absolute', top:`${drawBox.top}%`, left:`${drawBox.left}%`, width:`${drawBox.width}%`, height:`${drawBox.height}%`, border:'2px dashed #c4b5fd', background:'rgba(196,181,253,0.15)', borderRadius:4, pointerEvents:'none' }} />
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ marginTop:8, padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', fontSize:11, cursor:'pointer' }}>
              Change image
            </button>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />

        {regions.length > 0 && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6 }}>Pins added — tap a name to rename it:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {regions.map(r => (
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.05)', borderRadius:6, padding:'4px 8px', fontSize:11, color:'#e2e8f0' }}>
                  <span onClick={() => renameRegion(r.id)} style={{ cursor:'pointer' }}>{r.name}</span>
                  <button onClick={() => removeRegion(r.id)} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:12, padding:0, marginLeft:2 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div style={{ color:'#f87171', fontSize:12, marginTop:8 }}>{error}</div>}
        {msg && <div style={{ color:'#34d399', fontSize:12, marginTop:8 }}>{msg}</div>}

        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button onClick={save} disabled={saving}
            style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontWeight:'bold', fontSize:13, cursor:'pointer', opacity:saving?0.6:1 }}>
            {saving ? 'Saving...' : editingId ? 'Update Checklist' : 'Save Checklist'}
          </button>
          {editingId && (
            <button onClick={cancelEdit}
              style={{ padding:'10px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize:13, fontWeight:'bold', color:'#c4b5fd', marginBottom:8 }}>Existing Checklists</div>
      {existing.length === 0 ? (
        <div style={{ color:'#64748b', fontSize:12 }}>None added yet.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {existing.map(c => (
            <div key={c.id} style={{ display:'flex', gap:10, alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:10 }}>
              <img src={c.image_url} alt={c.title} style={{ width:44, height:44, borderRadius:8, objectFit:'cover' }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:'bold', color:'#f1f5f9' }}>{c.title}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>{(c.pins||[]).length} pins</div>
              </div>
              <button onClick={() => startEditChecklist(c)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(196,181,253,0.3)', background:'transparent', color:'#c4b5fd', fontSize:11, cursor:'pointer' }}>Edit</button>
              <button onClick={() => deleteChecklist(c.id)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(248,113,113,0.3)', background:'transparent', color:'#f87171', fontSize:11, cursor:'pointer' }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Resizes a photo to a JPEG (max 1000px), the same way the Add Pin form does before searching
function shrinkPhoto(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the photo'))
    reader.onload = ev => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not open the photo'))
      img.onload = () => {
        let { width, height } = img
        if (width > max || height > max) {
          if (width > height) { height = (height / width) * max; width = max } else { width = (width / height) * max; height = max }
        }
        const c = document.createElement('canvas'); c.width = width; c.height = height
        c.getContext('2d').drawImage(img, 0, 0, width, height)
        c.toBlob(b => b ? resolve(b) : reject(new Error('Could not process the photo')), 'image/jpeg', 0.85)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

function AdminPinDatabase({ isAdmin = false, userId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyDbForm)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  // eBay reference lookup - separate from the form, purely informational
  const [ebayQuery, setEbayQuery] = useState('')
  const [ebayResults, setEbayResults] = useState(null)
  const [ebayLoading, setEbayLoading] = useState(false)
  const [ebayError, setEbayError] = useState('')
  const [fillingId, setFillingId] = useState(null)
  const [fillMsg, setFillMsg] = useState('')

  // Fill the form from listing text (no photo is ever copied)
  function applyFilled(f) {
    const filled = []
    const next = {}
    for (const k of ['name','series','park','release_year','edition_size','description','estimated_value','source_link']) {
      if (f[k] !== '' && f[k] !== null && f[k] !== undefined) { next[k] = String(f[k]); filled.push(k.replace('_',' ')) }
    }
    setForm(prev => ({ ...prev, ...next }))
    setFillMsg(filled.length ? `Filled in: ${filled.join(', ')}. Check the details below, and add your own photo.` : 'That result did not contain details I could use.')
    if (filled.length) setTimeout(() => document.getElementById('db-form')?.scrollIntoView({ behavior:'smooth', block:'start' }), 100)
  }
  async function fillFrom(id, url, body, extra = {}) {
    if (editing && !window.confirm('Replace the details in this record with information from the listing?')) return
    setFillingId(id); setFillMsg(''); setEbayError(''); setLensError('')
    try {
      const res = await fetch(url, { method:'POST', headers: await authHeaders(), body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not read that result')
      applyFilled({ ...data.fields, ...extra })
    } catch (e) { (url.includes('ebay') ? setEbayError : setLensError)(e.message) }
    setFillingId(null)
  }
  const fillFromEbay = r => fillFrom(r.itemId, '/api/ebay-item', { itemId: r.itemId })
  const fillFromLens = (m, i) => fillFrom('lens-' + i, '/api/pin-from-text', { title: m.title, source: m.source, snippet: m.snippet },
    { ...(typeof m.price === 'number' ? { estimated_value: m.price } : {}), ...(m.link ? { source_link: m.link } : {}) })

  // Photo reference lookup (reverse image search) - also purely informational
  const [lensPreview, setLensPreview] = useState('')
  const [lensResults, setLensResults] = useState(null)
  const [lensChecked, setLensChecked] = useState([]) // parallel array of booleans, only meaningful for items with a price
  const [lensLoading, setLensLoading] = useState(false)
  const [lensError, setLensError] = useState('')
  const lensFileRef = useRef()

  async function lookupByPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setLensLoading(true); setLensError(''); setLensResults(null); setLensChecked([])
    const reader = new FileReader()
    reader.onload = ev => setLensPreview(ev.target.result)
    reader.readAsDataURL(file)
    try {
      // Upload to a scratch path just to get a public URL for reverse image search
      const blob = await shrinkPhoto(file)
      const path = `lookup-scratch/${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage.from('pin-images').upload(path, blob, { contentType:'image/jpeg' })
      if (upErr) throw new Error('Upload failed: ' + upErr.message)
      const { data: pub } = supabase.storage.from('pin-images').getPublicUrl(path)

      const resp = await fetch('/api/identify-pin', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ image: pub.publicUrl })
      })
      const data = await resp.json()
      if (!data.found) throw new Error(data.reason || 'No matches found')

      // Visual matches (what Google found for this exact photo) always come first.
      // eBay keyword results are shown separately below them as a price reference only.
      const visual = (data.matches || []).map(m => ({ ...m, kind:'visual' }))
      const ebay = (data.ebay_matches || []).map(m => ({
        ...m, kind:'ebay', price: parseFloat((m.price || '').replace(/[^0-9.]/g, '')) || null
      }))
      const results = [...visual, ...ebay]
      const visualPriced = visual.filter(m => typeof m.price === 'number').length
      setLensResults(results)
      setLensChecked(results.map(m => typeof m.price === 'number' && (m.kind === 'visual' || visualPriced < 2)))
    } catch (err) {
      setLensError(err.message)
    }
    setLensLoading(false)
  }

  async function lookupEbay() {
    if (!ebayQuery.trim()) return
    setEbayLoading(true); setEbayError(''); setEbayResults(null)
    try {
      const resp = await fetch('/api/ebay-lookup', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ query: ebayQuery })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Lookup failed')
      setEbayResults(data.results)
    } catch (err) {
      setEbayError(err.message)
    }
    setEbayLoading(false)
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('pin_database').select('*').order('created_at', { ascending:false })
    if (!error) setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(row) {
    setForm({
      id: row.id, name: row.name || '', series: row.series || '', park: row.park || '',
      release_year: row.release_year || '', edition_size: row.edition_size || '',
      estimated_value: row.estimated_value ?? '', image_url: row.image_url || '',
      description: row.description || '', source_link: row.source_link || ''
    })
    setImageFile(null); setPreview(row.image_url || '')
    setEditing(true); setMsg(''); setError('')
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  function resetForm() {
    setForm(emptyDbForm); setEditing(false)
    setImageFile(null); setPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function save() {
    if (!form.name.trim()) { setError('Pin name is required.'); return }
    setSaving(true); setError(''); setMsg('')

    let finalImageUrl = form.image_url.trim() || null

    if (imageFile) {
      setUploading(true)
      try {
        const path = `${isAdmin ? 'db' : userId}/db-${Date.now()}-${imageFile.name.replace(/\s+/g,'_')}`
        const { error: upErr } = await supabase.storage.from('pin-images').upload(path, imageFile)
        if (upErr) throw upErr
        const { data } = supabase.storage.from('pin-images').getPublicUrl(path)
        finalImageUrl = data.publicUrl
      } catch (err) {
        setUploading(false); setSaving(false)
        setError('Image upload failed: ' + err.message)
        return
      }
      setUploading(false)
    }

    const payload = {
      name: form.name.trim(),
      series: form.series.trim() || null,
      park: form.park.trim() || null,
      release_year: form.release_year ? parseInt(form.release_year) : null,
      edition_size: form.edition_size.trim() || null,
      estimated_value: form.estimated_value !== '' ? parseFloat(form.estimated_value) : null,
      image_url: finalImageUrl,
      description: form.description.trim() || null,
      source_link: form.source_link.trim() || null,
      updated_at: new Date().toISOString()
    }
    let error
    if (isAdmin) {
      if (editing) {
        ({ error } = await supabase.from('pin_database').update(payload).eq('id', form.id))
      } else {
        ({ error } = await supabase.from('pin_database').insert([{ ...payload, status:'approved', submitted_by:userId }]))
      }
    } else if (editing) {
      // Contributors never change live entries: the proposed values wait in the review queue
      const { updated_at, ...proposed } = payload
      ({ error } = await supabase.from('pin_database_edits').insert([{ pin_id: form.id, submitted_by: userId, proposed, status:'pending' }]))
    } else {
      ({ error } = await supabase.from('pin_database').insert([{ ...payload, status:'pending', submitted_by:userId }]))
    }
    setSaving(false)
    if (error) { setError(error.message); return }
    setMsg(isAdmin ? (editing ? 'Pin updated ✓' : 'Pin added to database ✓') : 'Thanks! Your submission was sent for review ✓')
    resetForm(); load()
  }

  async function remove(id) {
    if (!window.confirm('Delete this pin from the database? This cannot be undone.')) return
    const { error } = await supabase.from('pin_database').delete().eq('id', id)
    if (!error) setRows(prev => prev.filter(r => r.id !== id))
  }

  function toggleLensChecked(i) {
    setLensChecked(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  function computeLensMedian() {
    const active = (lensResults || [])
      .filter((m, i) => lensChecked[i] && typeof m.price === 'number')
      .map(m => m.price)
      .sort((a,b) => a-b)
    if (active.length === 0) return null
    const mid = Math.floor(active.length / 2)
    return active.length % 2 !== 0 ? active[mid] : (active[mid-1] + active[mid]) / 2
  }

  const filtered = rows.filter(r =>
    !search.trim() || `${r.name} ${r.series} ${r.park}`.toLowerCase().includes(search.toLowerCase())
  )

  const inputStyle = { width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.04)', color:'#f1f5f9', fontSize:13, marginBottom:8 }
  const labelStyle = { fontSize:11, color:'#94a3b8', marginBottom:3, display:'block' }

  return (
    <div style={{ padding:'12px 4px' }}>
      <div style={{ fontSize:18, fontWeight:'bold', color:'#f1f5f9', marginBottom:4 }}>📋 Pin Database{isAdmin ? ' (Admin)' : ''}</div>
      <div style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>{rows.length} pins in the shared reference database{!isAdmin && '. Add a pin or suggest a fix. Submissions are reviewed before they go live.'}</div>

      {isAdmin && (<>
      <div style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.25)', borderRadius:12, padding:14, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:'bold', color:'#c4b5fd', marginBottom:8 }}>🔍 eBay Reference Lookup</div>
        <div style={{ fontSize:11, color:'#94a3b8', marginBottom:10 }}>Search eBay for a pin title or value. Tap "Fill form" on a listing to copy its details (name, series, year, edition and so on) into the form below. You add the photo.</div>
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <input style={{...inputStyle, marginBottom:0, flex:1}} placeholder="e.g. Hatbox Ghost Hidden Disney 2025"
            value={ebayQuery} onChange={e => setEbayQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookupEbay()} />
          <button onClick={lookupEbay} disabled={ebayLoading}
            style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:'bold', cursor:'pointer', opacity:ebayLoading?0.6:1, whiteSpace:'nowrap' }}>
            {ebayLoading ? 'Searching...' : 'Look up'}
          </button>
        </div>

        {ebayError && <div style={{ color:'#f87171', fontSize:12 }}>{ebayError}</div>}

        {ebayResults && ebayResults.length === 0 && (
          <div style={{ color:'#64748b', fontSize:12 }}>No eBay listings found for that search.</div>
        )}

        {ebayResults && ebayResults.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:280, overflowY:'auto' }}>
            {ebayResults.map((r, i) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:'center', background:'rgba(255,255,255,0.04)', borderRadius:8, padding:8 }}>
                {r.thumbnail && <img src={r.thumbnail} alt="" style={{ width:36, height:36, borderRadius:6, objectFit:'cover', flexShrink:0 }} />}
                <a href={r.link} target="_blank" rel="noopener noreferrer" style={{ flex:1, minWidth:0, textDecoration:'none' }}>
                  <div style={{ fontSize:11, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</div>
                  <div style={{ fontSize:11, color:'#34d399', fontWeight:'bold' }}>{r.price || '—'} {r.condition && <span style={{ color:'#64748b', fontWeight:'normal' }}>({r.condition})</span>}</div>
                </a>
                {r.itemId && <button onClick={() => fillFromEbay(r)} disabled={fillingId !== null}
                  style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(124,58,237,0.6)', background:'rgba(124,58,237,0.25)', color:'#e2d9f3', fontSize:11, fontWeight:'bold', cursor:'pointer', whiteSpace:'nowrap', opacity: fillingId !== null ? .6 : 1 }}>
                  {fillingId === r.itemId ? 'Reading...' : 'Fill form'}</button>}
              </div>
            ))}
          </div>
        )}
        {fillMsg && <div style={{ fontSize:12, color:'#34d399', marginTop:8 }}>✓ {fillMsg}</div>}
        <div style={{ fontSize:9, color:'#64748b', marginTop:8 }}>Active eBay listing prices, not confirmed sold prices. "Fill form" copies details from the listing text only, never the photo.</div>
      </div>

      <div style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.25)', borderRadius:12, padding:14, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:'bold', color:'#c4b5fd', marginBottom:8 }}>📷 Photo Reference Lookup</div>
        <div style={{ fontSize:11, color:'#94a3b8', marginBottom:10 }}>Upload a photo to find visually similar pins across the web. Tap "Fill form" on a result to copy its details into the form below. You add the photo.</div>

        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
          {lensPreview && <img src={lensPreview} alt="" style={{ width:44, height:44, borderRadius:8, objectFit:'cover', border:'1px solid rgba(255,255,255,0.15)' }} />}
          <button type="button" onClick={() => lensFileRef.current?.click()} disabled={lensLoading}
            style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:'bold', cursor:'pointer', opacity:lensLoading?0.6:1 }}>
            {lensLoading ? 'Searching...' : lensPreview ? 'Try another photo' : 'Upload photo'}
          </button>
        </div>
        <input ref={lensFileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={lookupByPhoto} />

        {lensError && <div style={{ color:'#f87171', fontSize:12 }}>{lensError}</div>}
        {fillMsg && <div style={{ fontSize:12, color:'#34d399', marginBottom:8 }}>✓ {fillMsg}</div>}

        {lensResults && lensResults.length === 0 && (
          <div style={{ color:'#64748b', fontSize:12 }}>No visual matches found for that photo.</div>
        )}

        {lensResults && lensResults.length === 0 && (
          <div style={{ color:'#64748b', fontSize:12 }}>No visual matches found for that photo.</div>
        )}

        {lensResults && lensResults.length > 0 && (
          <>
            {lensResults.some(m => typeof m.price === 'number') && (
              <div style={{ marginBottom:10 }}>
                <div style={{ color:'#34d399', fontWeight:'bold', fontSize:12 }}>
                  💰 Est. value: ${computeLensMedian()?.toFixed(2) ?? '—'}
                  <span style={{ fontWeight:'normal', color:'#94a3b8' }}> (median of {lensChecked.filter(Boolean).length} checked listing{lensChecked.filter(Boolean).length===1?'':'s'})</span>
                </div>
                <div style={{ fontWeight:'normal', fontSize:9, color:'#64748b', marginTop:2 }}>Uncheck listings below to exclude them from the value calculation. Active listing prices, not confirmed sold prices.</div>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:320, overflowY:'auto' }}>
              {lensResults.map((m, i) => {
                const hasPrice = typeof m.price === 'number'
                return (
                  <React.Fragment key={i}>
                  {(i === 0 || lensResults[i-1].kind !== m.kind) && (
                    <div style={{ fontSize:10, fontWeight:'bold', color: m.kind === 'visual' ? '#c4b5fd' : '#94a3b8', marginTop: i === 0 ? 0 : 8 }}>
                      {m.kind === 'visual' ? '📷 Visual matches for your photo' : '🛒 eBay listings found by keyword (price reference, may not be this exact pin)'}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8, alignItems:'center', background:'rgba(255,255,255,0.04)', borderRadius:8, padding:8, opacity: hasPrice && !lensChecked[i] ? 0.4 : 1 }}>
                    {hasPrice
                      ? <input type="checkbox" checked={lensChecked[i]} onChange={() => toggleLensChecked(i)} style={{ width:16, height:16, flexShrink:0, cursor:'pointer' }} />
                      : <div style={{ width:16, flexShrink:0 }} />
                    }
                    {m.thumbnail && <img src={m.thumbnail} alt="" style={{ width:36, height:36, borderRadius:6, objectFit:'contain', background:'rgba(255,255,255,0.06)', flexShrink:0 }} />}
                    <a href={m.link} target="_blank" rel="noopener noreferrer" style={{ flex:1, minWidth:0, textDecoration:'none' }}>
                      <div style={{ fontSize:11, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.title}</div>
                      <div style={{ fontSize:10, color: hasPrice ? '#34d399' : '#64748b', fontWeight: hasPrice ? 'bold' : 'normal' }}>
                        {hasPrice ? `$${m.price.toFixed(2)}` : m.source}
                      </div>
                    </a>
                    <button onClick={() => fillFromLens(m, i)} disabled={fillingId !== null}
                      style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(124,58,237,0.6)', background:'rgba(124,58,237,0.25)', color:'#e2d9f3', fontSize:11, fontWeight:'bold', cursor:'pointer', whiteSpace:'nowrap', opacity: fillingId !== null ? .6 : 1 }}>
                      {fillingId === 'lens-' + i ? 'Reading...' : 'Fill form'}</button>
                  </div>
                  </React.Fragment>
                )
              })}
            </div>
          </>
        )}
      </div>
      </>)}

      <div id="db-form" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:14, marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:'bold', color:'#c4b5fd', marginBottom:10 }}>
          {editing ? (isAdmin ? '✏️ Edit Pin' : '✏️ Suggest a Change') : (isAdmin ? '➕ Add New Pin' : '➕ Submit a New Pin')}
        </div>

        <label style={labelStyle}>Name *</label>
        <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Pin name" />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div>
            <label style={labelStyle}>Series / Collection</label>
            <input style={inputStyle} value={form.series} onChange={e => setForm({...form, series:e.target.value})} placeholder="e.g. Hidden Disney 2025 Wave A" />
          </div>
          <div>
            <label style={labelStyle}>Park</label>
            <input style={inputStyle} value={form.park} onChange={e => setForm({...form, park:e.target.value})} placeholder="e.g. WDW" />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          <div>
            <label style={labelStyle}>Release Year</label>
            <input style={inputStyle} type="number" value={form.release_year} onChange={e => setForm({...form, release_year:e.target.value})} placeholder="2025" />
          </div>
          <div>
            <label style={labelStyle}>Edition Size</label>
            <input style={inputStyle} value={form.edition_size} onChange={e => setForm({...form, edition_size:e.target.value})} placeholder="LE 4000" />
          </div>
          <div>
            <label style={labelStyle}>Est. Value ($)</label>
            <input style={inputStyle} type="number" step="0.01" value={form.estimated_value} onChange={e => setForm({...form, estimated_value:e.target.value})} placeholder="15.00" />
          </div>
        </div>

        <label style={labelStyle}>Photo</label>
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
          {preview && (
            <img src={preview} alt="preview" style={{ width:56, height:56, borderRadius:8, objectFit:'cover', border:'1px solid rgba(255,255,255,0.15)' }} />
          )}
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{ padding:'8px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#c4b5fd', fontSize:12, cursor:'pointer' }}>
            {preview ? 'Change photo' : '📷 Upload photo'}
          </button>
          {imageFile && <span style={{ fontSize:11, color:'#64748b' }}>{imageFile.name}</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />

        <label style={labelStyle}>Or Image URL</label>
        <input style={inputStyle} value={form.image_url} onChange={e => { setForm({...form, image_url:e.target.value}); if(e.target.value){ setImageFile(null); setPreview(e.target.value) } }} placeholder="https://... (used if no photo uploaded)" />

        <label style={labelStyle}>Description</label>
        <textarea style={{...inputStyle, minHeight:60, resize:'vertical'}} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Notes, design details..." />

        <label style={labelStyle}>Source Link</label>
        <input style={inputStyle} value={form.source_link} onChange={e => setForm({...form, source_link:e.target.value})} placeholder="eBay / PinPics link used to confirm this pin" />

        {error && <div style={{ color:'#f87171', fontSize:12, marginBottom:8 }}>{error}</div>}
        {msg && <div style={{ color:'#34d399', fontSize:12, marginBottom:8 }}>{msg}</div>}

        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <button onClick={save} disabled={saving}
            style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontWeight:'bold', fontSize:13, cursor:'pointer', opacity:saving?0.6:1 }}>
            {uploading ? 'Uploading photo...' : saving ? 'Saving...' : editing ? 'Update Pin' : 'Add to Database'}
          </button>
          {editing && (
            <button onClick={resetForm}
              style={{ padding:'10px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#94a3b8', fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <input style={{...inputStyle, marginBottom:12}} placeholder="🔍 Search database..." value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? (
        <div style={{ textAlign:'center', color:'#64748b', padding:20 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', color:'#64748b', padding:20 }}>No pins found.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(row => (
            <div key={row.id} style={{ display:'flex', gap:10, alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:10 }}>
              <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'rgba(255,255,255,0.05)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {row.image_url ? <img src={row.image_url} alt={row.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:18 }}>📌</span>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:'bold', color:'#f1f5f9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.name}{row.status === 'pending' && <span style={{ marginLeft:6, fontSize:9, color:'#fbbf24', border:'1px solid rgba(251,191,36,0.4)', borderRadius:4, padding:'1px 5px' }}>PENDING</span>}{row.status === 'rejected' && <span style={{ marginLeft:6, fontSize:9, color:'#f87171', border:'1px solid rgba(248,113,113,0.4)', borderRadius:4, padding:'1px 5px' }}>REJECTED</span>}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>
                  {[row.series, row.park, row.edition_size].filter(Boolean).join(' • ') || 'No details yet'}
                  {row.estimated_value != null && <span style={{ color:'#34d399' }}> • ${row.estimated_value}</span>}
                </div>
              </div>
              <button onClick={() => startEdit(row)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'#c4b5fd', fontSize:11, cursor:'pointer' }}>{isAdmin ? 'Edit' : 'Suggest edit'}</button>
              {isAdmin && <button onClick={() => remove(row.id)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(248,113,113,0.3)', background:'transparent', color:'#f87171', fontSize:11, cursor:'pointer' }}>Delete</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Admin: review queue for community pin submissions ────────────────────────
const REVIEW_FIELDS = [
  ['name','Name'],['series','Series'],['park','Park'],['release_year','Year'],
  ['edition_size','Edition'],['estimated_value','Value'],['description','Description'],
  ['source_link','Source'],['image_url','Image']
]

// Copy an externally hosted image into our own storage so approved entries never break
async function mirrorImage(url) {
  if (!url || url.includes('/storage/v1/object/public/pin-images/db/')) return url
  try {
    const res = await fetch(url)
    if (!res.ok) return url
    const blob = await res.blob()
    const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg','jpg')
    const path = `db/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`
    const { error } = await supabase.storage.from('pin-images').upload(path, blob, { contentType: blob.type })
    if (error) return url
    return supabase.storage.from('pin-images').getPublicUrl(path).data.publicUrl
  } catch { return url }
}

function AdminReviewQueue({ userId }) {
  const [newPins, setNewPins] = useState([])
  const [edits, setEdits] = useState([])
  const [live, setLive] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const { data: np } = await supabase.from('pin_database').select('*').eq('status','pending').order('created_at', { ascending:true })
    const { data: ed } = await supabase.from('pin_database_edits').select('*').eq('status','pending').order('created_at', { ascending:true })
    setNewPins(np || []); setEdits(ed || [])
    const ids = [...new Set((ed || []).map(e => e.pin_id))]
    if (ids.length) {
      const { data: rows } = await supabase.from('pin_database').select('*').in('id', ids)
      setLive(Object.fromEntries((rows || []).map(r => [r.id, r])))
    } else setLive({})
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const stamp = { reviewed_by: userId, reviewed_at: new Date().toISOString() }

  async function approveNew(row) {
    setBusy(row.id)
    const image_url = await mirrorImage(row.image_url)
    await supabase.from('pin_database').update({ status:'approved', image_url, ...stamp }).eq('id', row.id)
    setNewPins(prev => prev.filter(r => r.id !== row.id)); setBusy(null); setMsg('Approved ✓')
  }
  async function rejectNew(row) {
    setBusy(row.id)
    await supabase.from('pin_database').update({ status:'rejected', ...stamp }).eq('id', row.id)
    setNewPins(prev => prev.filter(r => r.id !== row.id)); setBusy(null); setMsg('Rejected')
  }
  async function approveEdit(e) {
    setBusy(e.id)
    const proposed = { ...e.proposed }
    if (proposed.image_url) proposed.image_url = await mirrorImage(proposed.image_url)
    await supabase.from('pin_database').update({ ...proposed, updated_at: new Date().toISOString() }).eq('id', e.pin_id)
    await supabase.from('pin_database_edits').update({ status:'approved', ...stamp }).eq('id', e.id)
    setEdits(prev => prev.filter(x => x.id !== e.id)); setBusy(null); setMsg('Edit approved and applied ✓')
  }
  async function rejectEdit(e) {
    setBusy(e.id)
    await supabase.from('pin_database_edits').update({ status:'rejected', ...stamp }).eq('id', e.id)
    setEdits(prev => prev.filter(x => x.id !== e.id)); setBusy(null); setMsg('Edit rejected')
  }

  const btn = (bg, color, border) => ({ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${border}`, background:bg, color, fontSize:12, fontWeight:'bold', cursor:'pointer' })
  const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:12, marginBottom:10 }
  const fmt = v => (v === null || v === undefined || v === '') ? '—' : String(v)

  return (
    <div style={{ padding:'12px 4px' }}>
      <div style={{ fontSize:18, fontWeight:'bold', color:'#f1f5f9', marginBottom:4 }}>✅ Review Queue</div>
      <div style={{ fontSize:12, color:'#64748b', marginBottom:14 }}>{newPins.length} new pin{newPins.length===1?'':'s'} and {edits.length} edit{edits.length===1?'':'s'} waiting</div>
      {msg && <div style={{ color:'#34d399', fontSize:12, marginBottom:10 }}>{msg}</div>}
      {loading ? <div style={{ textAlign:'center', color:'#64748b', padding:20 }}>Loading...</div> : (
        <>
          {newPins.length === 0 && edits.length === 0 && <div style={{ textAlign:'center', color:'#64748b', padding:20 }}>Nothing to review 🎉</div>}

          {newPins.map(row => (
            <div key={row.id} style={card}>
              <div style={{ fontSize:11, color:'#fbbf24', fontWeight:'bold', marginBottom:8 }}>NEW PIN</div>
              <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                {row.image_url && <img src={row.image_url} alt="" style={{ width:70, height:70, borderRadius:8, objectFit:'cover' }} />}
                <div style={{ flex:1, minWidth:0, fontSize:12, color:'#cbd5e1', lineHeight:1.6 }}>
                  {REVIEW_FIELDS.filter(([k]) => k !== 'image_url' && row[k] !== null && row[k] !== '').map(([k,label]) => (
                    <div key={k}><span style={{ color:'#64748b' }}>{label}: </span>{String(row[k])}</div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button disabled={busy===row.id} onClick={() => approveNew(row)} style={btn('rgba(16,185,129,0.15)','#34d399','rgba(16,185,129,0.4)')}>{busy===row.id ? '...' : 'Approve'}</button>
                <button disabled={busy===row.id} onClick={() => rejectNew(row)} style={btn('rgba(220,38,38,0.08)','#f87171','rgba(248,113,113,0.3)')}>Reject</button>
              </div>
            </div>
          ))}

          {edits.map(e => {
            const cur = live[e.pin_id] || {}
            const changed = REVIEW_FIELDS.filter(([k]) => fmt(cur[k]) !== fmt(e.proposed?.[k]))
            return (
              <div key={e.id} style={card}>
                <div style={{ fontSize:11, color:'#60a5fa', fontWeight:'bold', marginBottom:4 }}>SUGGESTED EDIT</div>
                <div style={{ fontSize:13, fontWeight:'bold', color:'#f1f5f9', marginBottom:8 }}>{cur.name || 'Pin'}</div>
                {changed.length === 0 && <div style={{ fontSize:12, color:'#64748b', marginBottom:8 }}>No differences from the live entry.</div>}
                {changed.map(([k,label]) => (
                  <div key={k} style={{ fontSize:12, marginBottom:6, wordBreak:'break-word' }}>
                    <div style={{ color:'#64748b' }}>{label}</div>
                    {k === 'image_url' ? (
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {cur[k] ? <img src={cur[k]} alt="" style={{ width:50, height:50, borderRadius:6, objectFit:'cover' }} /> : <span style={{ color:'#f87171' }}>none</span>}
                        <span style={{ color:'#64748b' }}>→</span>
                        {e.proposed?.[k] ? <img src={e.proposed[k]} alt="" style={{ width:50, height:50, borderRadius:6, objectFit:'cover' }} /> : <span style={{ color:'#34d399' }}>none</span>}
                      </div>
                    ) : (
                      <div><span style={{ color:'#f87171', textDecoration:'line-through' }}>{fmt(cur[k])}</span> <span style={{ color:'#64748b' }}>→</span> <span style={{ color:'#34d399' }}>{fmt(e.proposed?.[k])}</span></div>
                    )}
                  </div>
                ))}
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <button disabled={busy===e.id} onClick={() => approveEdit(e)} style={btn('rgba(16,185,129,0.15)','#34d399','rgba(16,185,129,0.4)')}>{busy===e.id ? '...' : 'Approve'}</button>
                  <button disabled={busy===e.id} onClick={() => rejectEdit(e)} style={btn('rgba(220,38,38,0.08)','#f87171','rgba(248,113,113,0.3)')}>Reject</button>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ── Facebook trade post generator ─────────────────────────────────────────────
const TP_PER_IMAGE = 12
const TP_DEFAULT_TEXT = "FTO (For Trade Only) / NFS (Not For Sale)\n\nHi pin traders! 👋\n\nI'm in search of the pins in the ISO section and have the pins in the Traders section available to trade. Message me or comment if you have a match!\n\n#DisneyPins #PinTrading"

function tpLoadImage(src) {
  const attempt = url => new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
  return (async () => {
    if (!src) return null
    let img = await attempt(src)
    // A copy cached by a plain <img> tag has no CORS headers and fails here: retry with a fresh URL
    if (!img && /^https?:/.test(src)) img = await attempt(src + (src.includes('?') ? '&' : '?') + 'cors=1')
    if (!img) console.warn('Trade post: could not load image', src)
    return img
  })()
}

function tpWrap(ctx, text, maxWidth, maxLines) {
  const words = (text || '').split(/\s+/); const lines = []; let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w } else line = test
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines-1] = lines[maxLines-1].replace(/.{0,3}$/, '…') }
  return lines
}

// Draws one post image: ISO section on top, Traders section below
async function tpDrawPage(canvas, isoItems, traderItems, imgCache) {
  const W = 1080, COLS = 4, PAD = 30, GAP = 20
  const tile = (W - PAD*2 - GAP*(COLS-1)) / COLS
  const capH = 56, headH = 76
  const rows = n => Math.max(1, Math.ceil(n / COLS))
  const sections = [
    { label:'ISO', sub:'In Search Of', color:'#db2777', items:isoItems },
    { label:'TRADERS', sub:'Available to Trade', color:'#059669', items:traderItems }
  ].filter(sec => sec.items.length > 0)
  let H = PAD
  sections.forEach(sec => { H += headH + rows(sec.items.length) * (tile + capH + GAP) + 10 })
  H += 40
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a1040'); bg.addColorStop(1, '#0f172a')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  let y = PAD
  for (const sec of sections) {
    ctx.fillStyle = sec.color
    ctx.beginPath(); ctx.roundRect(PAD, y, W - PAD*2, headH - 12, 14); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
    ctx.font = 'bold 40px Arial, sans-serif'; ctx.textAlign = 'left'
    ctx.fillText(sec.label, PAD + 22, y + (headH-12)/2)
    ctx.font = '26px Arial, sans-serif'; ctx.textAlign = 'right'
    ctx.fillText(sec.sub, W - PAD - 22, y + (headH-12)/2)
    y += headH
    for (let i = 0; i < sec.items.length; i++) {
      const it = sec.items[i]
      const col = i % COLS, row = Math.floor(i / COLS)
      const x = PAD + col * (tile + GAP), ty = y + row * (tile + capH + GAP)
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(x, ty, tile, tile + capH, 12); ctx.fill()
      let img = imgCache.get(it.img)
      if (img === undefined) { img = await tpLoadImage(it.img); imgCache.set(it.img, img) }
      ctx.save(); ctx.beginPath(); ctx.roundRect(x + 6, ty + 6, tile - 12, tile - 12, 8); ctx.clip()
      if (img) {
        const r = Math.min((tile-12)/img.width, (tile-12)/img.height)
        const w = img.width * r, h = img.height * r
        ctx.fillStyle = '#f1f5f9'; ctx.fillRect(x + 6, ty + 6, tile - 12, tile - 12)
        ctx.drawImage(img, x + 6 + (tile-12-w)/2, ty + 6 + (tile-12-h)/2, w, h)
      } else {
        ctx.fillStyle = '#e2e8f0'; ctx.fillRect(x + 6, ty + 6, tile - 12, tile - 12)
        ctx.fillStyle = '#94a3b8'; ctx.font = '64px Arial'; ctx.textAlign = 'center'; ctx.fillText('📌', x + tile/2, ty + tile/2)
      }
      ctx.restore()
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 17px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
      const lines = tpWrap(ctx, it.name || '', tile - 16, 2)
      lines.forEach((l, li) => ctx.fillText(l, x + tile/2, ty + tile + 22 + li*21))
      ctx.textBaseline = 'middle'
    }
    y += rows(sec.items.length) * (tile + capH + GAP) + 10
  }
  ctx.fillStyle = '#64748b'; ctx.font = '18px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('Made with CastlePins', W/2, H - 14)
}

// Cuts each pin's hotspot out of a checklist image so it can be used as a tile
async function tpCropChecklist(cl, progress) {
  const base = p => ({ key:`cl-${cl.id}-${p.id}`, name:p.name, status:progress[p.id] || null })
  const imageUrl = cl.image_url || cl.image
  const img = await tpLoadImage(imageUrl)
  console.info('[TradePost] checklist crop', { title: cl.title, imageUrl, imageLoaded: !!img, size: img && [img.width, img.height], pinCount: (cl.pins||[]).length, samplePin: (cl.pins||[])[0] })
  return cl.pins.map(p => {
    if (!img) return { ...base(p), img:null }
    const sx = p.left/100*img.width, sy = p.top/100*img.height
    const sw = Math.max(1, p.width/100*img.width), sh = Math.max(1, p.height/100*img.height)
    const scale = Math.min(1, 320 / Math.max(sw, sh))
    const c = document.createElement('canvas'); c.width = Math.round(sw*scale); c.height = Math.round(sh*scale)
    c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height)
    let url = null
    try { url = c.toDataURL('image/jpeg', 0.88) } catch (e) { console.warn('[TradePost] crop blocked (canvas tainted):', e.message); url = null }
    return { ...base(p), img:url }
  })
}

function TradePostGenerator({ pins, books, userId }) {
  const [iso, setIso] = useState([])
  const [traders, setTraders] = useState([])
  const [picking, setPicking] = useState(null) // 'iso' | 'traders' | null
  const [src, setSrc] = useState('have')
  const [bookId, setBookId] = useState('')
  const [dbQuery, setDbQuery] = useState('')
  const [dbRows, setDbRows] = useState([])
  const [checklists, setChecklists] = useState([])
  const [checklistId, setChecklistId] = useState('')
  const [clItems, setClItems] = useState([])
  const [clLoading, setClLoading] = useState(false)
  const [text, setText] = useState(TP_DEFAULT_TEXT)
  const [copied, setCopied] = useState(false)
  const [rendering, setRendering] = useState(false)
  const canvasRefs = useRef([])
  const imgCache = useRef(new Map())
  const uploadRef = useRef()

  const pageCount = Math.max(1, Math.ceil(iso.length / TP_PER_IMAGE), Math.ceil(traders.length / TP_PER_IMAGE))
  const pages = Array.from({ length: pageCount }, (_, i) => ({
    iso: iso.slice(i*TP_PER_IMAGE, (i+1)*TP_PER_IMAGE),
    traders: traders.slice(i*TP_PER_IMAGE, (i+1)*TP_PER_IMAGE)
  }))

  useEffect(() => {
    let cancelled = false
    async function draw() {
      if (iso.length + traders.length === 0) return
      setRendering(true)
      for (let i = 0; i < pages.length; i++) {
        const c = canvasRefs.current[i]
        if (c && !cancelled) await tpDrawPage(c, pages[i].iso, pages[i].traders, imgCache.current)
      }
      if (!cancelled) setRendering(false)
    }
    draw()
    return () => { cancelled = true }
  }, [iso, traders])

  useEffect(() => {
    if (src !== 'db') return
    const t = setTimeout(async () => {
      let q = supabase.from('pin_database').select('id, name, image_url').eq('status', 'approved').order('name').limit(40)
      if (dbQuery.trim()) q = q.ilike('name', `%${dbQuery.trim()}%`)
      const { data } = await q
      setDbRows(data || [])
    }, 250)
    return () => clearTimeout(t)
  }, [src, dbQuery])

  useEffect(() => {
    if (src !== 'checklist' || checklists.length) return
    supabase.from('pin_checklists').select('*').order('title').then(({ data }) => setChecklists(data || []))
  }, [src])

  useEffect(() => {
    if (!checklistId) { setClItems([]); return }
    const cl = checklists.find(c => c.id === checklistId)
    if (!cl) return
    let cancelled = false
    setClLoading(true)
    ;(async () => {
      const { data } = await supabase.from('checklist_progress').select('progress').eq('user_id', userId).eq('checklist_id', cl.id).maybeSingle()
      const items = await tpCropChecklist(cl, data?.progress || {})
      if (!cancelled) { setClItems(items); setClLoading(false) }
    })()
    return () => { cancelled = true }
  }, [checklistId, checklists])

  const target = picking === 'iso' ? iso : traders
  const setTarget = picking === 'iso' ? setIso : setTraders
  const isPicked = key => target.some(x => x.key === key)
  function toggle(item) {
    setTarget(prev => prev.some(x => x.key === item.key) ? prev.filter(x => x.key !== item.key) : [...prev, item])
  }

  async function onUpload(e) {
    const files = Array.from(e.target.files || [])
    const added = []
    for (const f of files) {
      const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = ev => res(ev.target.result); r.readAsDataURL(f) })
      const img = await tpLoadImage(dataUrl)
      let out = dataUrl
      if (img) {
        const scale = Math.min(1, 700 / Math.max(img.width, img.height))
        const c = document.createElement('canvas'); c.width = img.width*scale; c.height = img.height*scale
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        out = c.toDataURL('image/jpeg', 0.85)
      }
      added.push({ key:`up-${Date.now()}-${Math.random()}`, name: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), img: out })
    }
    setTarget(prev => [...prev, ...added])
    e.target.value = ''
  }

  function renameItem(setter, key, name) { setter(prev => prev.map(x => x.key === key ? { ...x, name } : x)) }

  function download(i) {
    const c = canvasRefs.current[i]; if (!c) return
    c.toBlob(blob => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
      a.download = pageCount > 1 ? `castlepins-trade-post-${i+1}.png` : 'castlepins-trade-post.png'
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    }, 'image/png')
  }
  async function downloadAll() { for (let i = 0; i < pageCount; i++) { download(i); await new Promise(r => setTimeout(r, 400)) } }
  async function copyText() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copy your post text:', text) }
  }

  const pinItem = p => ({ key:`pin-${p.id}`, name:p.name, img:p.image_url })
  let pickList = []
  if (src === 'have') pickList = pins.filter(p => p.list === 'have').map(pinItem)
  else if (src === 'want') pickList = pins.filter(p => p.list === 'want').map(pinItem)
  else if (src === 'book') pickList = bookId ? pins.filter(p => (p.book_ids||[]).includes(bookId)).map(pinItem) : []
  else if (src === 'checklist') pickList = clItems
  else if (src === 'db') pickList = dbRows.map(r => ({ key:`db-${r.id}`, name:r.name, img:r.image_url }))

  const card = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:14, marginBottom:14 }
  const chip = active => ({ padding:'6px 12px', borderRadius:16, border:`1px solid ${active?'rgba(124,58,237,0.6)':'rgba(255,255,255,0.15)'}`, background:active?'rgba(124,58,237,0.3)':'transparent', color:active?'#e2d9f3':'#94a3b8', fontSize:12, cursor:'pointer', fontWeight:'bold' })
  const primary = { padding:'10px 14px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#7c3aed,#db2777)', color:'#fff', fontSize:13, fontWeight:'bold', cursor:'pointer' }

  function Section({ id, title, color, items, setter }) {
    return (
      <div style={{ ...card, borderColor: color + '66' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:14, fontWeight:'bold', color }}>{title} <span style={{ color:'#64748b', fontWeight:'normal' }}>({items.length})</span></div>
          <button onClick={() => setPicking(picking === id ? null : id)} style={chip(picking === id)}>{picking === id ? 'Done' : '+ Add pins'}</button>
        </div>
        {items.length === 0 && <div style={{ fontSize:12, color:'#64748b' }}>No pins yet. Tap "Add pins" to choose from your collection, wish list, books, the pin database, or upload photos.</div>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(88px,1fr))', gap:8 }}>
          {items.map(it => (
            <div key={it.key} style={{ position:'relative', background:'rgba(255,255,255,0.05)', borderRadius:10, padding:4 }}>
              <button onClick={() => setter(prev => prev.filter(x => x.key !== it.key))} aria-label="Remove"
                style={{ position:'absolute', top:2, right:2, width:20, height:20, borderRadius:10, border:'none', background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:12, cursor:'pointer', lineHeight:'20px', padding:0 }}>×</button>
              <div style={{ height:80, borderRadius:8, overflow:'hidden', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {it.img ? <img src={it.img} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <span style={{ fontSize:26 }}>📌</span>}
              </div>
              <input value={it.name} onChange={e => renameItem(setter, it.key, e.target.value)}
                style={{ width:'100%', marginTop:4, padding:'3px 4px', fontSize:10, borderRadius:5, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(0,0,0,0.25)', color:'#e2e8f0' }} />
            </div>
          ))}
        </div>
        {picking === id && (
          <div style={{ marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:12 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
              {[['have','🎒 Collection'],['want','⭐ Wish List'],['book','📚 Books'],['checklist','✅ Checklists'],['db','📋 Database'],['upload','📷 Upload']].map(([k,l]) => (
                <button key={k} onClick={() => setSrc(k)} style={chip(src===k)}>{l}</button>
              ))}
            </div>
            {src === 'book' && (
              <select value={bookId} onChange={e => setBookId(e.target.value)} style={{ width:'100%', padding:8, borderRadius:8, marginBottom:10, background:'#1a1040', color:'#f1f5f9', border:'1px solid rgba(255,255,255,0.15)' }}>
                <option value="">Choose a book...</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.emoji ? b.emoji + ' ' : ''}{b.name}</option>)}
              </select>
            )}
            {src === 'checklist' && (
              <div style={{ marginBottom:10 }}>
                <select value={checklistId} onChange={e => setChecklistId(e.target.value)} style={{ width:'100%', padding:8, borderRadius:8, marginBottom:8, background:'#1a1040', color:'#f1f5f9', border:'1px solid rgba(255,255,255,0.15)' }}>
                  <option value="">Choose a checklist...</option>
                  {checklists.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                {clItems.length > 0 && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {[['missing','❌ Add all missing'],['found','✅ Add all found']].map(([st,label]) => (
                      <button key={st} style={chip(false)} onClick={() => {
                        const add = clItems.filter(i => i.status === st && !isPicked(i.key))
                        setTarget(prev => [...prev, ...add])
                      }}>{label}</button>
                    ))}
                  </div>
                )}
                {clLoading && <div style={{ fontSize:11, color:'#64748b', marginTop:6 }}>Loading pins from the checklist...</div>}
                {clItems.length > 0 && <div style={{ fontSize:11, color:'#64748b', marginTop:6 }}>Tap pins to add them, or use the buttons. Your found/missing marks from the checklist are shown.</div>}
              </div>
            )}
            {src === 'db' && <input className="search-bar" placeholder="🔍 Search the pin database..." value={dbQuery} onChange={e => setDbQuery(e.target.value)} />}
            {src === 'upload' ? (
              <div>
                <input ref={uploadRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={onUpload} />
                <button onClick={() => uploadRef.current?.click()} style={primary}>Choose photos</button>
                <div style={{ fontSize:11, color:'#64748b', marginTop:6 }}>Each photo becomes one pin tile. Rename it under the tile.</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(76px,1fr))', gap:8, maxHeight:280, overflowY:'auto' }}>
                {pickList.length === 0 && <div style={{ fontSize:12, color:'#64748b', gridColumn:'1/-1' }}>{src==='book' && !bookId ? 'Pick a book above.' : 'Nothing here yet.'}</div>}
                {pickList.map(it => (
                  <button key={it.key} onClick={() => toggle(it)} title={it.name}
                    style={{ position:'relative', padding:3, borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,0.05)', border:`2px solid ${isPicked(it.key)?'#a78bfa':'transparent'}` }}>
                    <div style={{ height:64, borderRadius:6, overflow:'hidden', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {it.img ? <img src={it.img} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <span style={{ fontSize:22 }}>📌</span>}
                    </div>
                    <div style={{ fontSize:9, color:'#cbd5e1', marginTop:3, height:22, overflow:'hidden' }}>{it.name}</div>
                    {it.status && <span style={{ position:'absolute', top:4, left:4, background: it.status==='found' ? '#34d399' : '#f87171', color:'#0b0f1a', borderRadius:8, fontSize:10, padding:'0 5px', fontWeight:'bold' }}>{it.status==='found' ? '✓' : '✕'}</span>}
                    {isPicked(it.key) && <span style={{ position:'absolute', top:4, right:4, background:'#7c3aed', color:'#fff', borderRadius:8, fontSize:10, padding:'0 5px' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding:'12px 4px', maxWidth:760, margin:'0 auto' }}>
      <div style={{ fontSize:18, fontWeight:'bold', color:'#f1f5f9', marginBottom:4 }}>📣 Trade Post Maker</div>
      <div style={{ fontSize:12, color:'#64748b', marginBottom:14 }}>Build a picture for Facebook trading groups: pins you want (ISO) and pins you have to trade.</div>

      {Section({ id:'iso', title:'ISO: In Search Of', color:'#f472b6', items:iso, setter:setIso })}
      {Section({ id:'traders', title:'Traders: Available to Trade', color:'#34d399', items:traders, setter:setTraders })}

      <div style={card}>
        <div style={{ fontSize:14, fontWeight:'bold', color:'#c4b5fd', marginBottom:8 }}>Post text</div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={6}
          style={{ width:'100%', padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.04)', color:'#f1f5f9', fontSize:13, lineHeight:1.5, resize:'vertical' }} />
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <button onClick={copyText} style={primary}>{copied ? '✓ Copied' : 'Copy text'}</button>
          <button onClick={() => setText(TP_DEFAULT_TEXT)} style={chip(false)}>Reset text</button>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize:14, fontWeight:'bold', color:'#c4b5fd', marginBottom:8 }}>Preview {rendering && <span style={{ color:'#64748b', fontWeight:'normal' }}>(drawing...)</span>}</div>
        {iso.length + traders.length === 0 ? (
          <div style={{ fontSize:12, color:'#64748b' }}>Add pins above to see your post.</div>
        ) : (
          <>
            {pageCount > 1 && <div style={{ fontSize:11, color:'#94a3b8', marginBottom:8 }}>That's a lot of pins. Facebook posts look best with {TP_PER_IMAGE} or fewer per section, so this is split into {pageCount} images.</div>}
            {pages.map((_, i) => (
              <div key={i} style={{ marginBottom:14 }}>
                <canvas ref={el => { canvasRefs.current[i] = el }} style={{ width:'100%', height:'auto', borderRadius:10, display:'block' }} />
                <button onClick={() => download(i)} style={{ ...primary, marginTop:8, width:'100%' }}>⬇️ Download PNG{pageCount > 1 ? ` (${i+1} of ${pageCount})` : ''}</button>
              </div>
            ))}
            {pageCount > 1 && <button onClick={downloadAll} style={chip(true)}>Download all {pageCount}</button>}
          </>
        )}
      </div>
    </div>
  )
}

// ── Mail Trade Tracking ───────────────────────────────────────────────────────
const MT_OVERDUE_AFTER_DAYS = 8

function mtToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d
}
function mtDaysSince(dateStr) {
  if (!dateStr) return 0
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.floor((mtToday() - new Date(y, m - 1, d)) / 86400000)
}
// Status shown to the user. "Overdue" is worked out from the trade date each time the page opens.
function mtDisplayStatus(row) {
  if (row.status === 'complete') return { key:'complete', label:'Complete' }
  const days = mtDaysSince(row.trade_date)
  if (days > MT_OVERDUE_AFTER_DAYS) return { key:'overdue', label:`Overdue ${days} days`, days }
  return { key:'in_progress', label:'In Progress' }
}
function mtIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
// Accepts 11/4/2026, 11/4/26, 2026-11-04
function mtParseDate(v) {
  const t = (v || '').trim(); if (!t) return null
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) { const yr = m[3].length === 2 ? '20' + m[3] : m[3]; return `${yr}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}` }
  return null
}
const MT_COLORS = {
  in_progress: { fg:'#fbbf24', bg:'rgba(251,191,36,0.12)', bd:'rgba(251,191,36,0.4)' },
  overdue:     { fg:'#f87171', bg:'rgba(248,113,113,0.14)', bd:'rgba(248,113,113,0.5)' },
  complete:    { fg:'#34d399', bg:'rgba(52,211,153,0.12)', bd:'rgba(52,211,153,0.4)' },
}

function MailTradesPage({ userId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('mail_trades').select('*').eq('user_id', userId).order('trade_date', { ascending:false }).order('created_at', { ascending:false })
    if (error) setError('Could not load trades: ' + error.message)
    setRows(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [userId])

  async function addRow() {
    const today = mtIso(new Date())
    const { data, error } = await supabase.from('mail_trades').insert([{ user_id:userId, trade_date:today, date_sent:today }]).select().single()
    if (error) { setError(error.message); return }
    setRows(prev => [data, ...prev])
  }
  function edit(id, field, value) { setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)) }
  async function save(id, field, value) {
    setError('')
    const { error } = await supabase.from('mail_trades').update({ [field]: value === '' && (field === 'date_sent') ? null : value, updated_at:new Date().toISOString() }).eq('id', id)
    if (error) setError('Could not save: ' + error.message)
  }
  async function remove(row) {
    if (!window.confirm(`Delete the trade with ${row.trader_name || 'this trader'}?`)) return
    const { error } = await supabase.from('mail_trades').delete().eq('id', row.id)
    if (error) { setError(error.message); return }
    setRows(prev => prev.filter(r => r.id !== row.id))
  }
  async function runImport() {
    setError('')
    // Paste rows copied from Excel: Trader | Date of Trade | Pins to receive | Pins sent | Date sent | Tracking | Status
    const lines = importText.split(/\r?\n/).map(l => l.split('\t')).filter(c => c.some(x => x.trim()))
    const body = lines.filter(c => !/^trader$/i.test((c[0] || '').trim()))
    const records = body.map(c => {
      const st = (c[6] || '').toLowerCase()
      return {
        user_id:userId, trader_name:(c[0]||'').trim(), trade_date:mtParseDate(c[1]) || mtIso(new Date()),
        pins_to_receive:(c[2]||'').trim(), pins_sent:(c[3]||'').trim(), date_sent:mtParseDate(c[4]),
        tracking:(c[5]||'').replace(/\s+/g,''), status: st.includes('complete') ? 'complete' : 'in_progress'
      }
    })
    if (!records.length) { setError('Nothing to import. Copy the rows from your spreadsheet and paste them here.'); return }
    const { error } = await supabase.from('mail_trades').insert(records)
    if (error) { setError(error.message); return }
    setImportText(''); setShowImport(false); setError(''); load()
  }

  const withStatus = rows.map(r => ({ ...r, ds: mtDisplayStatus(r) }))
  const counts = { all:rows.length, in_progress:0, overdue:0, complete:0 }
  withStatus.forEach(r => { counts[r.ds.key]++ })
  const shown = withStatus.filter(r => filter === 'all' || r.ds.key === filter)

  const cell = { padding:'6px 6px', borderBottom:'1px solid rgba(255,255,255,0.07)', verticalAlign:'middle' }
  const input = { width:'100%', padding:'7px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', color:'#f1f5f9', fontSize:13, minWidth:0 }
  const head = { ...cell, fontSize:11, color:'#94a3b8', textAlign:'left', fontWeight:'bold', whiteSpace:'nowrap', position:'sticky', top:0, background:'#1a1040' }
  const chip = active => ({ padding:'6px 12px', borderRadius:16, border:`1px solid ${active?'rgba(124,58,237,0.6)':'rgba(255,255,255,0.15)'}`, background:active?'rgba(124,58,237,0.3)':'transparent', color:active?'#e2d9f3':'#94a3b8', fontSize:12, cursor:'pointer', fontWeight:'bold' })
  const primary = { padding:'9px 14px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#7c3aed,#db2777)', color:'#fff', fontSize:13, fontWeight:'bold', cursor:'pointer' }

  return (
    <div style={{ padding:'12px 4px' }}>
      <div style={{ fontSize:18, fontWeight:'bold', color:'#f1f5f9', marginBottom:4 }}>📬 Mail Trade Tracking</div>
      <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>Keep track of pins you've traded by mail. A trade turns <span style={{ color:'#f87171' }}>Overdue</span> when it is still In Progress more than {MT_OVERDUE_AFTER_DAYS} days after the trade date.</div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
        {[['all','All'],['in_progress','In Progress'],['overdue','Overdue'],['complete','Complete']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={chip(filter === k)}>{l} ({counts[k]})</button>
        ))}
        <div style={{ flex:1 }} />
        <button onClick={() => { setShowImport(v => !v); setError('') }} style={chip(showImport)}>Paste from spreadsheet</button>
        <button onClick={addRow} style={primary}>+ Add trade</button>
      </div>

      {showImport && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:12, marginBottom:12 }}>
          <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>In Excel or Google Sheets, select your rows (Trader through Trade Complete), copy, and paste below. Columns should be in this order: Trader, Date of Trade, Pins to receive, Pins sent, Date sent, Tracking, Status.</div>
          <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={5} placeholder="Paste here..."
            style={{ ...input, fontFamily:'monospace', fontSize:12, marginBottom:8 }} />
          <button onClick={runImport} style={primary}>Import rows</button>
        </div>
      )}

      {error && <div style={{ color:'#f87171', fontSize:12, marginBottom:10 }}>⚠️ {error}</div>}

      {loading ? <div style={{ textAlign:'center', color:'#64748b', padding:20 }}>Loading...</div> : shown.length === 0 ? (
        <div style={{ textAlign:'center', color:'#64748b', padding:30, fontSize:13 }}>{rows.length === 0 ? 'No trades yet. Tap "+ Add trade" to start.' : 'No trades in this view.'}</div>
      ) : (
        <div style={{ overflowX:'auto', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12 }}>
          <table style={{ width:'100%', minWidth:1020, borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...head, minWidth:130 }}>Trader</th>
                <th style={{ ...head, minWidth:128 }}>Date of Trade</th>
                <th style={{ ...head, minWidth:150 }}>Pins to Receive</th>
                <th style={{ ...head, minWidth:150 }}>Pins Sent</th>
                <th style={{ ...head, minWidth:128 }}>Date Sent</th>
                <th style={{ ...head, minWidth:210 }}>Tracking</th>
                <th style={{ ...head, minWidth:150 }}>Status</th>
                <th style={{ ...head, width:40 }}></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(r => {
                const c = MT_COLORS[r.ds.key]
                return (
                  <tr key={r.id}>
                    <td style={cell}><input style={input} value={r.trader_name} onChange={e => edit(r.id,'trader_name',e.target.value)} onBlur={e => save(r.id,'trader_name',e.target.value)} placeholder="Trader" /></td>
                    <td style={cell}><input style={input} type="date" value={r.trade_date || ''} onChange={e => { edit(r.id,'trade_date',e.target.value); if (e.target.value) save(r.id,'trade_date',e.target.value) }} /></td>
                    <td style={cell}><input style={input} value={r.pins_to_receive} onChange={e => edit(r.id,'pins_to_receive',e.target.value)} onBlur={e => save(r.id,'pins_to_receive',e.target.value)} /></td>
                    <td style={cell}><input style={input} value={r.pins_sent} onChange={e => edit(r.id,'pins_sent',e.target.value)} onBlur={e => save(r.id,'pins_sent',e.target.value)} /></td>
                    <td style={cell}><input style={input} type="date" value={r.date_sent || ''} onChange={e => { edit(r.id,'date_sent',e.target.value); save(r.id,'date_sent',e.target.value) }} /></td>
                    <td style={cell}>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input style={input} value={r.tracking} onChange={e => edit(r.id,'tracking',e.target.value)} onBlur={e => { const v = e.target.value.replace(/\s+/g,''); edit(r.id,'tracking',v); save(r.id,'tracking',v) }} placeholder="USPS tracking #" inputMode="numeric" />
                        {r.tracking && (
                          <a href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(r.tracking)}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize:11, color:'#a78bfa', whiteSpace:'nowrap', textDecoration:'none', border:'1px solid rgba(167,139,250,0.4)', borderRadius:6, padding:'6px 8px' }}>Track ↗</a>
                        )}
                      </div>
                    </td>
                    <td style={cell}>
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <span style={{ display:'inline-block', textAlign:'center', fontSize:12, fontWeight:'bold', color:c.fg, background:c.bg, border:`1px solid ${c.bd}`, borderRadius:8, padding:'5px 8px', whiteSpace:'nowrap' }}>{r.ds.label}</span>
                        <select value={r.status} onChange={e => { edit(r.id,'status',e.target.value); save(r.id,'status',e.target.value) }}
                          style={{ ...input, padding:'4px 6px', fontSize:11, background:'#1a1040' }}>
                          <option value="in_progress">In Progress</option>
                          <option value="complete">Complete</option>
                        </select>
                      </div>
                    </td>
                    <td style={cell}><button onClick={() => remove(r)} title="Delete" style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:16 }}>🗑</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Admin: manage users ───────────────────────────────────────────────────────
function AdminUsers({ currentUserId }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin-list-users', { method:'POST', headers: await authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load users')
      setUsers(data.users || [])
    } catch (e) { setError(e.message) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function remove(u) {
    if (!window.confirm(`Delete ${u.email}?\n\nThis permanently erases their account, pins, books, mystery boxes and photos.`)) return
    setBusy(u.id)
    try {
      const res = await fetch('/api/admin-delete-user', { method:'POST', headers: await authHeaders(), body: JSON.stringify({ userId: u.id }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      setUsers(prev => prev.filter(x => x.id !== u.id))
    } catch (e) { setError(e.message) }
    setBusy(null)
  }

  const filtered = users.filter(u => !search.trim() || `${u.email} ${u.display_name||''}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <div style={{ padding:'12px 4px' }}>
      <div style={{ fontSize:18, fontWeight:'bold', color:'#f1f5f9', marginBottom:4 }}>👥 Users (Admin)</div>
      <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>{users.length} accounts</div>
      <input className="search-bar" placeholder="🔍 Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
      {error && <div style={{ color:'#f87171', fontSize:12, margin:'8px 0' }}>{error}</div>}
      {loading ? <div style={{ textAlign:'center', color:'#64748b', padding:20 }}>Loading...</div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
          {filtered.map(u => (
            <div key={u.id} style={{ display:'flex', gap:10, alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:'#f1f5f9', fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}{u.is_admin && ' 👑'}</div>
                <div style={{ fontSize:11, color:'#64748b' }}>{[u.display_name, u.created_at && new Date(u.created_at).toLocaleDateString()].filter(Boolean).join(' • ')}</div>
              </div>
              {u.id !== currentUserId && !u.is_admin && (
                <button disabled={busy===u.id} onClick={() => remove(u)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid rgba(248,113,113,0.3)', background:'transparent', color:'#f87171', fontSize:11, cursor:'pointer' }}>{busy===u.id ? '...' : 'Delete'}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [pins, setPins] = useState([])
  const [books, setBooks] = useState([])
  const [mysteryBoxes, setMysteryBoxes] = useState([])
  const [booksSubTab, setBooksSubTab] = useState('mine')
  const [tab, setTab] = useState('have')
  const [pinsLoading, setPinsLoading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [legalPage, setLegalPage] = useState(null) // 'terms' | 'privacy' | null
  const [multiScan, setMultiScan] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) { setUser(data.session.user); fetchAll(data.session.user.id) }
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setResetMode(true); return }
      if (session?.user) { setUser(session.user); fetchAll(session.user.id) }
      else { setUser(null); setPins([]); setBooks([]); setMysteryBoxes([]) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchAll(uid) {
    setPinsLoading(true)
    const [pinsRes, booksRes, pinBooksRes, mysteryBoxesRes] = await Promise.all([
      supabase.from('pins').select('*').eq('user_id', uid).order('created_at', { ascending:false }),
      supabase.from('books').select('*').eq('user_id', uid).order('created_at', { ascending:true }),
      supabase.from('pin_books').select('*'),
      supabase.from('mystery_boxes').select('*').eq('user_id', uid).order('created_at', { ascending:false }),
    ])
    setMysteryBoxes(mysteryBoxesRes.data || [])
    // Fetch subscription and profile separately to handle missing rows gracefully
    const { data: subData, error: subErr } = await supabase.from('subscriptions').select('*').eq('user_id', uid).maybeSingle()
    const { data: profileData, error: profileErr } = await supabase.from('profiles').select('is_admin, trading_enabled, display_name, email').eq('id', uid).maybeSingle()
    const pinsData = pinsRes.data || []
    const pinBooksData = pinBooksRes.data || []
    const pinsWithBooks = pinsData.map(p => ({
      ...p,
      book_ids: pinBooksData.filter(pb => pb.pin_id === p.id).map(pb => pb.book_id)
    }))
    setPins(pinsWithBooks)
    setBooks(booksRes.data || [])
    setSubscription({
      ...(subData || {}),
      is_admin: profileData?.is_admin || false
    })
    setProfile(profileData || { trading_enabled: false })
    setPinsLoading(false)
  }

  async function addMultiplePins(pinsData, list, scanImageData) {
    // Upload the scan photo once and reuse its URL for every pin from this scan
    let sharedImageUrl = null
    if (scanImageData) {
      try {
        const blob = await (await fetch(scanImageData)).blob()
        const path = `${user.id}/multiscan-${Date.now()}.jpg`
        const { error: upErr } = await supabase.storage.from('pin-images').upload(path, blob)
        if (!upErr) {
          const { data } = supabase.storage.from('pin-images').getPublicUrl(path)
          sharedImageUrl = data.publicUrl
        } else console.error('Scan photo upload error:', upErr)
      } catch (e) { console.error('Scan photo upload error:', e) }
    }
    for (const pin of pinsData) {
      await supabase.from('pins').insert([{
        name: (pin.name || 'Unnamed pin').trim(),
        series: (pin.series || '').trim(),
        description: (pin.description || '').trim(),
        list,
        user_id: user.id,
        image_url: sharedImageUrl
      }])
    }
    await fetchAll(user.id)
  }

  async function addPin(d) {
    const { data, error } = await supabase.from('pins').insert([{...d, user_id:user.id}]).select().single()
    if (!error && data) { setPins(prev => [data,...prev]); setTab(d.list) }
    else if (error) console.error('Add pin error:', error)
  }

  function updatePinLocal(id, patch) {
    setPins(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  // Creates a pin from a pin-database record and (optionally) puts it straight into a book
  async function addPinFromDatabase(payload, bookId) {
    const { data, error } = await supabase.from('pins').insert([{ ...payload, user_id: user.id }]).select().single()
    if (error) throw error
    let pin = { ...data, book_ids: [] }
    if (bookId) {
      const { error: bErr } = await supabase.from('pin_books').upsert({ pin_id: data.id, book_id: bookId })
      if (!bErr) pin.book_ids = [bookId]
    }
    setPins(prev => [pin, ...prev])
    return pin
  }

  async function deletePin(id, imageUrl) {
    if (imageUrl && imageUrl.includes('supabase')) {
      const path = imageUrl.split('/pin-images/')[1]
      // Never delete shared database pictures (db/ folder) when a user removes their pin
      if (path && !path.startsWith('db/')) await supabase.storage.from('pin-images').remove([path])
    }
    await supabase.from('pins').delete().eq('id', id)
    setPins(prev => prev.filter(p => p.id!==id))
  }

  async function movePin(id, toList) {
    await supabase.from('pins').update({ list:toList }).eq('id', id)
    setPins(prev => prev.map(p => p.id===id ? {...p, list:toList} : p))
  }

  async function addBook(d) {
    const { data, error } = await supabase.from('books').insert([{...d, user_id:user.id}]).select().single()
    if (!error && data) setBooks(prev => [...prev, data])
    else if (error) console.error('Add book error:', error)
  }

  async function deleteBook(id) {
    await supabase.from('books').delete().eq('id', id)
    setBooks(prev => prev.filter(b => b.id !== id))
    setPins(prev => prev.map(p => p.book_id === id ? {...p, book_id: null} : p))
  }

  async function updateBook(id, updates) {
    await supabase.from('books').update(updates).eq('id', id)
    setBooks(prev => prev.map(b => b.id === id ? {...b, ...updates} : b))
  }

  async function addMysteryBox(d) {
    const { id, ...rest } = d
    const { data, error } = await supabase.from('mystery_boxes').insert([{ ...rest, user_id:user.id }]).select().single()
    if (!error && data) setMysteryBoxes(prev => [data, ...prev])
    else if (error) console.error('Add mystery box error:', error)
  }

  async function updateMysteryBox(d) {
    const { id, ...rest } = d
    const { data, error } = await supabase.from('mystery_boxes').update(rest).eq('id', id).select().single()
    if (!error && data) setMysteryBoxes(prev => prev.map(b => b.id === id ? data : b))
    else if (error) console.error('Update mystery box error:', error)
  }

  async function deleteMysteryBox(box) {
    const urls = [box.front_image_url, box.back_image_url, ...(box.side_image_urls || [])].filter(Boolean)
    const paths = urls.filter(u => u.includes('supabase')).map(u => u.split('/pin-images/')[1]).filter(Boolean)
    if (paths.length) await supabase.storage.from('pin-images').remove(paths)
    await supabase.from('mystery_boxes').delete().eq('id', box.id)
    setMysteryBoxes(prev => prev.filter(b => b.id !== box.id))
  }

  const hasAccess = subscription?.status === 'active' || subscription?.is_admin === true
  const isAdminUser = subscription?.is_admin === true

  async function handleUpgrade(plan) {
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ plan, userId: user.id, email: user.email })
      })
      const { url } = await res.json()
      window.location.href = url
    } catch(e) { console.error('Upgrade error:', e) }
  }

  async function toggleTrader(pinId, isTrader) {
    await supabase.from('pins').update({ is_trader: isTrader }).eq('id', pinId)
    setPins(prev => prev.map(p => p.id === pinId ? {...p, is_trader: isTrader} : p))
    // Auto-create PinCastle Traders book if enabling trader and it doesn't exist
    if (isTrader) {
      const tradersBook = books.find(b => b.name === 'PinCastle Traders')
      let bookId = tradersBook?.id
      if (!bookId) {
        const { data } = await supabase.from('books').insert([{
          user_id: user.id, name: 'PinCastle Traders', emoji: '🤝', is_public: true, is_traders_book: true
        }]).select().single()
        if (data) { setBooks(prev => [...prev, data]); bookId = data.id }
      }
      if (bookId) {
        await supabase.from('pin_books').upsert({ pin_id: pinId, book_id: bookId })
        setPins(prev => prev.map(p => p.id === pinId ? {...p, book_ids: [...new Set([...(p.book_ids||[]), bookId])]} : p))
      }
    }
  }

  async function updateProfile(updates) {
    const merged = {
      id: user.id,
      email: user.email,
      ...(profile || {}),
      ...updates
    }
    const { data } = await supabase.from('profiles').upsert(merged).select().single()
    if (data) setProfile(data)
    else setProfile(prev => ({ ...(prev || {}), ...updates }))
    // Auto-create traders book when enabling trading
    if (updates.trading_enabled && !books.find(b => b.name === 'PinCastle Traders')) {
      const { data: book } = await supabase.from('books').insert([{
        user_id: user.id, name: 'PinCastle Traders', emoji: '🤝', is_public: true, is_traders_book: true
      }]).select().single()
      if (book) setBooks(prev => [...prev, book])
    }
  }

  async function assignPin(pinId, bookId, remove = false) {
    if (remove) {
      await supabase.from('pin_books').delete().eq('pin_id', pinId).eq('book_id', bookId)
      setPins(prev => prev.map(p => p.id === pinId ? {...p, book_ids: (p.book_ids||[]).filter(id => id !== bookId)} : p))
    } else {
      await supabase.from('pin_books').upsert({ pin_id: pinId, book_id: bookId })
      setPins(prev => prev.map(p => p.id === pinId ? {...p, book_ids: [...new Set([...(p.book_ids||[]), bookId])]} : p))
    }
  }

  if (!authChecked) return (
    <div style={{ minHeight:'100vh', background:'#0f0a1e', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa', fontSize:18 }}>
      🏰 Loading CastlePins...
    </div>
  )

  if (legalPage) return <LegalPage page={legalPage} onBack={() => setLegalPage(null)} />
  if (resetMode) return <ResetPasswordScreen onDone={() => { setResetMode(false) }} />
  if (!user) return <AuthScreen onLogin={u => { setUser(u); fetchAll(u.id) }} onLegal={setLegalPage} />

  const haveCount = pins.filter(p => p.list==='have').length
  const wantCount = pins.filter(p => p.list==='want').length

  const navItems = [
    { id:'have',    icon:'🎒', label:'Collection', count:haveCount },
    { id:'want',    icon:'⭐', label:'Wish List',  count:wantCount },
    { id:'books',   icon:'📚', label:'Books',      count:books.length > 0 ? books.length : null },
    { id:'mystery', icon:'🎁', label:'Mystery Boxes', count:mysteryBoxes.length > 0 ? mysteryBoxes.length : null },
    { id:'add',     icon:'＋', label:'Add Pin' },
    ...(TRADING_ENABLED ? [{ id:'trade', icon:'🤝', label:'Trade' }] : []),
    { id:'profile', icon:'👤', label:'Profile' },
    { id:'mailtrades', icon:'📬', label:'Mail Trades' },
    { id:'tradepost', icon:'📣', label:'Trade Post' },
    { id:'pindb', icon:'📋', label:'Pin Database' },
    ...(isAdminUser ? [{ id:'pin-review', icon:'✅', label:'Review Queue' }, { id:'users', icon:'👥', label:'Users' }, { id:'checklist-admin', icon:'🗂️', label:'Checklist Admin' }] : [])
  ]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0f0a1e,#1a1040,#0f172a)' }}>
      <style>{css}</style>

      {/* Desktop top nav */}
      <div className="top-nav">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:26 }}>🏰</span>
          <span style={{ fontSize:20, color:'#f9fafb', letterSpacing:3, fontWeight:'bold' }}>CastlePins</span>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {navItems.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'8px 15px', border:`1px solid ${tab===t.id?'rgba(124,58,237,0.5)':'transparent'}`, borderRadius:10, background:tab===t.id?'rgba(124,58,237,0.25)':'transparent', color:tab===t.id?'#e2d9f3':'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:'bold', display:'flex', alignItems:'center', gap:6 }}>
              {t.icon} {t.label}
              {t.count != null && t.count > 0 && <span style={{ background:'rgba(124,58,237,0.5)', color:'#e2d9f3', borderRadius:10, padding:'1px 7px', fontSize:11 }}>{t.count}</span>}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:'bold', color:'#fff' }}>
            {user.email[0].toUpperCase()}
          </div>
          <div style={{ fontSize:11, color:'#64748b', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="mobile-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>🏰</span>
          <span style={{ fontSize:17, color:'#f9fafb', letterSpacing:2, fontWeight:'bold' }}>CastlePins</span>
        </div>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:'bold', color:'#fff' }}>
          {user.email[0].toUpperCase()}
        </div>
      </div>

      {/* Main */}
      <div className="main-content">
        {tab==='have'    && <PinList pins={pins} listType="have" onDelete={deletePin} onMove={movePin} onToggleTrader={TRADING_ENABLED ? toggleTrader : undefined} onPinChange={updatePinLocal} loading={pinsLoading} userId={user.id} />}
        {tab==='want'    && <PinList pins={pins} listType="want" onDelete={deletePin} onMove={movePin} onToggleTrader={TRADING_ENABLED ? toggleTrader : undefined} onPinChange={updatePinLocal} loading={pinsLoading} userId={user.id} />}
        {tab==='books'   && (
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <button onClick={() => setBooksSubTab('mine')}
                style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer', fontSize:12, fontWeight:'bold',
                  background: booksSubTab==='mine' ? '#7c3aed' : 'transparent', color: booksSubTab==='mine' ? '#fff' : '#94a3b8' }}>
                My Books
              </button>
              <button onClick={() => setBooksSubTab('checklists')}
                style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer', fontSize:12, fontWeight:'bold',
                  background: booksSubTab==='checklists' ? '#7c3aed' : 'transparent', color: booksSubTab==='checklists' ? '#fff' : '#94a3b8' }}>
                Checklists
              </button>
            </div>
            {booksSubTab === 'mine'
              ? <BooksPage books={books} pins={pins} onAddBook={addBook} onDeleteBook={deleteBook} onAssignPin={assignPin} onUpdateBook={updateBook} onAddFromDatabase={addPinFromDatabase} onPinChange={updatePinLocal} hasAccess={hasAccess} onUpgrade={handleUpgrade} userId={user.id} />
              : <PinChecklistsPage userId={user.id} />
            }
          </div>
        )}
        {tab==='mystery' && <MysteryBoxesPage boxes={mysteryBoxes} userId={user.id} onAdd={addMysteryBox} onUpdate={updateMysteryBox} onDelete={deleteMysteryBox} loading={pinsLoading} />}
        {tab==='add'     && (multiScan && hasAccess ? <MultiPinScanner onAddMultiple={addMultiplePins} userId={user.id} onClose={() => setMultiScan(false)} /> : <AddPinForm onAdd={addPin} userId={user.id} hasAccess={hasAccess} onUpgrade={handleUpgrade} onMultiScan={() => setMultiScan(true)} />)}
        {tab==='mailtrades' && <MailTradesPage userId={user.id} />}
        {tab==='tradepost' && <TradePostGenerator pins={pins} books={books} userId={user.id} />}
        {tab==='pindb'   && <AdminPinDatabase isAdmin={isAdminUser} userId={user.id} />}
        {tab==='pin-review' && isAdminUser && <AdminReviewQueue userId={user.id} />}
        {tab==='users' && isAdminUser && <AdminUsers currentUserId={user.id} />}
        {tab==='checklist-admin' && isAdminUser && <AdminChecklistBuilder />}
        {tab==='trade'   && TRADING_ENABLED && <TradingPage user={user} pins={pins} hasAccess={hasAccess} profile={profile} onUpdateProfile={updateProfile} onUpgrade={handleUpgrade} onLegal={setLegalPage} />}
        {tab==='profile' && <ProfilePage user={user} haveCount={haveCount} wantCount={wantCount} subscription={subscription} onUpgrade={handleUpgrade} profile={profile} onUpdateProfile={updateProfile} onLegal={setLegalPage} />}
      </div>

      {/* Mobile bottom nav: five main tabs + More */}
      {(() => {
        const mainIds = ['have','want','books','add']
        const mainItems = navItems.filter(t => mainIds.includes(t.id))
        const moreItems = navItems.filter(t => !mainIds.includes(t.id))
        const moreActive = moreItems.some(t => t.id === tab)
        return (
          <>
            {moreOpen && (
              <>
                <div className="more-backdrop" onClick={() => setMoreOpen(false)} />
                <div className="more-sheet">
                  {moreItems.map(t => (
                    <button key={t.id} className={`more-item ${tab===t.id?'active':''}`} onClick={() => { setTab(t.id); setMoreOpen(false) }}>
                      <span style={{ fontSize:24 }}>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="bottom-nav" style={{ zIndex:160 }}>
              {mainItems.map(t => (
                <button key={t.id} className={`nav-tab-btn ${tab===t.id?'active':''}`} onClick={() => { setTab(t.id); setMoreOpen(false) }}>
                  <span className="nav-icon">{t.icon}</span>
                  <span>{t.label}</span>
                  {t.count != null && t.count > 0 && (
                    <span style={{ position:'absolute', top:7, left:'50%', marginLeft:6, fontSize:9, background:'#7c3aed', color:'white', borderRadius:8, padding:'1px 5px', lineHeight:'14px' }}>{t.count}</span>
                  )}
                </button>
              ))}
              <button className={`nav-tab-btn ${moreActive||moreOpen?'active':''}`} onClick={() => setMoreOpen(o => !o)}>
                <span className="nav-icon">☰</span>
                <span>More</span>
              </button>
            </div>
          </>
        )
      })()}
    </div>
  )
}
