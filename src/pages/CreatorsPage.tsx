import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadCatalog, loadCreators, type Recipe, type CreatorInfo } from '../lib/catalog'

const GREEN = '#1D9E75'

const CREATOR_STYLE: Record<string, { emoji: string; bg: string; photo?: string }> = {
  '@justineskitchen': { emoji: '👩‍🍳', bg: '#1a120a', photo: 'https://yt3.googleusercontent.com/ZdF6Eb_669kPPK96Adf4RT8JWAI1XU55RXNJ91lcGX3Ctb0GiRwHGzbjFCYFcgC4rGqX7lKCqw=s200-c-k-c0x00ffffff-no-rj' },
  '@holmescooking':   { emoji: '👨‍🍳', bg: '#0a1a0a', photo: 'https://yt3.googleusercontent.com/hRntz7c5x7Hl2eW3MyOrNGFiXSJ9uXmq7iaNfgvV31vSDf8QWS9Vc88jX8xE9ZkFvYw6ZMyq=s200-c-k-c0x00ffffff-no-rj' },
  '@coreyalicia':     { emoji: '👩‍🍳', bg: '#1a0a1a', photo: 'https://yt3.googleusercontent.com/bQHLbYPYL7kUpEN_5iyADihYa89vHGBvWr1_JweF_yQ78NNmGy1HKyp239LMxfuYfocaD2CSGA=s200-c-k-c0x00ffffff-no-rj' },
}

function creatorStyle(handle: string) {
  return CREATOR_STYLE[handle.toLowerCase()] ?? { emoji: '🧑‍🍳', bg: '#111' }
}

type Creator = { handle: string; name: string; count: number }
type AuthMode = 'login' | 'signup'

function CreatorAuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (mode === 'signup' && !name.trim()) e.name = 'Name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSubmitted(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 grid h-7 w-7 place-items-center rounded-full text-sm"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
        >✕</button>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="text-4xl">📬</div>
              <div className="text-lg font-bold text-white">Check your email</div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                We sent a verification link to <span className="text-white font-medium">{email}</span>. Click it to verify your account and get started.
              </p>
              <button
                onClick={onClose}
                className="w-full rounded-full py-2.5 text-sm font-semibold text-white mt-2"
                style={{ background: GREEN }}
              >
                Got it
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="text-lg font-bold text-white mb-1">
                  {mode === 'signup' ? 'Claim your creator profile' : 'Welcome back'}
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {mode === 'signup'
                    ? 'Join MyRecipeReels and connect your content with millions of food lovers.'
                    : 'Sign in to manage your creator profile.'}
                </p>
              </div>

              {/* Toggle */}
              <div className="flex rounded-xl p-1 mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {(['signup', 'login'] as AuthMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setErrors({}) }}
                    className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition"
                    style={mode === m
                      ? { background: GREEN, color: '#fff' }
                      : { color: 'rgba(255,255,255,0.4)' }}
                  >
                    {m === 'signup' ? 'Sign up' : 'Log in'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {/* Name — signup only */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Your name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Justine Snacks"
                      value={name}
                      onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: errors.name ? '1px solid #ef4444' : '0.5px solid rgba(255,255,255,0.15)' }}
                    />
                    {errors.name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name}</p>}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: errors.email ? '1px solid #ef4444' : '0.5px solid rgba(255,255,255,0.15)' }}
                  />
                  {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email}</p>}
                  {mode === 'signup' && (
                    <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      We'll send a verification link to this address.
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none pr-10"
                      style={{ background: 'rgba(255,255,255,0.07)', border: errors.password ? '1px solid #ef4444' : '0.5px solid rgba(255,255,255,0.15)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password}</p>}
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  className="w-full rounded-full py-2.5 text-sm font-semibold text-white mt-1"
                  style={{ background: GREEN }}
                >
                  {mode === 'signup' ? 'Create my creator account' : 'Log in'}
                </button>

                {mode === 'login' && (
                  <button className="w-full text-center text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Forgot password?
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [creatorPhotos, setCreatorPhotos] = useState<Map<string, CreatorInfo>>(new Map())
  const [showAuth, setShowAuth] = useState(false)
  const [search, setSearch] = useState('')
  const [favCreators, setFavCreators] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('favCreators') || '[]')) } catch { return new Set() }
  })

  useEffect(() => {
    loadCatalog().then((data: Recipe[]) => {
      const map = new Map<string, { name: string; count: number }>()
      data.forEach(r => {
        if (!map.has(r.handle)) map.set(r.handle, { name: r.creator, count: 0 })
        map.get(r.handle)!.count++
      })
      const list: Creator[] = Array.from(map.entries()).map(([handle, v]) => ({
        handle, name: v.name, count: v.count,
      }))
      list.sort((a, b) => a.name.localeCompare(b.name))
      setCreators(list)
    })
    loadCreators().then(data => {
      const map = new Map<string, CreatorInfo>()
      data.forEach(c => map.set(c.handle.toLowerCase(), c))
      setCreatorPhotos(map)
    })
  }, [])

  function toggleFav(handle: string) {
    setFavCreators(prev => {
      const next = new Set(prev)
      next.has(handle) ? next.delete(handle) : next.add(handle)
      localStorage.setItem('favCreators', JSON.stringify([...next]))
      return next
    })
  }

  const q = search.toLowerCase()
  const faves = creators.filter(c => favCreators.has(c.handle) && (!q || c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)))
  const rest = creators.filter(c => !favCreators.has(c.handle) && (!q || c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)))

  function CreatorCard({ c }: { c: Creator }) {
    const style = creatorStyle(c.handle)
    const isFav = favCreators.has(c.handle)
    const photo = creatorPhotos.get(c.handle.toLowerCase())
    return (
      <div
        className="rounded-2xl p-4 flex items-center gap-4 transition"
        style={{ background: 'rgba(255,255,255,0.04)', border: isFav ? `1px solid ${GREEN}` : '0.5px solid rgba(255,255,255,0.1)' }}
      >
        <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl" style={{ background: style.bg }}>
          {(style.photo || photo?.thumbnailUrl)
            ? <img src={style.photo || photo?.thumbnailUrl} alt={c.name} className="w-full h-full object-cover" />
            : style.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{c.name}</div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.handle}</div>
          <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.count} reels</div>
        </div>
        <button
          onClick={() => toggleFav(c.handle)}
          className="text-2xl transition-transform hover:scale-110"
          style={{ color: isFav ? '#ef4444' : 'rgba(255,255,255,0.25)' }}
        >
          {isFav ? '♥' : '♡'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0d0d0d' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-5 md:px-12 py-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <Link to="/" className="text-2xl font-bold text-white no-underline">
          🎬 My<span style={{ color: GREEN }}>Recipe</span>Reels
        </Link>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <Link to="/" className="hover:text-white transition" style={{ color: 'inherit', textDecoration: 'none' }}>Browse</Link>
          <Link to="/creators" className="font-semibold" style={{ color: GREEN, textDecoration: 'none' }}>Creators</Link>
          <span className="cursor-pointer hover:text-white transition">My Cookbook</span>
          <button
            onClick={() => setShowAuth(true)}
            className="font-semibold px-3 py-1 rounded-full text-white"
            style={{ background: GREEN }}
          >
            Creator login
          </button>
        </div>
      </nav>

      <div className="px-5 md:px-12 xl:px-24 py-10 space-y-10">

        {/* Creator CTA banner */}
        <div className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(29,158,117,0.15), rgba(29,158,117,0.05))', border: `1px solid rgba(29,158,117,0.3)` }}>
          <div>
            <div className="font-bold text-white text-base mb-1">Are you a recipe creator?</div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Claim your profile, manage your reels, and connect with your fans on MyRecipeReels.
            </p>
          </div>
          <button
            onClick={() => setShowAuth(true)}
            className="flex-shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap"
            style={{ background: GREEN }}
          >
            Claim your profile
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none pr-10"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >✕</button>
          )}
        </div>

        {/* My Faves */}
        {faves.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">♥</span>
              <h2 className="text-lg font-bold text-white">My Faves</h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{faves.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {faves.map(c => <CreatorCard key={c.handle} c={c} />)}
            </div>
          </section>
        )}

        {/* All Creators */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {faves.length > 0 ? 'All Creators' : 'Creators'}
            </h2>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{creators.length} creators</span>
          </div>
          {rest.length === 0 && faves.length === 0 && (
            <div className="text-sm py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {search ? `No creators found for "${search}"` : 'Loading creators...'}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rest.map(c => <CreatorCard key={c.handle} c={c} />)}
          </div>
          {rest.length === 0 && faves.length > 0 && (
            <div className="text-sm py-4 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>You've followed everyone!</div>
          )}
        </section>

      </div>

      {showAuth && <CreatorAuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
