import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { signUp, confirmSignUp, signIn, resendConfirmationCode } from '../auth/cognito'

const GREEN = '#1D9E75'

type Mode = 'signup' | 'login' | 'verify'

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '0.5px solid rgba(255,255,255,0.15)',
  color: '#fff',
  borderRadius: '12px',
  padding: '10px 12px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
}

export default function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { setEmail: setAuthEmail } = useAuth()
  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    setError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await signUp(email, password)
      setMode('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    setError('')
    if (!code.trim()) { setError('Enter the code from your email'); return }
    setLoading(true)
    try {
      await confirmSignUp(email, code)
      await signIn(email, password)
      setAuthEmail(email)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    setError('')
    if (!email.trim() || !password) { setError('Enter your email and password'); return }
    setLoading(true)
    try {
      await signIn(email, password)
      setAuthEmail(email)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    try {
      await resendConfirmationCode(email)
      setError('Code resent — check your email.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  function handleSubmit() {
    if (mode === 'signup') handleSignUp()
    else if (mode === 'verify') handleVerify()
    else handleLogin()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
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
          {mode === 'verify' ? (
            <>
              <div className="mb-5">
                <div className="text-lg font-bold text-white mb-1">Check your email</div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Enter the verification code we sent to <span className="text-white font-medium">{email}</span>.
                </p>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Verification code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  style={inputStyle}
                />
                {error && <p className="text-xs" style={{ color: error.includes('resent') ? GREEN : '#ef4444' }}>{error}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full rounded-full py-2.5 text-sm font-semibold text-white mt-1"
                  style={{ background: GREEN, opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Verifying...' : 'Verify & continue'}
                </button>
                <button onClick={handleResend} className="w-full text-center text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Resend code
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="text-lg font-bold text-white mb-1">
                  {mode === 'signup' ? 'Sign up to save, hide & rate recipes' : 'Welcome back'}
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {mode === 'signup'
                    ? "We'll send a verification code to your email."
                    : 'Sign in to your MyRecipeReels account.'}
                </p>
              </div>

              <div className="flex rounded-xl p-1 mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {(['signup', 'login'] as Mode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError('') }}
                    className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition"
                    style={mode === m ? { background: GREEN, color: '#fff' } : { color: 'rgba(255,255,255,0.4)' }}
                  >
                    {m === 'signup' ? 'Sign up' : 'Log in'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Email address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Password</label>
                  <input
                    type="password"
                    placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full rounded-full py-2.5 text-sm font-semibold text-white mt-1"
                  style={{ background: GREEN, opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
