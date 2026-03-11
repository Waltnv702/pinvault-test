import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const COLORS = ['#7c3aed','#db2777','#0891b2','#d97706','#059669','#be185d']
function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
  return Math.abs(h)
}

// ── Auth ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email.includes('@') || pw.length < 6) {
      setError('Valid email and password (min 6 chars) required.')
      return
    }
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
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f0a1e,#1e1040,#0f172a)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'Georgia,serif' }}>
      <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:'44px 36px', width:'100%', maxWidth:420, textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize:60, marginBottom:8 }}>🏰</div>
        <div style={{ fontSize:32, color:'#f9fafb', letterSpacing:3, marginBottom:4, fontWeight:'bold' }}>PinVault</div>
        <div style={{ color:'#a78bfa', fontSize:13, marginBottom:28 }}>Your Disney Pin Collection ✨</div>
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setMsg('') }}
              style={{ flex:1, padding:'10px 0', border:`1px solid ${mode===m?'#7c3aed':'rgba(255,255,255,0.1)'}`, borderRadius:10, background:mode===m?'rgba(124,58,237,0.35)':'transparent', color:mode===m?'#e2d9f3':'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'Georgia,serif' }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
        {[
          { type:'email', placeholder:'Email address', value:email, onChange:e => { setEmail(e.target.value); setError('') } },
          { type:'password', placeholder:'Password (min 6 chars)', value:pw, onChange:e => { setPw(e.target.value); setError('') }, onKeyDown:e => e.key==='Enter' && submit() }
        ].map((props, i) => (
          <input key={i} {...props} style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:12, color:'#f1f5f9', fontSize:14, marginBottom:12, outline:'none', display:'block', fontFamily:'Georgia,serif' }} />
        ))}
        {error && <div style={{ color:'#f87171', fontSize:13, marginBottom:10, textAlign:'left' }}>⚠️ {error}</div>}
        {msg && <div style={{ color:'#34d399', fontSize:13, marginBottom:10, textAlign:'left', lineHeight:1.5 }}>{msg}</div>}
        <button onClick={submit} disabled={loading}
          style={{ width:'100%', padding:'14px', background:loading?'rgba(124,58,237,0.4)':'linear-gradient(135deg,#7c3aed,#db2777)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:'bold', cursor:loading?'not-allowed':'pointer', letterSpacing:1, fontFamily:'Georgia,serif' }}>
          {loading ? '⏳ Please wait...' : mode==='login' ? '✨ Enter the Magic' : '🏰 Start My Collection'}
        </button>
      </div>
    </div>
  )
}

// ── Pin Card ─────────────────────────────────────────────────────────────────
function PinCard({ pin, onDelete, onMove }) {
  const [hov, setHov] = useState(false)
  const bg = COLORS[hashCode(pin.id) % COLORS.length]

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${hov?'rgba(124,58,237,0.5)':'rgba(255,255,255,0.09)'}`, borderRadius:16, overflow:'hidden', transition:'all .25s', transform:hov?'translateY(-4px)':'none', boxShadow:hov?'0 12px 40px rgba(124,58,237,0.25)':'0 4px 20px rgba(0,0,0,0.3)' }}>
      <div style={{ width:'100%', height:170, background:bg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        {pin.image_url
          ? <img src={pin.image_url} alt={pin.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
          : <span style={{ fontSize:48, opacity:.65 }}>📌</span>}
        <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.65)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:'bold', color:'#e2d9f3', letterSpacing:1 }}>
          {pin.list==='have'?'HAVE':'WANT'}
        </div>
      </div>
      <div style={{ padding:14 }}>
        <div style={{ fontSize:14, fontWeight:'bold', color:'#f1f5f9', marginBottom:3 }}>{pin.name}</div>
        {pin.series && <div style={{ fontSize:11, color:'#a78bfa', marginBottom:5, fontWeight:600 }}>{pin.series}</div>}
        <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.5, marginBottom:10, minHeight:34 }}>{pin.description}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => onMove(pin.id, pin.list==='have'?'want':'have')}
            style={{ flex:1, padding:'7px 0', border:'1px solid rgba(124,58,237,0.4)', borderRadius:8, background:'rgba(124,58,237,0.15)', color:'#c4b5fd', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'Georgia,serif' }}>
            {pin.list==='have'?'→ Wish List':'→ Collection'}
          </button>
          <button onClick={() => onDelete(pin.id, pin.image_url)}
            style={{ width:30, height:30, border:'1px solid rgba(255,99,99,0.3)', borderRadius:8, background:'rgba(220,38,38,0.12)', color:'#f87171', cursor:'pointer', fontSize:12, fontWeight:'bold' }}>✕</button>
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

  const inp = { width:'100%', padding:'11px 15px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:11, color:'#f1f5f9', fontSize:14, marginBottom:14, outline:'none', display:'block', fontFamily:'Georgia,serif' }
  const lbl = { display:'block', fontSize:12, fontWeight:'bold', color:'#a78bfa', marginBottom:6, letterSpacing:.5 }

  return (
    <div style={{ maxWidth:540 }}>
      <div style={{ fontSize:24, fontWeight:'bold', color:'#f9fafb', marginBottom:20, letterSpacing:1 }}>✨ Add a New Pin</div>
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, padding:28 }}>
        <label style={lbl}>Pin Name *</label>
        <input style={inp} placeholder="e.g. Mickey Mouse 50th Anniversary" value={name} onChange={e => setName(e.target.value)} />
        <label style={lbl}>Series / Collection</label>
        <input style={inp} placeholder="e.g. Walt Disney World 2024" value={series} onChange={e => setSeries(e.target.value)} />
        <label style={lbl}>Description</label>
        <textarea style={{...inp, resize:'vertical'}} rows={3} placeholder="Describe the pin design, edition, special features..." value={desc} onChange={e => setDesc(e.target.value)} />
        <label style={lbl}>Add to</label>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {['have','want'].map(l => (
            <button key={l} onClick={() => setList(l)}
              style={{ flex:1, padding:'10px 0', border:`1px solid ${list===l?'#7c3aed':'rgba(255,255,255,0.1)'}`, borderRadius:10, background:list===l?'rgba(124,58,237,0.3)':'transparent', color:list===l?'#e2d9f3':'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:'bold', fontFamily:'Georgia,serif' }}>
              {l==='have'?'🎒 My Collection':'⭐ Wish List'}
            </button>
          ))}
        </div>
        <label style={lbl}>Pin Image</label>
        <input style={inp} placeholder="Paste image URL..." value={imageUrl}
          onChange={e => { setImageUrl(e.target.value); setPreview(e.target.value); setImageFile(null) }} />
        <div style={{ textAlign:'center', color:'#475569', fontSize:12, margin:'-6px 0 10px' }}>— or upload from device —</div>
        <label style={{ display:'block', textAlign:'center', padding:'11px', border:'1px dashed rgba(255,255,255,0.18)', borderRadius:10, color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:12 }}>
          📁 Choose Photo
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
        </label>
        {preview && (
          <div style={{ width:100, height:100, borderRadius:10, overflow:'hidden', border:'2px solid rgba(124,58,237,0.5)', marginBottom:14 }}>
            <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        )}
        {error && <div style={{ color:'#f87171', fontSize:13, marginBottom:12 }}>⚠️ {error}</div>}
        <button onClick={submit} disabled={loading}
          style={{ width:'100%', padding:14, background:ok?'linear-gradient(135deg,#059669,#0891b2)':loading?'rgba(124,58,237,0.4)':'linear-gradient(135deg,#7c3aed,#db2777)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:'bold', cursor:loading?'not-allowed':'pointer', transition:'background .4s', fontFamily:'Georgia,serif' }}>
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
    <div>
      <div style={{ fontSize:24, fontWeight:'bold', color:'#f9fafb', marginBottom:8, letterSpacing:1 }}>
        {listType==='have'?'🎒 My Pin Collection':'⭐ My Wish List'}
      </div>
      <div style={{ display:'inline-block', background:'rgba(124,58,237,0.3)', border:'1px solid rgba(124,58,237,0.5)', borderRadius:20, padding:'3px 14px', fontSize:13, color:'#c4b5fd', marginBottom:18 }}>
        {loading ? 'Loading...' : `${filtered.length} pin${filtered.length!==1?'s':''}`}
      </div>
      <input placeholder="🔍 Search pins..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ width:'100%', maxWidth:360, padding:'11px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:11, color:'#f1f5f9', fontSize:14, marginBottom:22, outline:'none', display:'block', fontFamily:'Georgia,serif' }} />
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#64748b' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>Loading your pins...
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:60, marginBottom:14, opacity:.4 }}>{listType==='have'?'🎒':'⭐'}</div>
          <div style={{ color:'#64748b', fontSize:15 }}>
            {search?'No pins match your search.':listType==='have'?'No pins yet — add your first pin!':'Your wish list is empty!'}
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:18 }}>
          {filtered.map(pin => <PinCard key={pin.id} pin={pin} onDelete={onDelete} onMove={onMove} />)}
        </div>
      )}
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
    <div style={{ minHeight:'100vh', background:'#0f0a1e', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa', fontFamily:'Georgia,serif', fontSize:18 }}>
      🏰 Loading PinVault...
    </div>
  )

  if (!user) return <AuthScreen onLogin={u => { setUser(u); fetchPins(u.id) }} />

  const haveCount = pins.filter(p => p.list==='have').length
  const wantCount = pins.filter(p => p.list==='want').length

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0f0a1e,#1a1040,#0f172a)', fontFamily:'Georgia,serif', color:'#f1f5f9' }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } input::placeholder,textarea::placeholder{color:#4a5568;}`}</style>

      {/* Nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.08)', position:'sticky', top:0, zIndex:100, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:26 }}>🏰</span>
          <span style={{ fontSize:20, color:'#f9fafb', letterSpacing:3, fontWeight:'bold' }}>PinVault</span>
        </div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {[
            { id:'have', label:'🎒 Collection', count:haveCount },
            { id:'want', label:'⭐ Wish List', count:wantCount },
            { id:'add',  label:'＋ Add Pin' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'8px 14px', border:`1px solid ${tab===t.id?'rgba(124,58,237,0.5)':'transparent'}`, borderRadius:10, background:tab===t.id?'rgba(124,58,237,0.25)':'transparent', color:tab===t.id?'#e2d9f3':'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:'bold', display:'flex', alignItems:'center', gap:6, fontFamily:'Georgia,serif' }}>
              {t.label}
              {t.count != null && <span style={{ background:'rgba(124,58,237,0.5)', color:'#e2d9f3', borderRadius:10, padding:'1px 7px', fontSize:11 }}>{t.count}</span>}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:'bold', color:'#fff' }}>
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:11, color:'#64748b', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
            <button onClick={() => supabase.auth.signOut()}
              style={{ padding:'4px 10px', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, background:'transparent', color:'#94a3b8', cursor:'pointer', fontSize:11, fontFamily:'Georgia,serif', marginTop:2 }}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' }}>
        {tab==='have' && <PinList pins={pins} listType="have" onDelete={deletePin} onMove={movePin} loading={pinsLoading} />}
        {tab==='want' && <PinList pins={pins} listType="want" onDelete={deletePin} onMove={movePin} loading={pinsLoading} />}
        {tab==='add'  && <AddPinForm onAdd={addPin} userId={user.id} />}
      </div>
    </div>
  )
}
