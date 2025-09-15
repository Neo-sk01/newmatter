import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/company(.*)',
  '/api/protected(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return

  const { userId } = auth()
  if (userId) return

  // Unauthenticated: if accessing a company dashboard, redirect to that company's portal
  const path = req.nextUrl.pathname
  const dashboardMatch = path.match(/^\/dashboard\/(\w[\w-]*)/)
  if (dashboardMatch) {
    const companyId = dashboardMatch[1]
    const signInUrl = new URL(`/${companyId}/sign-in`, req.url)
    signInUrl.searchParams.set('redirect_url', req.nextUrl.href)
    return NextResponse.redirect(signInUrl)
  }

  // Fallback to default Clerk protection
  await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
