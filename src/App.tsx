import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { loadCatalog, type Recipe } from './lib/catalog'

const GREEN = '#1D9E75'
const GREEN_DARK = '#0F6E56'
const GREEN_LIGHT = '#E1F5EE'

const CUISINES = [
  { name: 'Italian',       emoji: '🍝', bg: '#fff8f0' },
  { name: 'Asian',         emoji: '🍜', bg: '#f0f8ff' },
  { name: 'Mexican',       emoji: '🌮', bg: '#fff5f0' },
  { name: 'Desserts',      emoji: '🍰', bg: '#fdf5ff' },
  { name: 'American',      emoji: '🍔', bg: '#f0fff4' },
  { name: 'Mediterranean', emoji: '🥙', bg: '#f0faff' },
  { name: 'Indian',        emoji: '🍛', bg: '#fffaf0' },
  { name: 'Breakfast',     emoji: '🥞', bg: '#fffff0' },
]

const FILTERS = ['All', 'Under 30 min', 'Vegan', '5 ingredients', 'Meal prep', 'Date night', 'Cocktails']

const CREATOR_STYLE: Record<string, { emoji: string; bg: string }> = {
  '@justineskitchen': { emoji: '👩‍🍳', bg: '#1a120a' },
  '@holmescooking':   { emoji: '👨‍🍳', bg: '#0a1a0a' },
  '@coreyalicia':     { emoji: '👩‍🍳', bg: '#1a0a1a' },
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

type RatingData = { total: number; count: number }

function Stars({ value, max = 5, interactive = false, onRate }: {
  value: number; max?: number; interactive?: boolean; onRate?: (n: number) => void
}) {
  const [hover, setHover] = useState(0)
  const display = hover || value
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <span
          key={n}
          className={interactive ? 'cursor-pointer text-xl transition-transform hover:scale-125' : 'text-sm'}
          style={{ color: n <= display ? '#FBBF24' : 'rgba(255,255,255,0.2)' }}
          onClick={() => interactive && onRate && onRate(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
        >★</span>
      ))}
    </div>
  )
}

function ReelModal({ reel, rating, userRating, onRate, onClose }: {
  reel: Reel
  rating: RatingData | undefined
  userRating: number | undefined
  onRate: (stars: number) => void
  onClose: () => void
}) {
  const [showRecipe, setShowRecipe] = useState(false)
  const [playing, setPlaying] = useState(false)
  const avg = rating && rating.count > 0 ? rating.total / rating.count : 0
  const count = rating?.count ?? 0
  const embedUrl = reel.videoId ? `https://www.youtube.com/embed/${reel.videoId}` : null
  const thumbUrl = reel.videoId ? `https://img.youtube.com/vi/${reel.videoId}/hqdefault.jpg` : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#1a1a1a' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 grid h-8 w-8 place-items-center rounded-full text-white"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >✕</button>

        {/* Video */}
        <div className="aspect-[9/16] w-full relative" style={{ background: reel.bg }}>
          {playing && embedUrl ? (
            <iframe
              src={embedUrl + '?autoplay=1&rel=0'}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full relative">
              {thumbUrl ? (
                <img src={thumbUrl} alt={reel.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">{reel.emoji}</div>
              )}
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={() => setPlaying(true)}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <span className="text-white text-2xl ml-1">▶</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="font-bold text-white text-lg">{reel.title}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{reel.creator} · {reel.cuisine} · {reel.views} views</span>
              {reel.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${reel.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium"
                  style={{ color: GREEN }}
                  onClick={e => e.stopPropagation()}
                >
                  Watch on YouTube ↗
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {count > 0 && (
              <div className="flex items-center gap-2">
                <Stars value={avg} />
                <span className="text-xs font-semibold text-white">{avg.toFixed(1)}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>({count.toLocaleString()} {count === 1 ? 'rating' : 'ratings'})</span>
              </div>
            )}
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {userRating ? `You rated this ${userRating} star${userRating !== 1 ? 's' : ''}` : 'Rate this recipe:'}
            </div>
            <Stars value={userRating ?? 0} interactive onRate={onRate} />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowRecipe(!showRecipe)}
              className="flex-1 rounded-full py-2 text-xs font-bold transition"
              style={reel.hasAiRecipe
                ? { background: GREEN_LIGHT, color: GREEN_DARK }
                : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
            >
              {reel.hasAiRecipe ? '🖨️ Print recipe' : 'Recipe coming soon'}
            </button>
            <button
              className="flex-1 rounded-full py-2 text-xs font-bold text-white transition"
              style={{ background: '#F97316' }}
            >
              🛒 Order ingredients
            </button>
          </div>

          {showRecipe && reel.hasAiRecipe && (
            <div className="rounded-xl p-3 text-sm space-y-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="font-bold text-white">Full Recipe</div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Based on the video — ingredient amounts may vary.</p>
              <div className="text-xs space-y-1">
                <div className="font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Ingredients:</div>
                <ul className="list-disc list-inside space-y-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <li>400g pasta</li><li>4 tbsp butter</li><li>4 cloves garlic, minced</li>
                  <li>½ cup parmesan, grated</li><li>Fresh basil, salt & pepper</li>
                </ul>
                <div className="font-semibold pt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Steps:</div>
                <ol className="list-decimal list-inside space-y-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <li>Cook pasta until al dente, reserve ½ cup pasta water</li>
                  <li>Brown butter in pan over medium heat until nutty</li>
                  <li>Add garlic, cook 1 minute</li>
                  <li>Toss pasta in butter with a splash of pasta water</li>
                  <li>Remove from heat, stir in parmesan, top with basil</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [search, setSearch] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)

  function submitSearch() {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeReel, setActiveReel] = useState<Reel | null>(null)
  const [activeCreator, setActiveCreator] = useState<string | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [recipes, setRecipes] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [favCreators, setFavCreators] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('favCreators') || '[]')) } catch { return new Set() }
  })
  const [ratings, setRatings] = useState<Record<string, RatingData>>(() => {
    try { return JSON.parse(localStorage.getItem('ratings') || '{}') } catch { return {} }
  })
  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('userRatings') || '{}') } catch { return {} }
  })

  function rateRecipe(videoId: string, stars: number) {
    const prev = userRatings[videoId]
    setRatings(r => {
      const existing = r[videoId] ?? { total: 0, count: 0 }
      const updated = {
        total: existing.total - (prev ?? 0) + stars,
        count: existing.count - (prev ? 1 : 0) + 1,
      }
      const next = { ...r, [videoId]: updated }
      localStorage.setItem('ratings', JSON.stringify(next))
      return next
    })
    setUserRatings(u => {
      const next = { ...u, [videoId]: stars }
      localStorage.setItem('userRatings', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    loadCatalog().then(data => {
      setRecipes(data.map(toReel))
      setLoading(false)
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

  const filtered = recipes.filter(r => {
    if (activeCreator && r.handle !== activeCreator) return false
    if (activeCuisine && r.cuisine !== activeCuisine) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.creator.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="text-white" style={{ background: '#0d0d0d' }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 'clamp(380px, 55vh, 650px)' }}>
        <img
          src="/hero.png"
          alt="Steaming pasta on dark marble counter"
          className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: 'center 70%' }}
        />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-5 md:px-12 py-3" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <span className="text-2xl font-bold text-white">
            🎬 My<span style={{ color: GREEN }}>Recipe</span>Reels
          </span>
          <div className="hidden md:flex gap-5 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="cursor-pointer hover:text-white transition">Browse</span>
            <Link to="/creators" className="hover:text-white transition" style={{ color: 'inherit', textDecoration: 'none' }}>Creators</Link>
            <span className="cursor-pointer hover:text-white transition">My Cookbook</span>
            <span className="cursor-pointer font-semibold transition" style={{ color: GREEN }}>Sign up</span>
          </div>
          <div className="flex md:hidden gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Link to="/creators" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Creators</Link>
            <span className="cursor-pointer" style={{ color: GREEN }}>Sign up</span>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 px-5 pb-8 pt-6 md:px-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.9)' }}>
            Search it. Save it. Shop it. Serve it.
          </h1>
          <p className="text-sm md:text-base mb-4" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
            Find any recipe reel. Print the recipe. Order ingredients instantly.<br /><strong>Your recipe reels, your way.</strong>
          </p>
          <button
            className="mb-5 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
            style={{ background: GREEN }}
          >
            Start your reel cookbook
          </button>
          <div className="flex gap-2 w-full max-w-xl rounded-2xl p-2" style={{ background: 'rgba(255,255,255,0.18)', border: '0.5px solid rgba(255,255,255,0.35)' }}>
            <input
              type="text"
              placeholder="Search pasta, Gordon Ramsay, 30 min meals..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitSearch()}
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            />
            <button
              onClick={submitSearch}
              className="rounded-xl px-5 py-2 text-sm font-medium text-white whitespace-nowrap"
              style={{ background: GREEN }}
            >
              🔍 Search
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 md:px-12 xl:px-24 pb-16 space-y-8 pt-6">

        {/* My Faves */}
        {favCreators.size > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>My Faves</div>
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
                    <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl" style={{ background: style.bg, border: '1.5px solid rgba(255,255,255,0.1)' }}>
                      {style.emoji}
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
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Browse by Cuisine</div>
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
                <div className="h-14 flex items-center justify-center text-3xl" style={{ background: c.bg }}>
                  {c.emoji}
                </div>
                <div className="text-[11px] font-medium py-1.5 px-1" style={{ color: activeCuisine === c.name ? GREEN : 'rgba(255,255,255,0.8)' }}>
                  {c.name}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section>
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Filter</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="text-xs px-3 py-1.5 rounded-full transition flex-shrink-0"
                style={activeFilter === f
                  ? { background: GREEN, color: GREEN_LIGHT, border: `1px solid ${GREEN}` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.15)' }}
              >
                {f}
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
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {activeCuisine ? `Trending ${activeCuisine} Reels` : search ? 'Search Results' : 'Trending Reels'}
            </div>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{filtered.length} reels</span>
          </div>

          {loading && (
            <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading reels...</div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(reel => (
              <div
                key={reel.id}
                className="rounded-2xl overflow-hidden cursor-pointer group transition hover:scale-[1.02]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)' }}
                onClick={() => setActiveReel(reel)}
              >
                {/* Thumbnail */}
                <div className="h-28 md:h-24 flex items-center justify-center text-4xl relative" style={{ background: reel.bg }}>
                  {reel.emoji}
                  {/* Save button */}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setSaved(prev => { const n = new Set(prev); n.has(reel.id) ? n.delete(reel.id) : n.add(reel.id); return n })
                    }}
                    className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full text-sm"
                    style={{ background: 'rgba(0,0,0,0.5)', color: saved.has(reel.id) ? '#ef4444' : '#fff' }}
                  >
                    {saved.has(reel.id) ? '♥' : '♡'}
                  </button>
                </div>

                <div className="p-2.5">
                  <div className="text-xs font-semibold text-white mb-0.5 leading-tight">{reel.title}</div>
                  <div className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{reel.creator} · {reel.views} views</div>
                  {ratings[reel.videoId] && ratings[reel.videoId].count > 0 && (
                    <div className="flex items-center gap-1 mb-1">
                      <Stars value={ratings[reel.videoId].total / ratings[reel.videoId].count} />
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>({ratings[reel.videoId].count})</span>
                    </div>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {reel.hasAiRecipe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: GREEN_LIGHT, color: GREEN_DARK }}>Print recipe</span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#FAEEDA', color: '#854F0B' }}>Order ingredients</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {activeReel && (
        <ReelModal
          reel={activeReel}
          rating={ratings[activeReel.videoId]}
          userRating={userRatings[activeReel.videoId]}
          onRate={stars => rateRecipe(activeReel.videoId, stars)}
          onClose={() => setActiveReel(null)}
        />
      )}
    </div>
  )
}
