import { Link } from 'react-router-dom'

const GREEN = '#4ade80'
const CONTACT_EMAIL = 'christiesilvers@gmail.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold mb-3" style={{ color: GREEN }}>{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {children}
      </div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#110f0a', color: 'rgba(255,255,255,0.85)' }}>

      {/* Nav */}
      <nav className="flex items-center gap-4 px-5 md:px-12 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="text-lg font-bold">
            My<span style={{ color: GREEN }}>Recipe</span>Reels
          </span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-12">
        <h1 className="text-2xl font-bold mb-2">Terms of Service &amp; DMCA Policy</h1>
        <p className="text-xs mb-10" style={{ color: 'rgba(255,255,255,0.3)' }}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <Section title="About MyRecipeReels">
          <p>MyRecipeReels.com is a recipe discovery platform that curates and links to publicly available cooking videos on YouTube. We do not host video content — all videos are embedded directly from YouTube and remain the property of their original creators.</p>
        </Section>

        <Section title="Use of This Site">
          <p>MyRecipeReels is provided for personal, non-commercial use. You may browse, save, and print recipes for your own personal use. You may not reproduce, distribute, or repurpose site content for commercial purposes without written permission.</p>
          <p>We reserve the right to modify or discontinue the service at any time without notice.</p>
        </Section>

        <Section title="Embedded Content &amp; Third-Party Links">
          <p>Videos embedded on this site are served by YouTube. By viewing embedded videos, you are also subject to <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: GREEN }}>YouTube's Terms of Service</a>. MyRecipeReels is not responsible for the content, accuracy, or availability of third-party links or embedded videos.</p>
        </Section>

        <Section title="AI-Generated Recipe Summaries">
          <p>Some recipes on this site include AI-generated summaries for convenience. These are approximations based on video content and may contain errors. Always verify ingredients and steps against the original video before cooking. MyRecipeReels makes no warranty as to the accuracy of AI-generated content.</p>
        </Section>

        <Section title="Disclaimer of Warranties">
          <p>This site is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the site will be error-free, uninterrupted, or free of harmful components.</p>
        </Section>

        <Section title="DMCA Takedown Policy">
          <p>MyRecipeReels respects the intellectual property rights of content creators. If you believe that content on this site infringes your copyright, please send a written takedown request to the contact address below.</p>
          <p>Your notice must include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your name and contact information</li>
            <li>A description of the copyrighted work you claim has been infringed</li>
            <li>The specific URL(s) on our site where the infringing content appears</li>
            <li>A statement that you have a good faith belief the use is not authorized</li>
            <li>A statement, under penalty of perjury, that you are the copyright owner or authorized to act on their behalf</li>
            <li>Your physical or electronic signature</li>
          </ul>
          <p className="mt-3">
            Send takedown requests to:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: GREEN }}>{CONTACT_EMAIL}</a>
          </p>
          <p>We will review valid requests and remove or disable access to infringing content promptly.</p>
        </Section>

        <Section title="Contact">
          <p>For any questions about these terms, please contact us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: GREEN }}>{CONTACT_EMAIL}</a>.</p>
        </Section>
      </div>

      <footer className="px-5 pb-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        © {new Date().getFullYear()} MyRecipeReels.com
      </footer>
    </div>
  )
}
