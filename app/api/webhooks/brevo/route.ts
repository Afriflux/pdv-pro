import { NextResponse } from 'next/server'

// Pour le webhook, on attend ce Token Bearer envoyé par Brevo
const WEBHOOK_SECRET = process.env.BREVO_WEBHOOK_SECRET || 'YAYYAM_BREVO_WH_SECRET_2026'

export async function POST(request: Request) {
  try {
    // 1. Vérification du Header d'Authentification (Bearer Token)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.warn('[Webhook Brevo] Tentative non autorisée')
      return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
    }

    // 2. Récupération du contenu (Payload de Brevo)
    const payload = await request.json()
    console.log(`[Webhook Brevo] Événement reçu: ${payload.event} pour ${payload.email}`)

    // 3. Traitement selon le type d'événement
    /**
     * Types courants envoyés par Brevo:
     * - 'delivered'
     * - 'opened'
     * - 'click'
     * - 'hard_bounce' / 'soft_bounce'
     * - 'spam'
     * - 'unsubscribed'
     */
    switch (payload.event) {
      case 'opened':
        // Logique pour mettre à jour la BDD locale (ex: stats email lues)
        break;
      case 'click':
        // Logique pour les clics
        break;
      case 'hard_bounce':
        // Utile pour désactiver l'email dans Supabase ou tagger l'utilisateur
        break;
      default:
        // Evénements secondaires (ignored)
        break;
    }

    // Brevo attend impérativement un code 200 OK rapide pour savoir qu'on a reçu l'info
    return NextResponse.json({ message: 'Webhook traité avec succès' }, { status: 200 })
    
  } catch (error) {
    console.error('[Webhook Brevo] Erreur interne:', error)
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 })
  }
}
