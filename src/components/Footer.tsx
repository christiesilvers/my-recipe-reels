import { Link } from 'react-router-dom'

const GREEN = '#4ade80'

export default function Footer() {
  return (
    <footer className="mt-2 md:mt-0 px-5 md:px-12 xl:px-24 pb-2 md:pb-4 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
      <div className="border-t pt-2 md:pt-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span style={{ fontWeight: 700, color: '#ffffff' }}>My</span>
        <span style={{ color: GREEN, fontWeight: 700 }}>Recipe</span>
        <span style={{ fontWeight: 700, color: '#ffffff' }}>Reels</span>
        <span className="mx-2">·</span>
        © {new Date().getFullYear()} MyRecipeReels.com
        <span className="mx-2">·</span>
        <Link to="/terms" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
          className="hover:underline">Terms &amp; DMCA</Link>
      </div>
    </footer>
  )
}
