import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { loadCatalog, loadCreators, type Recipe, type CreatorInfo } from './lib/catalog'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import { useAuth } from './auth/AuthContext'

const GREEN = '#1D9E75'
const GREEN_DARK = '#0F6E56'
const GREEN_LIGHT = '#E1F5EE'

const CUISINES = [
  { name: 'Italian',       emoji: '🍝', bg: '#fff8f0', image: '/cuisines/italian.jpg' },
  { name: 'Asian',         emoji: '🍜', bg: '#f0f8ff', image: '/cuisines/asian.jpg' },
  { name: 'Mexican',       emoji: '🌮', bg: '#fff5f0', image: '/cuisines/mexican.jpg' },
  { name: 'Desserts',      emoji: '🍰', bg: '#fdf5ff', image: '/cuisines/desserts.jpg' },
  { name: 'American',      emoji: '🍔', bg: '#f0fff4', image: '/cuisines/american.jpg' },
  { name: 'Mediterranean', emoji: '🥙', bg: '#f0faff', image: '/cuisines/mediterranean.jpg' },
  { name: 'Indian',        emoji: '🍛', bg: '#fffaf0', image: '/cuisines/indian.jpg' },
  { name: 'Breakfast',     emoji: '🥞', bg: '#fffff0', image: '/cuisines/breakfast.jpg' },
]


const CREATOR_STYLE: Record<string, { emoji: string; bg: string; photo?: string }> = {
  '@justineskitchen': { emoji: '👩‍🍳', bg: '#1a120a', photo: 'https://yt3.googleusercontent.com/ZdF6Eb_669kPPK96Adf4RT8JWAI1XU55RXNJ91lcGX3Ctb0GiRwHGzbjFCYFcgC4rGqX7lKCqw=s200-c-k-c0x00ffffff-no-rj' },
  '@holmescooking':   { emoji: '👨‍🍳', bg: '#0a1a0a', photo: 'https://yt3.googleusercontent.com/hRntz7c5x7Hl2eW3MyOrNGFiXSJ9uXmq7iaNfgvV31vSDf8QWS9Vc88jX8xE9ZkFvYw6ZMyq=s200-c-k-c0x00ffffff-no-rj' },
  '@coreyalicia':     { emoji: '👩‍🍳', bg: '#1a0a1a', photo: 'https://yt3.googleusercontent.com/bQHLbYPYL7kUpEN_5iyADihYa89vHGBvWr1_JweF_yQ78NNmGy1HKyp239LMxfuYfocaD2CSGA=s200-c-k-c0x00ffffff-no-rj' },
}

function creatorStyle(handle: string) {
  return CREATOR_STYLE[handle.toLowerCase()] ?? { emoji: '🧑‍🍳', bg: '#111' }
}

type Reel = Recipe & { emoji: string; bg: string }

const CUISINE_EMOJI: Record<string, string> = {
  Italian: '🍝', Asian: '🍜', Mexican: '🌮', Desserts: '🍰',
  American: '🍔', Mediterranean: '🥙', Indian: '🍛', Breakfast: '🥞',
  Seafood: '🐟', Vegan: '🌱', Cocktails: '🍸',
}
const CUISINE_BG: Record<string, string> = {
  Italian: '#1a120a', Asian: '#0a1a1a', Mexican: '#1a0a0a', Desserts: '#1a0a1a',
  American: '#0a0a0a', Mediterranean: '#0a101a', Indian: '#1a100a', Breakfast: '#1a1a0a',
}

function toReel(r: Recipe): Reel {
  return {
    ...r,
    emoji: CUISINE_EMOJI[r.cuisine] || '🍽️',
    bg: CUISINE_BG[r.cuisine] || '#111',
  }
}


function printRecipe(reel: Reel) {
  let parsed: { ingredients?: string[]; steps?: string[]; servings?: string; time?: string } | null = null
  try { parsed = reel.recipe ? JSON.parse(reel.recipe) : null } catch { parsed = null }
  if (!parsed) return

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>${reel.title} — Recipe</title><style>
    body { font-family: Georgia, serif; max-width: 600px; margin: 40px auto; padding: 0 20px; color: #111; }
    h1 { font-size: 1.6rem; margin-bottom: 4px; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
    h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
    ul, ol { padding-left: 1.4em; line-height: 1.9; }
    .footer { margin-top: 40px; font-size: 0.75rem; color: #aaa; }
    @media print { body { margin: 20px; } }
  </style></head><body>
    <h1>${reel.title}</h1>
    <div class="meta">${reel.creator}${parsed.time ? ' · ' + parsed.time : ''}${parsed.servings ? ' · Serves ' + parsed.servings : ''}</div>
    ${parsed.ingredients?.length ? `<h2>Ingredients</h2><ul style="columns:2;gap:2em;list-style:none;padding-left:0;">${parsed.ingredients.map(i => `<li style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;"><input type="checkbox" style="margin-top:2px;flex-shrink:0;"> ${i}</li>`).join('')}</ul>` : ''}
    ${parsed.steps?.length ? `<h2>Steps</h2><ol>${parsed.steps.map(s => `<li>${s}</li>`).join('')}</ol>` : ''}
    <div class="footer" style="position:fixed;bottom:20px;right:20px;">Printed from MyRecipeReels.com · Reel Inspiration · For the Love of ReelFood</div>
  </body></html>`)
  win.document.close()
  win.focus()
  win.onafterprint = () => win.close()
  win.print()
}

function useRatings() {
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('reelRatings') || '{}') } catch { return {} }
  })
  function rate(id: string, stars: number) {
    setRatings(prev => {
      const next = { ...prev, [id]: prev[id] === stars ? 0 : stars }
      if (next[id] === 0) delete next[id]
      localStorage.setItem('reelRatings', JSON.stringify(next))
      return next
    })
  }
  return { ratings, rate }
}

function ReelModal({ reel, onClose, onHide, onPrev, onNext, saved, onToggleSave }: {
  reel: Reel
  onClose: () => void
  onHide: () => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
  saved: boolean
  onToggleSave: () => void
}) {
  const isMobile = navigator.maxTouchPoints > 0
  const [showRecipe, setShowRecipe] = useState(false)
  const [playing, setPlaying] = useState(!isMobile)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const embedUrl = reel.videoId ? `https://www.youtube-nocookie.com/embed/${reel.videoId}?${isMobile ? '' : 'autoplay=1&mute=1&'}rel=0&enablejsapi=1` : null


  function togglePlay() {
    const cmd = playing ? 'pauseVideo' : 'playVideo'
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*')
    setPlaying(p => !p)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-1 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: '#1a1a1a', height: '98vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3 py-1 text-xs font-bold flex-shrink-0 flex items-center justify-between" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <span>My<span style={{ color: GREEN }}>Recipe</span>Reels <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>· Reel Inspiration</span></span>
          <button onClick={onClose} className="text-base leading-none p-1" style={{ color: 'rgba(255,255,255,0.5)' }}>✕</button>
        </div>
        {/* Video */}
        <div className="w-full relative flex-1 min-h-0" style={{ background: reel.bg }}>
          {!isMobile && (
            <div className="absolute top-1 right-1 z-10 flex flex-col gap-2">
              <button
                onClick={togglePlay}
                className="grid h-9 w-9 place-items-center text-xl"
                style={{ color: 'rgba(255,255,255,0.9)', background: 'transparent', border: 'none' }}
              >{playing ? '⏸' : '▶'}</button>
            </div>
          )}
          {embedUrl ? (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                if (isMobile) return
                setTimeout(() => {
                  iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*')
                  iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*')
                  iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*')
                }, 1000)
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">{reel.emoji}</div>
          )}
        </div>

        <div className="px-4 pt-2 pb-2 space-y-1.5 flex-shrink-0">
          <div>
            <div className="font-bold text-white text-lg">{reel.title.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim()}</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{reel.creator} · {reel.views} views</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onPrev && onPrev()}
                  disabled={!onPrev}
                  className="w-7 h-7 rounded-full text-lg font-bold transition grid place-items-center"
                  style={{ background: onPrev ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', color: onPrev ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}
                >‹</button>
                <button
                  onClick={() => onNext && onNext()}
                  disabled={!onNext}
                  className="w-7 h-7 rounded-full text-lg font-bold transition grid place-items-center"
                  style={{ background: onNext ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', color: onNext ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}
                >›</button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-stretch">
            {/* Left: Hide + Heart + Print + View Recipe */}
            <div className="flex gap-1 items-stretch">
              <button
                onClick={onHide}
                className="rounded-2xl px-2 font-semibold text-xs leading-tight flex flex-col items-center justify-center"
                style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}
              >
                <div>Hide</div>
                <div>Reel</div>
              </button>
              {reel.hasAiRecipe && (
                <>
                  <button
                    onClick={() => printRecipe(reel)}
                    className="rounded-2xl px-3 text-3xl font-bold transition"
                    style={{ background: GREEN_LIGHT, color: GREEN_DARK }}
                    title="Print recipe"
                  >🖨️</button>
                  <button
                    onClick={() => setShowRecipe(!showRecipe)}
                    className="rounded-2xl px-2 font-bold transition leading-tight flex flex-col items-center justify-center"
                    style={{ background: GREEN_LIGHT, color: GREEN_DARK }}
                  >
                    <div className="text-[10px]">{showRecipe ? 'Hide' : 'View'}</div>
                    <div className="text-[10px]">Recipe</div>
                  </button>
                </>
              )}
              {!reel.hasAiRecipe && (
                <button
                  className="rounded-2xl px-2 text-[10px] font-bold"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                  disabled
                >Coming soon</button>
              )}
            </div>
            {/* Center: Instacart */}
            <button
              className="flex-1 rounded-2xl font-bold text-white transition flex flex-col items-center justify-center py-1"
              style={{ background: '#43B02A' }}
            >
              <span className="text-lg leading-none">🛒</span>
              <span className="text-[11px] mt-0.5 whitespace-nowrap">Order On Instacart</span>
            </button>
            {/* Right: Heart */}
            <button
              onClick={onToggleSave}
              className="rounded-2xl px-3 text-3xl leading-none transition-transform hover:scale-110"
              style={{ color: saved ? '#ef4444' : 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}
            >{saved ? '♥' : '♡'}</button>
          </div>

          {showRecipe && reel.hasAiRecipe && (() => {
            let parsed: { ingredients?: string[]; steps?: string[]; servings?: string; time?: string } | null = null
            try { parsed = reel.recipe ? JSON.parse(reel.recipe) : null } catch { parsed = null }
            if (!parsed) return null
            return (
              <div className="rounded-xl p-3 text-sm space-y-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white">Full Recipe</div>
                  {(parsed.time || parsed.servings) && (
                    <div className="text-[11px] flex gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {parsed.time && <span>{parsed.time}</span>}
                      {parsed.servings && <span>· {parsed.servings}</span>}
                    </div>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Based on the video — ingredient amounts may vary.</p>
                {parsed.ingredients && parsed.ingredients.length > 0 && (
                  <div className="text-xs space-y-1">
                    <div className="font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Ingredients:</div>
                    <ul className="list-disc list-inside space-y-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {parsed.ingredients.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {parsed.steps && parsed.steps.length > 0 && (
                  <div className="text-xs space-y-1">
                    <div className="font-semibold pt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Steps:</div>
                    <ol className="list-decimal list-inside space-y-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {parsed.steps.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { ratings, rate } = useRatings()
  const { email: authEmail, signOut } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  function requireAuth(action: () => void) {
    if (authEmail) {
      action()
    } else {
      setPendingAction(() => action)
      setAuthOpen(true)
    }
  }
  const [search, setSearch] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)

  function submitSearch() {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null)
  const [activeReel, setActiveReel] = useState<Reel | null>(null)
  const [activeCreator, setActiveCreator] = useState<string | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [hiddenReels, setHiddenReels] = useState<{id: string; title: string; creator: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('hiddenReels') || '[]') } catch { return [] }
  })
  const hiddenIds = new Set(hiddenReels.map(r => r.id))

  function hideReel(reel: Reel) {
    setHiddenReels(prev => {
      const next = [...prev, { id: reel.id, title: reel.title, creator: reel.creator }]
      localStorage.setItem('hiddenReels', JSON.stringify(next))
      return next
    })
    setActiveReel(null)
  }
  function unhideReel(id: string) {
    setHiddenReels(prev => {
      const next = prev.filter(r => r.id !== id)
      localStorage.setItem('hiddenReels', JSON.stringify(next))
      return next
    })
  }
  const [recipes, setRecipes] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [creatorPhotos, setCreatorPhotos] = useState<Map<string, CreatorInfo>>(new Map())
  const [sortBy, setSortBy] = useState<'viewed' | 'favorites' | 'newest' | 'recipe' | 'hidden'>('recipe')
  const [favCreators, setFavCreators] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('favCreators') || '[]')) } catch { return new Set() }
  })

  useEffect(() => {
    loadCatalog().then(data => {
      setRecipes(data.map(toReel))
      setLoading(false)
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

  const uniqueCreators = Array.from(
    recipes.reduce((map, r) => {
      if (!map.has(r.handle)) map.set(r.handle, r.creator)
      return map
    }, new Map<string, string>())
  ).map(([handle, name]) => ({ handle, name }))
   .sort((a, b) => a.name.localeCompare(b.name))

  function parseViews(v: string): number {
    if (!v) return 0
    const n = parseFloat(v)
    if (v.endsWith('M')) return n * 1_000_000
    if (v.endsWith('K')) return n * 1_000
    return n || 0
  }

  const filtered = recipes
    .filter(r => sortBy === 'hidden' ? hiddenIds.has(r.id) : !hiddenIds.has(r.id))
    .filter(r => {
      if (sortBy === 'hidden') return true
      if (activeCreator && r.handle !== activeCreator) return false
      if (activeCuisine && r.cuisine !== activeCuisine) return false
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.creator.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .filter(r => sortBy === 'favorites' ? saved.has(r.id) : sortBy === 'recipe' ? r.hasAiRecipe : true)
    .sort((a, b) => {
      if (sortBy === 'viewed') return parseViews(b.views) - parseViews(a.views)
      if (sortBy === 'newest') return parseInt(b.id.replace('recipe-', '')) - parseInt(a.id.replace('recipe-', ''))
      return 0
    })

  return (
    <div className="text-white" style={{ background: '#110f0a' }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 'clamp(380px, 55vh, 650px)' }}>
        <img
          src="/hero.png"
          alt="Steaming pasta on dark marble counter"
          className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: 'center 70%' }}
        />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-5 md:px-12 py-3" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <span className="text-lg md:text-2xl font-bold text-white leading-tight">
            My<span style={{ color: GREEN }}>Recipe</span>Reels<br className="md:hidden" /><span className="whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}><span className="hidden md:inline"> · </span><span className="md:hidden text-sm"> </span>Reel Inspiration</span>
          </span>
          <div className="hidden md:flex gap-5 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="cursor-pointer hover:text-white transition">Home</span>
            <Link to="/creators" className="hover:text-white transition" style={{ color: 'inherit', textDecoration: 'none' }}>Creators</Link>
            <span
              className="cursor-pointer font-semibold transition"
              style={{ color: GREEN }}
              onClick={() => authEmail ? signOut() : setAuthOpen(true)}
              title={authEmail ? `Signed in as ${authEmail} — click to sign out` : undefined}
            >
              {authEmail ? 'Sign out' : 'Sign up'}
            </span>
          </div>
          <div className="flex md:hidden gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Link to="/creators" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Creators</Link>
            <span
              className="cursor-pointer"
              style={{ color: GREEN }}
              onClick={() => authEmail ? signOut() : setAuthOpen(true)}
            >
              {authEmail ? 'Sign out' : 'Sign up'}
            </span>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 px-5 pb-8 pt-6 md:px-12">
          <div style={{ display: 'inline-block', maxWidth: '100%' }}>
          <h1 className="text-xl sm:text-3xl md:text-5xl font-bold text-white mb-4 leading-tight whitespace-nowrap" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.9)' }}>
            Search · Save · Shop · Serve
          </h1>
          <div className="flex gap-2 rounded-2xl p-2" style={{ background: 'rgba(255,255,255,0.18)', border: '0.5px solid rgba(255,255,255,0.35)' }}>
            <input
              type="text"
              size={1}
              placeholder="Search pasta, Gordon Ramsay, 30 min meals..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitSearch()}
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm outline-none"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            />
            <button
              onClick={submitSearch}
              className="rounded-xl px-5 py-2 text-sm font-medium text-white whitespace-nowrap"
              style={{ background: GREEN }}
            >
              Search
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 md:px-12 xl:px-24 pb-16 space-y-8 pt-6">

        {/* My Faves */}
        {favCreators.size > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ color: '#ef4444' }}>♥</span> My Favorite Creators
              </div>
              {activeCreator && (
                <button className="text-xs" style={{ color: GREEN }} onClick={() => setActiveCreator(null)}>
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {uniqueCreators.filter(c => favCreators.has(c.handle)).map(c => {
                const style = creatorStyle(c.handle)
                const isActive = activeCreator === c.handle
                return (
                  <div
                    key={c.handle}
                    className="flex-shrink-0 rounded-2xl p-3 text-center cursor-pointer transition"
                    style={{
                      minWidth: 110,
                      background: isActive ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.04)',
                      border: isActive ? `1.5px solid ${GREEN}` : `1px solid rgba(29,158,117,0.4)`,
                    }}
                    onClick={() => setActiveCreator(isActive ? null : c.handle)}
                  >
                    <div className="w-12 h-12 rounded-full mx-auto mb-2 overflow-hidden flex items-center justify-center text-2xl" style={{ background: style.bg, border: '1.5px solid rgba(255,255,255,0.1)' }}>
                      {style.photo
                        ? <img src={style.photo} alt={c.name} className="w-full h-full object-cover" />
                        : style.emoji}
                    </div>
                    <div className="text-xs font-medium text-white mb-0.5 truncate" style={{ maxWidth: 90 }}>{c.handle}</div>
                    <div className="text-[11px] mb-2 truncate" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 90 }}>{c.name}</div>
                    <button
                      onClick={e => { e.stopPropagation(); toggleFav(c.handle) }}
                      className="text-xl transition-transform hover:scale-110"
                      style={{ color: '#ef4444' }}
                    >
                      ♥
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Browse by Cuisine */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Browse by Cuisine</div>
            {activeCuisine && (
              <button className="text-xs" style={{ color: GREEN }} onClick={() => setActiveCuisine(null)}>
                Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {CUISINES.map(c => (
              <button
                key={c.name}
                onClick={() => setActiveCuisine(activeCuisine === c.name ? null : c.name)}
                className="rounded-2xl overflow-hidden text-center cursor-pointer transition"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: activeCuisine === c.name ? `1.5px solid ${GREEN}` : '0.5px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="h-14 md:h-20 overflow-hidden">
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-[11px] font-medium py-1.5 px-1" style={{ color: activeCuisine === c.name ? GREEN : 'rgba(255,255,255,0.8)' }}>
                  {c.name}
                </div>
              </button>
            ))}
          </div>
        </section>


        {/* Reel Grid */}
        <section ref={gridRef}>
          {search && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-sm text-white">Results for "<span style={{ color: GREEN }}>{search}</span>"</span>
              <button onClick={() => setSearch('')} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>✕ Clear</button>
            </div>
          )}
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {([
                { key: 'recipe',    label: 'Recipe Included' },
                { key: 'favorites', label: 'My Favorites' },
                { key: 'newest',    label: 'Recently Posted' },
                { key: 'viewed',    label: 'Most Viewed' },
                { key: 'hidden',    label: 'Hidden' },
              ] as const).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition"
                  style={sortBy === opt.key
                    ? { background: opt.key === 'hidden' ? '#ef4444' : GREEN, color: '#fff' }
                    : { color: opt.key === 'hidden' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.4)' }}
                >
                  {opt.key === 'favorites'
                    ? <><span style={{ color: '#ef4444' }}>♥</span> {opt.label}</>
                    : opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{filtered.length} reels</span>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading reels...</div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filtered.map(reel => (
              <div
                key={reel.id}
                className="rounded-2xl cursor-pointer transition hover:scale-[1.02] flex flex-col justify-between"
                style={{ background: 'rgba(255,248,235,0.06)', border: '0.5px solid rgba(255,248,235,0.12)' }}
                onClick={() => setActiveReel(reel)}
              >
                <div className="p-2 flex-1 flex flex-col">
                  {/* Top row: unhide button (hidden view only) */}
                  {sortBy === 'hidden' && (
                    <div className="flex mb-1">
                      <button
                        onClick={e => { e.stopPropagation(); unhideReel(reel.id) }}
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                      >Unhide</button>
                    </div>
                  )}

                  {/* Title */}
                  <div className="text-sm font-semibold leading-snug mb-1 flex-1 line-clamp-2" style={{ color: '#f0ebe0' }}>{reel.title.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim()}</div>

                  {/* Creator row */}
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const style = creatorStyle(reel.handle)
                      const photo = style.photo || creatorPhotos.get(reel.handle.toLowerCase())?.thumbnailUrl
                      return (
                        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px]" style={{ background: style.bg }}>
                          {photo
                            ? <img src={photo} alt={reel.creator} className="w-full h-full object-cover" />
                            : style.emoji}
                        </div>
                      )
                    })()}
                    <span className="text-[11px] truncate flex-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{reel.handle} · {reel.views} views</span>
                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto" onClick={e => e.stopPropagation()}>
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          onClick={() => requireAuth(() => rate(reel.id, star))}
                          className="text-xs leading-none"
                          style={{ color: star <= (ratings[reel.id] || 0) ? '#FBBF24' : 'rgba(255,255,255,0.2)' }}
                        >★</button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <Footer />

      {activeReel && (() => {
        const idx = filtered.findIndex(r => r.id === activeReel.id)
        return (
          <ReelModal
            reel={activeReel}
            onClose={() => setActiveReel(null)}
            onHide={() => requireAuth(() => hideReel(activeReel))}
            onPrev={idx > 0 ? () => setActiveReel(filtered[idx - 1]) : null}
            onNext={idx < filtered.length - 1 ? () => setActiveReel(filtered[idx + 1]) : null}
            saved={saved.has(activeReel.id)}
            onToggleSave={() => requireAuth(() => setSaved(prev => { const n = new Set(prev); n.has(activeReel.id) ? n.delete(activeReel.id) : n.add(activeReel.id); return n }))}
          />
        )
      })()}

      {authOpen && (
        <AuthModal
          onClose={() => { setAuthOpen(false); setPendingAction(null) }}
          onSuccess={() => {
            setAuthOpen(false)
            pendingAction?.()
            setPendingAction(null)
          }}
        />
      )}

    </div>
  )
}
