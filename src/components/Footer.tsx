import { Link } from 'react-router-dom'

const GREEN = '#4ade80'

export default function Footer() {
  return (
    <footer className="mt-16 px-5 md:px-12 xl:px-24 pb-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
      <div className="border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>My</span>
        <span style={{ color: GREEN, fontWeight: 700 }}>Recipe</span>
        <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Reels</span>
        <span className="mx-2">·</span>
        © {new Date().getFullYear()} MyRecipeReels.com
        <span className="mx-2">·</span>
        <Link to="/terms" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
          className="hover:underline">Terms &amp; DMCA</Link>
      </div>
    </footer>
  )
}
