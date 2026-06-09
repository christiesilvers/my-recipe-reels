import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getCurrentUserEmail, signOut as cognitoSignOut } from './cognito'

type AuthContextValue = {
  email: string | null
  loading: boolean
  setEmail: (email: string | null) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUserEmail().then(e => {
      setEmail(e)
      setLoading(false)
    })
  }, [])

  function signOut() {
    cognitoSignOut()
    setEmail(null)
  }

  return (
    <AuthContext.Provider value={{ email, loading, setEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
