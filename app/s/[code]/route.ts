import { NextRequest, NextResponse } from 'next/server'
import { logShortLinkClick }       from '@/lib/marketing/shortlink'

/**
 * app/s/[code]/route.ts
 * Endpoint de redirection pour les liens courts.
 * 
 * Flow:
 * 1. Reçoit une requête GET (ex: yayyam.com/s/ABCDEF)
 * 2. Log le clic (incrémente SQL + extrait la ville/source)
 * 3. Redirige vers la cible (302)
 * 4. Si inexistant, retourne à l'accueil
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  if (!code) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  try {
    // Le log est synchrone ici pour s'assurer que Analytics est déclenché.
    // L'insert côté Supabase se fait de manière atomique.
    const targetUrl = await logShortLinkClick(code)

    if (targetUrl) {
      // Redirection temporaire 302 (important pour que le navigateur requery à chaque fois)
      return NextResponse.redirect(targetUrl, 302)
    } else {
      // Lien introuvable
      return NextResponse.redirect(new URL('/', req.url))
    }
  } catch (error) {
    console.error('[ShortLink Redirect Error]', error)
    return NextResponse.redirect(new URL('/', req.url))
  }
}
