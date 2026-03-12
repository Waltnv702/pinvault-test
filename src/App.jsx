import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

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
function AuthScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email.includes('@') || pw.length < 6) { setError('Valid email and password (min 6 chars) required.'); return }
    setLoading(true); setError('')
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password: pw })
        if (error) throw error
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
      <div className="auth-card fade-up">
        <div style={{ fontSize:54, marginBottom:8 }}>🏰</div>
        <div style={{ fontSize:28, color:'#f9fafb', letterSpacing:3, marginBottom:4, fontWeight:'bold' }}>PinVault</div>
        <div style={{ color:'#a78bfa', fontSize:13, marginBottom:26 }}>Your Disney Pin Collection ✨</div>
        <div style={{ display:'flex', gap:8, marginBottom:18 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setMsg('') }}
              style={{ flex:1, padding:'12px 0', border:`1px solid ${mode===m?'#7c3aed':'rgba(255,255,255,0.1)'}`, borderRadius:10, background:mode===m?'rgba(124,58,237,0.35)':'transparent', color:mode===m?'#e2d9f3':'#94a3b8', cursor:'pointer', fontSize:14, fontWeight:600 }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
        <input className="field-input" type="email" placeholder="Email address" value={email} onChange={e => { setEmail(e.target.value); setError('') }} />
        <input className="field-input" type="password" placeholder="Password (min 6 chars)" value={pw} onChange={e => { setPw(e.target.value); setError('') }} onKeyDown={e => e.key==='Enter' && submit()} />
        {error && <div style={{ color:'#f87171', fontSize:13, marginBottom:10, textAlign:'left' }}>⚠️ {error}</div>}
        {msg && <div style={{ color:'#34d399', fontSize:13, marginBottom:10, textAlign:'left', lineHeight:1.5 }}>{msg}</div>}
        <button className="primary-btn" onClick={submit} disabled={loading}
          style={{ background:loading?'rgba(124,58,237,0.4)':'linear-gradient(135deg,#7c3aed,#db2777)', marginTop:4 }}>
          {loading ? '⏳ Please wait...' : mode==='login' ? '✨ Enter the Magic' : '🏰 Start My Collection'}
        </button>
      </div>
    </div>
  )
}

// ── Pin Card ──────────────────────────────────────────────────────────────────
function PinCard({ pin, onDelete, onMove }) {
  const [hov, setHov] = useState(false)
  const bg = COLORS[hashCode(pin.id) % COLORS.length]
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${hov?'rgba(124,58,237,0.5)':'rgba(255,255,255,0.09)'}`, borderRadius:14, overflow:'hidden', transition:'all .22s', transform:hov?'translateY(-3px)':'none', boxShadow:hov?'0 10px 28px rgba(124,58,237,0.2)':'0 2px 10px rgba(0,0,0,0.3)' }}>
      <div className="card-img" style={{ background:bg }}>
        {pin.image_url
          ? <img src={pin.image_url} alt={pin.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
          : <span style={{ fontSize:36, opacity:.65 }}>📌</span>}
        <div style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:5, padding:'2px 6px', fontSize:9, fontWeight:'bold', color:'#e2d9f3', letterSpacing:1 }}>
          {pin.list==='have'?'HAVE':'WANT'}
        </div>
      </div>
      <div style={{ padding:'10px 10px 10px' }}>
        <div className="card-name">{pin.name}</div>
        {pin.series && <div className="card-series">{pin.series}</div>}
        <div className="card-desc">{pin.description}</div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => onMove(pin.id, pin.list==='have'?'want':'have')}
            style={{ flex:1, padding:'7px 0', border:'1px solid rgba(124,58,237,0.4)', borderRadius:7, background:'rgba(124,58,237,0.15)', color:'#c4b5fd', cursor:'pointer', fontSize:11, fontWeight:600 }}>
            {pin.list==='have'?'→ Wish List':'→ Collection'}
          </button>
          <button onClick={() => onDelete(pin.id, pin.image_url)}
            style={{ width:28, height:28, border:'1px solid rgba(255,99,99,0.3)', borderRadius:7, background:'rgba(220,38,38,0.12)', color:'#f87171', cursor:'pointer', fontSize:12, fontWeight:'bold', flexShrink:0 }}>✕</button>
        </div>
      </div>
    </div>
  )
}

// ── Add Pin ───────────────────────────────────────────────────────────────────
function AddPinForm({ onAdd, userId }) {
  const [name, setName] = useState('')
  const [series, setSeries] = useState('')
  const [desc, setDesc] = useState('')
  const [list, setList] = useState('have')
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file); setImageUrl('')
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
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
      await onAdd({ name:name.trim(), series:series.trim(), description:desc.trim(), image_url:finalUrl, list })
      setName(''); setSeries(''); setDesc(''); setImageUrl(''); setPreview(''); setImageFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setOk(true); setTimeout(() => setOk(false), 2500)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const lbl = { display:'block', fontSize:12, fontWeight:'bold', color:'#a78bfa', marginBottom:6, letterSpacing:.5 }

  return (
    <div style={{ maxWidth:540 }} className="fade-up">
      <div className="page-title" style={{ marginBottom:18 }}>✨ Add a New Pin</div>
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, padding:'22px 18px' }}>
        <label style={lbl}>Pin Name *</label>
        <input className="field-input" placeholder="e.g. Mickey Mouse 50th Anniversary" value={name} onChange={e => setName(e.target.value)} />
        <label style={lbl}>Series / Collection</label>
        <input className="field-input" placeholder="e.g. Walt Disney World 2024" value={series} onChange={e => setSeries(e.target.value)} />
        <label style={lbl}>Description</label>
        <textarea className="field-input" style={{ resize:'vertical', minHeight:85 }} rows={3}
          placeholder="Describe the pin design, edition, special features..."
          value={desc} onChange={e => setDesc(e.target.value)} />
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
        <input className="field-input" placeholder="Paste image URL..." value={imageUrl}
          onChange={e => { setImageUrl(e.target.value); setPreview(e.target.value); setImageFile(null) }} />
        <div style={{ textAlign:'center', color:'#475569', fontSize:12, margin:'-6px 0 12px' }}>— or —</div>
        <label style={{ display:'block', textAlign:'center', padding:'15px', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:12, color:'#94a3b8', cursor:'pointer', fontSize:14, fontWeight:600, marginBottom:14 }}>
          📷 Take Photo or Choose from Library
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleFile} />
        </label>
        {preview && (
          <div style={{ width:110, height:110, borderRadius:12, overflow:'hidden', border:'2px solid rgba(124,58,237,0.5)', marginBottom:16 }}>
            <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        )}
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
function PinList({ pins, listType, onDelete, onMove, loading }) {
  const [search, setSearch] = useState('')
  const filtered = pins.filter(p => p.list===listType && (
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.series||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.description||'').toLowerCase().includes(search.toLowerCase())
  ))
  return (
    <div className="fade-up">
      <div className="page-title">{listType==='have'?'🎒 My Pin Collection':'⭐ My Wish List'}</div>
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
          {filtered.map(pin => <PinCard key={pin.id} pin={pin} onDelete={onDelete} onMove={onMove} />)}
        </div>
      )}
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────────
function ProfilePage({ user, haveCount, wantCount }) {
  return (
    <div className="fade-up">
      <div className="page-title">👤 My Profile</div>
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, padding:'22px 18px', marginTop:16, maxWidth:420 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22 }}>
          <div style={{ width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:'bold', color:'#fff', flexShrink:0 }}>
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <div style={{ color:'#f1f5f9', fontWeight:'bold', fontSize:15 }}>{user.email}</div>
            <div style={{ color:'#64748b', fontSize:12, marginTop:3 }}>🏰 PinVault Member</div>
          </div>
        </div>
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
        <button onClick={() => supabase.auth.signOut()}
          style={{ width:'100%', padding:'14px', border:'1px solid rgba(255,99,99,0.3)', borderRadius:12, background:'rgba(220,38,38,0.1)', color:'#f87171', cursor:'pointer', fontSize:15, fontWeight:'bold' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [pins, setPins] = useState([])
  const [tab, setTab] = useState('have')
  const [pinsLoading, setPinsLoading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) { setUser(data.session.user); fetchPins(data.session.user.id) }
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); fetchPins(session.user.id) }
      else { setUser(null); setPins([]) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchPins(uid) {
    setPinsLoading(true)
    const { data } = await supabase.from('pins').select('*').eq('user_id', uid).order('created_at', { ascending:false })
    setPins(data || [])
    setPinsLoading(false)
  }

  async function addPin(d) {
    const { data, error } = await supabase.from('pins').insert([{...d, user_id:user.id}]).select().single()
    if (!error && data) { setPins(prev => [data,...prev]); setTab(d.list) }
    else if (error) console.error('Add pin error:', error)
  }

  async function deletePin(id, imageUrl) {
    if (imageUrl && imageUrl.includes('supabase')) {
      const path = imageUrl.split('/pin-images/')[1]
      if (path) await supabase.storage.from('pin-images').remove([path])
    }
    await supabase.from('pins').delete().eq('id', id)
    setPins(prev => prev.filter(p => p.id!==id))
  }

  async function movePin(id, toList) {
    await supabase.from('pins').update({ list:toList }).eq('id', id)
    setPins(prev => prev.map(p => p.id===id ? {...p, list:toList} : p))
  }

  if (!authChecked) return (
    <div style={{ minHeight:'100vh', background:'#0f0a1e', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa', fontSize:18 }}>
      🏰 Loading PinVault...
    </div>
  )

  if (!user) return <AuthScreen onLogin={u => { setUser(u); fetchPins(u.id) }} />

  const haveCount = pins.filter(p => p.list==='have').length
  const wantCount = pins.filter(p => p.list==='want').length

  const navItems = [
    { id:'have',    icon:'🎒', label:'Collection', count:haveCount },
    { id:'want',    icon:'⭐', label:'Wish List',  count:wantCount },
    { id:'add',     icon:'＋', label:'Add Pin' },
    { id:'profile', icon:'👤', label:'Profile' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0f0a1e,#1a1040,#0f172a)' }}>
      <style>{css}</style>

      {/* Desktop top nav */}
      <div className="top-nav">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:26 }}>🏰</span>
          <span style={{ fontSize:20, color:'#f9fafb', letterSpacing:3, fontWeight:'bold' }}>PinVault</span>
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
          <span style={{ fontSize:17, color:'#f9fafb', letterSpacing:2, fontWeight:'bold' }}>PinVault</span>
        </div>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:'bold', color:'#fff' }}>
          {user.email[0].toUpperCase()}
        </div>
      </div>

      {/* Main */}
      <div className="main-content">
        {tab==='have'    && <PinList pins={pins} listType="have" onDelete={deletePin} onMove={movePin} loading={pinsLoading} />}
        {tab==='want'    && <PinList pins={pins} listType="want" onDelete={deletePin} onMove={movePin} loading={pinsLoading} />}
        {tab==='add'     && <AddPinForm onAdd={addPin} userId={user.id} />}
        {tab==='profile' && <ProfilePage user={user} haveCount={haveCount} wantCount={wantCount} />}
      </div>

      {/* Mobile bottom nav */}
      <div className="bottom-nav">
        {navItems.map(t => (
          <button key={t.id} className={`nav-tab-btn ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
            {t.count != null && t.count > 0 && (
              <span style={{ position:'absolute', top:7, left:'50%', marginLeft:6, fontSize:9, background:'#7c3aed', color:'white', borderRadius:8, padding:'1px 5px', lineHeight:'14px' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
