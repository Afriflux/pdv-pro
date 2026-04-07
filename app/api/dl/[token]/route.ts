import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { validateDigitalToken, logDownload } from '@/lib/digital/access'

/**
 * GET /api/dl/[token]?file=<encoded_storage_path>
 *
 * Sert un fichier digital de façon sécurisée :
 * 1. Valide le token DigitalAccess (non expiré, non révoqué, quota restant)
 * 2. Incrémente downloads_used + log dans DownloadLog
 * 3. Génère une signed URL Supabase Storage valable 60 s
 *    OU redirige vers lien externe / vidéo Bunny
 *
 * Paramètre ?file= optionnel : chemin du fichier spécifique (multi-fichiers).
 * Sans ?file=, utilise le premier fichier digital du produit.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token }    = await params
  const fileParam    = req.nextUrl.searchParams.get('file')

  // ── 1. Valider le token ────────────────────────────────────────────────────
  const result = await validateDigitalToken(token)

  if (result.status === 'not_found') {
    return NextResponse.json({ error: 'Token invalide.' }, { status: 404 })
  }
  if (result.status === 'revoked') {
    return NextResponse.redirect(new URL(`/dl/${token}`, req.url))
  }
  if (result.status === 'expired') {
    return NextResponse.redirect(new URL(`/dl/${token}`, req.url))
  }
  if (result.status === 'exhausted') {
    return NextResponse.redirect(new URL(`/dl/${token}`, req.url))
  }
  if (!result.access) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const { access } = result

  // ── 2. Identifier le fichier à servir ──────────────────────────────────────
  let targetUrl: string | null = null

  if (fileParam) {
    // Paramètre explicite → chercher ce fichier parmi les digital_files
    const files = access.product.digital_files ?? []
    const found = files.find(f => f.url === fileParam)
    targetUrl = found?.url ?? fileParam
  } else {
    // Pas de paramètre → premier fichier non-vidéo, ou premier tout court
    const files    = access.product.digital_files ?? []
    const nonVideo = files.find(f => f.type !== 'video')
    targetUrl      = nonVideo?.url ?? files[0]?.url ?? null
  }

  if (!targetUrl) {
    return NextResponse.json({ error: 'Aucun fichier disponible.' }, { status: 404 })
  }

  // ── 3. Logger le téléchargement (incrémente downloads_used) ───────────────
  const logged = await logDownload(access.id)
  if (!logged) {
    // Quota atteint entre la validation et maintenant (race condition)
    return NextResponse.redirect(new URL(`/dl/${token}`, req.url))
  }

  // ── 4. Servir le fichier ───────────────────────────────────────────────────

  // Lien externe ou espace membre → redirection directe
  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    return NextResponse.redirect(targetUrl)
  }

  // Fichier Supabase Storage (chemin relatif) → signed URL 60 secondes
  const supabase = await createClient()
  const { data: signed, error } = await supabase.storage
    .from('yayyam-digital')
    .createSignedUrl(targetUrl, 60)

  if (error || !signed?.signedUrl) {
    console.error('[dl/route] Erreur signed URL:', error?.message)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
