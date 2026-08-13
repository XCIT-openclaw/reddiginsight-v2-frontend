'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Tables<'users'> | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  profileLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth loading timeout (10 seconds) - optimized for faster page load
const AUTH_LOADING_TIMEOUT = 10000
const AUTH_RETRY_ATTEMPTS = 2
const AUTH_RETRY_DELAY = 500
const HAS_SUPABASE_ENV = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Tables<'users'> | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(HAS_SUPABASE_ENV)
  const [profileLoading, setProfileLoading] = useState(false)
  const [supabase] = useState(() => (HAS_SUPABASE_ENV ? createClient() : null))

  // Access session state via a ref to avoid stale closures
  const fetchingProfileRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const lastTokenRef2 = useRef<string | null>(null)

  const fetchProfile = async (userId: string, accessToken?: string | null) => {
    // Skip if already fetching or already have profile for this user
    if (fetchingProfileRef.current) return
    if (lastFetchedUserIdRef.current === userId && profile) return

    fetchingProfileRef.current = true
    setProfileLoading(true)
    try {
      const token = accessToken ?? sessionRef.current?.access_token
      if (!token) return

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch('/api/profile', {
        headers: { 'Authorization': 'Bearer ' + token },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        console.error('Profile API error:', res.status)
        return
      }

      const json = await res.json()
      if (json.success && json.profile) {
        setProfile(json.profile)
        setIsAdmin(json.profile?.is_admin === true)
        lastFetchedUserIdRef.current = userId
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error fetching profile:', error)
      }
    } finally {
      setProfileLoading(false)
      fetchingProfileRef.current = false
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null
    let retryCount = 0

    const validateUser = async (): Promise<void> => {
      try {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (activeSession?.user) {
          sessionRef.current = activeSession
          setSession(activeSession)
          setUser(activeSession.user)
          fetchProfile(activeSession.user.id, activeSession.access_token)
        }

        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (error || !user) {
          console.error('Error validating user session:', error)
          // Only clear state on definitive auth failures (not network issues)
          // Network errors have status 0 or no status; auth failures have status 401
          const isNetworkError = !error?.status || error?.status === 0
          const hasRecoveredSession = Boolean(activeSession?.user)
          if ((error?.message?.includes('JWT') || error?.message?.includes('session')) && !isNetworkError && !hasRecoveredSession) {
            console.log('[AuthContext] Clearing state due to auth failure (not network error)')
            setUser(null)
            setSession(null)
            setProfile(null)
          }
          // On network errors, preserve existing state
        } else {
          // User validated by server
          setUser(user)
          if (!activeSession || activeSession.user.id !== user.id) {
            fetchProfile(user.id)
          }
          // Also fetch session for token access
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted && session) {
              setSession(session)
            }
          })
        }
        setLoading(false)
        if (timeoutId) clearTimeout(timeoutId)
      } catch (error) {
        if (!mounted) return
        console.error('Failed to validate user:', error)
        
        // Retry on network errors
        if (retryCount < AUTH_RETRY_ATTEMPTS) {
          retryCount++
          console.log(`Retrying auth validation (attempt ${retryCount}/${AUTH_RETRY_ATTEMPTS})...`)
          await new Promise(resolve => setTimeout(resolve, AUTH_RETRY_DELAY))
          return validateUser()
        }
        
        // On final failure, preserve state but stop loading
        // Do NOT clear user state - keep last known state
        setLoading(false)
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - preserving last known state and stopping loading')
        // Do NOT clear user state - keep last known state
        setLoading(false)
      }
    }, AUTH_LOADING_TIMEOUT)

    validateUser()

    // Listen for auth changes - ONLY update state AFTER getUser() has initialized
    // Keep browser session and app state aligned as Supabase refreshes tokens.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // Only update state if the token actually changed
        if (session?.access_token === lastTokenRef2.current) {
          setLoading(false)
          return
        }
        lastTokenRef2.current = session?.access_token ?? null

        console.log("Auth state changed:", event, "token updated")

        if (event === "SIGNED_OUT") {
          setUser(null)
          setSession(null)
          setProfile(null)
          setLoading(false)
          return
        }

        if (session?.user) {
          sessionRef.current = session
          setSession(session)
          setUser(session.user)
        }
        setLoading(false)

        // Fetch/refresh profile whenever the active session is established or refreshed.
        if (session?.user) {
          const shouldFetchProfile =
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "INITIAL_SESSION" ||
            lastFetchedUserIdRef.current !== session.user.id
          if (shouldFetchProfile) {
            await fetchProfile(session.user.id, session.access_token)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase environment variables are not configured.') }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.session) {
        console.log('[signIn] Login successful, setting session cookies...')
        
        const setSessionResponse = await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        })

        if (!setSessionResponse.ok) {
          console.error('[signIn] Failed to set session cookies:', await setSessionResponse.text())
        } else {
          console.log('[signIn] Session cookies set successfully')
        }
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase environment variables are not configured.') }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (data.user?.identities?.length === 0) {
        return { error: new Error('An account with this email already exists. Please sign in instead.') }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error('Google sign in failed:', error.message);
      }
    } catch (err: any) {
      console.error('Google sign in failed:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        profile,
        session,
        loading,
        profileLoading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
