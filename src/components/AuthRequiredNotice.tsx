import Link from 'next/link'
import { ArrowRight, CheckCircle2, LogIn, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthRequiredNoticeProps {
  title: string
  description: string
  bullets: string[]
  returnTo: string
}

export function AuthRequiredNotice({
  title,
  description,
  bullets,
  returnTo,
}: AuthRequiredNoticeProps) {
  const loginHref = `/login?redirect=${encodeURIComponent(returnTo)}`

  return (
    <Card className="mx-auto w-full max-w-3xl border-border/40 bg-white/90 shadow-lg backdrop-blur dark:bg-gray-900/90">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500">
          <Sparkles className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
        <CardDescription className="mx-auto max-w-xl text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-7">
        <ul className="grid gap-3 text-left sm:grid-cols-2">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex gap-3 rounded-xl border border-border/50 bg-background/70 p-4 text-sm leading-relaxed"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={loginHref} className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign In
            </Button>
          </Link>
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full gap-2">
              Create Free Account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
