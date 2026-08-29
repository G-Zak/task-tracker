import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session_user')

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/org')

  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL('/authentication', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Pas de redirection automatique hors de /authentication pour un visiteur déjà connecté : ça
  // empêchait toute tentative de connexion avec un AUTRE compte tant qu'une session existait déjà
  // (le formulaire ne s'affichait jamais, la nouvelle tentative n'atteignait jamais loginAction).
  // La page /authentication gère elle-même l'affichage "déjà connecté" et le changement de compte.

  return NextResponse.next()
}

export const config = {
  matcher: ['/org/:path*', '/authentication'],
}