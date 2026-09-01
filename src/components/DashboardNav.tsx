'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart3, BookOpen, FileText, CreditCard, LogOut, Menu, X, Settings, MessageSquare, Home } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'How to Use', href: '/how-to-use', icon: BookOpen },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
]

export function DashboardNav() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U'

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1 sm:gap-2">
              <Image src="/images/logo.png" alt="ReddigInsight" width={28} height={28} className="h-6 w-6 sm:h-7 sm:w-7" />
              <span className="text-base sm:text-lg font-bold">ReddigInsight</span>
            </Link>
            <div className="hidden md:flex md:ml-10 md:space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {profile && (
              <div data-testid="credits-display" className="hidden sm:flex items-center gap-2 text-sm bg-indigo-50 px-3 py-1.5 rounded-full">
                <span className="text-muted-foreground">Credits:</span>
                <span className="font-semibold text-indigo-600">{profile.credits}</span>
              </div>
            )}

            <button
              type="button"
              className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-accent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Simple custom dropdown - no Base UI dependency */}
            {user && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="relative h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                {initials}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg bg-popover border shadow-md z-50 py-1">
                  {user && (
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{profile?.credits ?? 0} credits</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push('/settings') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push('/pricing') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                  >
                    <CreditCard className="h-4 w-4" />
                    Buy Credits
                  </button>
                  <div className="border-t my-1" />
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
            )}
            {!user && (
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
              {profile && (
                <div data-testid="credits-display-mobile" className="flex items-center gap-2 px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">Credits:</span>
                  <span className="font-semibold text-indigo-600">{profile.credits}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
