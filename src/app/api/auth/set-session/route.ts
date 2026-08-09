import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Set session cookies from tokens passed by client-side auth.
 * This is needed because signInWithPassword stores session in localStorage,
 * but middleware reads from cookies. This route bridges the gap.
 */
export async function POST(request: NextRequest) {
  const cookiesToApply: Array<{
    name: string
    value: string
    options?: Parameters<NextResponse['cookies']['set']>[2]
  }> = []

  try {
    const body = await request.json()
    const { access_token, refresh_token } = body

    if (!access_token || !refresh_token) {
      console.error('[set-session] Missing tokens in request body')
      return NextResponse.json(
        { error: 'Missing access_token or refresh_token' },
        { status: 400 }
      )
    }

    console.log('[set-session] Received tokens, setting cookies...')

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Set cookies on both the cookie store AND the response
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              cookiesToApply.push({ name, value, options })
            })
            console.log('[set-session] Cookies set on response:', cookiesToSet.map(c => c.name))
          },
        },
      }
    )

    // Set the session from the provided tokens
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      console.error('[set-session] Error setting session:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('[set-session] Session set successfully for user:', data.user?.email)

    // Verify the session is now accessible via getUser
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('[set-session] getUser verification:', 
      userData?.user ? 'SUCCESS - user found' : 'FAILED - ' + userError?.message
    )

    const response = NextResponse.json(
      { success: true, user: data.user },
      { status: 200 }
    )
    cookiesToApply.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  } catch (error) {
    console.error('[set-session] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
