// ─── app/api/brevo/send-welcome/route.ts ────────────────────────────────────
// Route API interne : envoi de l'email de bienvenue approprié (vendeur ou acheteur)
// Appelée en fire-and-forget depuis app/auth/actions.ts après l'inscription
// Pas d'authentification requise (route interne, non exposée au public)

import { NextRequest, NextResponse } from 'next/server'
import { sendTransactionalEmail, createOrUpdateContact } from '@/lib/brevo/brevo-service'
import { welcomeVendorEmail, welcomeBuyerEmail } from '@/lib/brevo/email-templates'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SendWelcomeBody {
  type: 'vendor' | 'buyer'
  email: string
  name: string
  storeName?: string
}

// ─── POST /api/brevo/send-welcome ────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Lire et parser le body JSON
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body JSON invalide' },
        { status: 400 }
      )
    }

    // 2. Validation des champs obligatoires
    const { type, email, name, storeName } = body as SendWelcomeBody

    if (!type || !email || !name) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants : type, email, name' },
        { status: 400 }
      )
    }

    if (type !== 'vendor' && type !== 'buyer') {
      return NextResponse.json(
        { success: false, error: 'Valeur "type" invalide — attendu : vendor | buyer' },
        { status: 400 }
      )
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    if (type === 'vendor' && !storeName) {
      return NextResponse.json(
        { success: false, error: 'storeName requis pour un vendeur' },
        { status: 400 }
      )
    }

    // 3. Construction des attributs et liste Brevo selon le type d'utilisateur
    //    Liste 1 = acheteurs, Liste 2 = vendeurs (IDs Brevo configurés)
    const isVendor = type === 'vendor'

    const contactAttributes: Record<string, string | number | boolean> = {
      PRENOM: name.split(' ')[0] ?? name,
      NOM: name.split(' ').slice(1).join(' ') || '',
      TYPE_COMPTE: isVendor ? 'Vendeur' : 'Acheteur',
      ...(isVendor && storeName ? { BOUTIQUE: storeName } : {}),
    }

    // Liste Brevo : 2 = vendeurs, 1 = acheteurs
    const listId = isVendor ? 2 : 1

    // 4. Générer le HTML de l'email de bienvenue selon le type
    const htmlContent = isVendor
      ? welcomeVendorEmail(storeName!, name)
      : welcomeBuyerEmail(name)

    const subject = isVendor
      ? `Bienvenue sur PDV Pro, ${name} ! Votre boutique est prête 🎉`
      : `Bienvenue sur PDV Pro, ${name} ! 👋`

    // 5. Créer / mettre à jour le contact dans Brevo (fire-and-forget interne)
    //    On ne bloque pas l'inscription si Brevo échoue
    const [contactCreated, emailSent] = await Promise.allSettled([
      createOrUpdateContact(email, contactAttributes, [listId]),
      sendTransactionalEmail({
        to: [{ email, name }],
        subject,
        htmlContent,
        sender: { name: 'PDV Pro', email: 'noreply@pdvpro.com' },
      }),
    ])

    // 6. Logging de l'état (sans bloquer la réponse)
    if (contactCreated.status === 'rejected') {
      console.error('[Brevo /send-welcome] Échec création contact:', contactCreated.reason)
    }
    if (emailSent.status === 'rejected') {
      console.error('[Brevo /send-welcome] Échec envoi email:', emailSent.reason)
    }

    // Résultat partiel possible : on retourne toujours success: true
    // pour ne pas bloquer le flux d'inscription de l'utilisateur
    const contactOk = contactCreated.status === 'fulfilled' && contactCreated.value === true
    const emailOk   = emailSent.status === 'fulfilled' && emailSent.value === true

    console.log(
      `[Brevo /send-welcome] type=${type} email=${email} → contact=${contactOk} email=${emailOk}`
    )

    return NextResponse.json(
      {
        success: true,
        contactCreated: contactOk,
        emailSent: emailOk,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    // Erreur non prévue — on logge mais on répond success pour ne pas bloquer l'UX
    const message = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[Brevo /send-welcome] Erreur non gérée:', message)

    return NextResponse.json(
      { success: true, warning: message },
      { status: 200 }
    )
  }
}
