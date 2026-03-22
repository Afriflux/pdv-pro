import { NextResponse } from 'next/server'
import { validateAmbassadorCode } from '@/lib/ambassador/ambassador-service'

// Pas d'auth requise — appelé pendant l'inscription publique
export const dynamic = 'force-dynamic'

// ─── GET /api/ambassador/validate?code=CODE-AMBASSADEUR ──────────────────────

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  // 1. Paramètre obligatoire
  if (!code || !code.trim()) {
    return NextResponse.json(
      { valid: false, message: 'Paramètre code manquant' },
      { status: 400 }
    )
  }

  // 2. Valider le code via le service ambassadeur
  try {
    const ambassador = await validateAmbassadorCode(code.trim())

    if (!ambassador) {
      return NextResponse.json(
        { valid: false, message: 'Code invalide ou inactif' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { valid: true, ambassadorName: ambassador.name, message: 'Code valide' },
      { status: 200 }
    )
  } catch (error: unknown) {

    console.error('[API/ambassador/validate]', error)
    return NextResponse.json(
      { valid: false, message: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}
