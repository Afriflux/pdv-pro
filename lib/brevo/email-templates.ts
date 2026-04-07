// ─── lib/brevo/email-templates.ts ───────────────────────────────────────────
// 7 templates HTML pour les emails transactionnels Yayyam
// Charte : fond #FAFAF7, header émeraude #0F7A60, boutons CTA #0F7A60, texte #1A1A1A
// Tous les styles sont inline (email-safe)

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderInfo {
  id: string
  productName: string
  total: number
  status: string
  buyerName: string
  paymentMethod: string
}

export interface VendorStats {
  totalOrders: number
  totalRevenue: number
  bestProduct: string
  newCustomers: number
}

// ─── Helper : structure HTML commune ─────────────────────────────────────────

/**
 * Enveloppe commune à tous les emails Yayyam.
 * Applique la charte graphique de manière cohérente.
 */
function emailWrapper(bodyContent: string, preheaderText = ''): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Yayyam</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAF7;font-family:Arial,sans-serif;color:#1A1A1A;">
  ${preheaderText ? `<div style="display:none;font-size:1px;color:#FAFAF7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheaderText}</div>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#FAFAF7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">

          <!-- HEADER Yayyam -->
          <tr>
            <td style="background-color:#0F7A60;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:26px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px;">Yayyam</h1>
              <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;">Plateforme de vente africaine</p>
            </td>
          </tr>

          <!-- CONTENU -->
          <tr>
            <td style="padding:36px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#F4F4F0;padding:20px 32px;text-align:center;border-top:1px solid #E8E8E4;">
              <p style="margin:0;font-size:12px;color:#888888;">
                © Yayyam · Tous droits réservés
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#AAAAAA;">
                Vous recevez cet email car vous avez un compte Yayyam.
                <br/>
                <a href="https://yayyam.com/unsubscribe" style="color:#0F7A60;text-decoration:underline;">Se désabonner</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Génère un bouton CTA email-safe aux couleurs Yayyam.
 */
function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px;background-color:#0F7A60;">
        <a href="${url}" target="_blank"
          style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:8px;font-family:Arial,sans-serif;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

/**
 * Email de rappel de rendez-vous (-24h).
 */
export function bookingReminderEmail(buyerName: string, productName: string, date: string, time: string, visioLink: string): string {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F7A60;">Rappel de votre session demain 📅</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${buyerName}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Ceci est un rappel automatique pour votre session <strong>"${productName}"</strong> prévue le <strong>${date}</strong> à <strong>${time} (GMT)</strong>.
    </p>

    ${ctaButton('Rejoindre la Visio', visioLink)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
      Si vous avez un imprévu, veuillez vérifier votre facture pour contacter le vendeur afin de reprogrammer votre créneau.
    </p>
  `

  return emailWrapper(body, `Rappel : Votre session "${productName}" est pour demain.`)
}

/**
 * Ligne de séparation subtile.
 */
function divider(): string {
  return `<hr style="border:none;border-top:1px solid #EFEFED;margin:24px 0;" />`
}

// ─── 1. Email de bienvenue — Vendeur ─────────────────────────────────────────

/**
 * Email de bienvenue pour un nouveau vendeur qui vient de créer son espace.
 * @param storeName  - Nom de la boutique créée
 * @param vendorName - Prénom/nom du vendeur
 */
export function welcomeVendorEmail(storeName: string, vendorName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F7A60;">Bienvenue sur Yayyam ! 🎉</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${vendorName}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Votre espace de vente <strong style="color:#0F7A60;">« ${storeName} »</strong> est prêt !
      Vous pouvez dès maintenant ajouter vos produits, personnaliser votre boutique et commencer à vendre.
    </p>

    <div style="background-color:#F0FAF7;border-left:4px solid #0F7A60;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;color:#0F7A60;font-weight:700;">✅ Ce que vous pouvez faire dès maintenant :</p>
      <ul style="margin:10px 0 0;padding-left:20px;font-size:14px;color:#444444;line-height:1.8;">
        <li>Ajouter vos premiers produits (physiques ou digitaux)</li>
        <li>Configurer votre page de vente</li>
        <li>Partager votre lien de boutique sur les réseaux sociaux</li>
        <li>Activer vos passerelles de paiement (Wave, CinetPay…)</li>
      </ul>
    </div>

    ${ctaButton('Accéder à mon dashboard', `${appUrl}/dashboard`)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
      Une question ? Contactez notre équipe sur WhatsApp ou consultez notre
      <a href="${appUrl}/tips" style="color:#0F7A60;text-decoration:underline;">centre d'aide</a>.
    </p>
  `

  return emailWrapper(body, `Votre boutique ${storeName} est prête — Commencez à vendre dès maintenant !`)
}

// ─── 2. Email de bienvenue — Acheteur ────────────────────────────────────────

/**
 * Email de bienvenue pour un nouvel acheteur qui vient de créer son compte.
 * @param buyerName - Prénom/nom de l'acheteur
 */
export function welcomeBuyerEmail(buyerName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F7A60;">Bienvenue sur Yayyam ! 👋</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${buyerName}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Votre compte Yayyam est actif. Découvrez des centaines de boutiques africaines
      proposant des produits physiques, formations, et bien plus encore.
    </p>

    <div style="background-color:#FDF9F0;border-left:4px solid #C9A84C;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;color:#C9A84C;font-weight:700;">🛍️ Pourquoi choisir Yayyam ?</p>
      <ul style="margin:10px 0 0;padding-left:20px;font-size:14px;color:#444444;line-height:1.8;">
        <li>Paiement sécurisé — Wave, Orange Money, carte bancaire</li>
        <li>Livraison digitale instantanée</li>
        <li>Vendeurs africains vérifiés</li>
        <li>Support client disponible 7j/7</li>
      </ul>
    </div>

    ${ctaButton('Découvrir les boutiques', `${appUrl}/boutiques`)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
      Besoin d'aide ? Notre équipe est disponible via WhatsApp.
    </p>
  `

  return emailWrapper(body, 'Votre compte Yayyam est prêt — Découvrez les boutiques africaines !')
}

// ─── 3. Email de confirmation de commande — Acheteur ─────────────────────────

/**
 * Email envoyé à l'acheteur après confirmation de son paiement.
 * @param order - Détails de la commande
 */
export function orderConfirmationEmail(order: OrderInfo, telegramGroupName?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'

  // Formatage du montant en FCFA
  const formattedTotal = new Intl.NumberFormat('fr-FR').format(order.total)

  // Libellé du statut en français
  const statusLabel: Record<string, string> = {
    paid: '✅ Payée',
    pending: '⏳ En attente',
    processing: '🔄 En traitement',
    shipped: '📦 Expédiée',
    delivered: '🎉 Livrée',
    completed: '✅ Complétée',
  }
  const statusText = statusLabel[order.status] ?? order.status

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F7A60;">Commande confirmée ! ✅</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${order.buyerName}</strong>,<br/>
      votre commande a bien été reçue et est en cours de traitement.
    </p>

    <!-- Récapitulatif commande -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
      style="background-color:#F5F5F2;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Récapitulatif</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;">
            <tr>
              <td style="font-size:14px;color:#666666;padding:6px 0;border-bottom:1px solid #E8E8E4;">Commande n°</td>
              <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #E8E8E4;">#${order.id.slice(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#666666;padding:6px 0;border-bottom:1px solid #E8E8E4;">Produit</td>
              <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #E8E8E4;">${order.productName}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#666666;padding:6px 0;border-bottom:1px solid #E8E8E4;">Paiement</td>
              <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #E8E8E4;">${order.paymentMethod}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#666666;padding:6px 0;border-bottom:1px solid #E8E8E4;">Statut</td>
              <td style="font-size:14px;color:#0F7A60;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #E8E8E4;">${statusText}</td>
            </tr>
            <tr>
              <td style="font-size:16px;color:#1A1A1A;font-weight:900;padding:10px 0 0;">Total payé</td>
              <td style="font-size:16px;color:#0F7A60;font-weight:900;text-align:right;padding:10px 0 0;">${formattedTotal} FCFA</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${telegramGroupName ? `
    <div style="background-color:#EFF6FF;border-left:4px solid #3B82F6;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:14px;color:#1E40AF;font-weight:700;">🔐 Accès groupe privé inclus</p>
      <p style="margin:0;font-size:14px;color:#1E3A8A;line-height:1.6;">
        Votre achat inclut l'accès au groupe <strong>"${telegramGroupName}"</strong>.
        <br/>Vous recevrez votre lien d'invitation par <strong>WhatsApp</strong> dans les prochaines minutes.
        <br/><em style="font-size:12px;color:#6B7280;">Le lien est à usage unique et valable 1 heure.</em>
      </p>
    </div>
    ` : ''}

    <p style="margin:0 0 20px;font-size:14px;color:#666666;line-height:1.6;">
      Vous serez notifié par WhatsApp et email dès que votre commande évolue.
    </p>

    ${ctaButton('Voir ma commande', `${appUrl}/dashboard`)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
      Un problème avec votre commande ? Contactez-nous sur WhatsApp.
    </p>
  `

  return emailWrapper(body, `Commande #${order.id.slice(0, 8).toUpperCase()} confirmée — ${formattedTotal} FCFA`)
}

// ─── 4. Email commande expédiée — Acheteur ───────────────────────────────────

/**
 * Email envoyé à l'acheteur lorsque sa commande est expédiée.
 * @param order - Détails de la commande
 */
export function orderShippedEmail(order: OrderInfo): string {
  const formattedTotal = new Intl.NumberFormat('fr-FR').format(order.total)

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F7A60;">Votre commande est en route ! 🚚</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${order.buyerName}</strong>,<br/>
      bonne nouvelle ! Votre commande a été expédiée et est en chemin vers vous.
    </p>

    <!-- Détails produit -->
    <div style="background-color:#F0FAF7;border-left:4px solid #0F7A60;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:14px;color:#0F7A60;font-weight:700;">📦 Détails de votre commande</p>
      <p style="margin:0;font-size:14px;color:#444444;line-height:1.8;">
        <strong>Produit :</strong> ${order.productName}<br/>
        <strong>Commande n° :</strong> #${order.id.slice(0, 8).toUpperCase()}<br/>
        <strong>Montant :</strong> ${formattedTotal} FCFA
      </p>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#666666;line-height:1.6;">
      📞 Le livreur vous contactera avant la livraison.
      En cas d'absence, n'hésitez pas à nous contacter via WhatsApp pour reprogrammer.
    </p>

    <div style="background-color:#FFFBF0;border-radius:8px;padding:16px 20px;margin:0 0 24px;border:1px solid #F0E8D0;">
      <p style="margin:0;font-size:13px;color:#C9A84C;font-weight:700;">💡 Conseil Yayyam</p>
      <p style="margin:6px 0 0;font-size:13px;color:#666666;line-height:1.6;">
        Inspectez votre colis avant de confirmer la livraison. En cas de problème, signalez-le immédiatement.
      </p>
    </div>

    ${divider()}

    <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
      Un problème avec la livraison ? Nous sommes là pour vous aider.
    </p>
  `

  return emailWrapper(body, `Votre commande "${order.productName}" est en route !`)
}

// ─── 5. Email nouvelle commande — Vendeur ────────────────────────────────────

/**
 * Email envoyé au vendeur lorsqu'il reçoit une nouvelle commande.
 * @param order      - Détails de la commande reçue
 * @param vendorName - Prénom/nom du vendeur
 */
export function newOrderVendorEmail(order: OrderInfo, vendorName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'
  const formattedTotal = new Intl.NumberFormat('fr-FR').format(order.total)

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F7A60;">Nouvelle commande reçue ! 🛍️</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${vendorName}</strong>,<br/>
      vous venez de recevoir une nouvelle commande. Traitez-la rapidement pour une meilleure expérience client !
    </p>

    <!-- Récapitulatif commande -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
      style="background-color:#F5F5F2;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Détails commande</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;">
            <tr>
              <td style="font-size:14px;color:#666666;padding:6px 0;border-bottom:1px solid #E8E8E4;">Commande n°</td>
              <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #E8E8E4;">#${order.id.slice(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#666666;padding:6px 0;border-bottom:1px solid #E8E8E4;">Produit</td>
              <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #E8E8E4;">${order.productName}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#666666;padding:6px 0;border-bottom:1px solid #E8E8E4;">Acheteur</td>
              <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #E8E8E4;">${order.buyerName}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#666666;padding:6px 0;border-bottom:1px solid #E8E8E4;">Paiement</td>
              <td style="font-size:14px;color:#1A1A1A;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #E8E8E4;">${order.paymentMethod}</td>
            </tr>
            <tr>
              <td style="font-size:16px;color:#1A1A1A;font-weight:900;padding:10px 0 0;">Montant reçu</td>
              <td style="font-size:16px;color:#0F7A60;font-weight:900;text-align:right;padding:10px 0 0;">${formattedTotal} FCFA</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:14px;color:#666666;line-height:1.6;">
      🚀 Les fonds sont disponibles dans votre portefeuille dès confirmation de livraison.
    </p>

    ${ctaButton('Voir la commande', `${appUrl}/dashboard/orders`)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
      Gérez toutes vos commandes depuis votre tableau de bord Yayyam.
    </p>
  `

  return emailWrapper(body, `Nouvelle commande #${order.id.slice(0, 8).toUpperCase()} — ${formattedTotal} FCFA`)
}

// ─── 6. Email relance panier abandonné ───────────────────────────────────────

/**
 * Email de relance envoyé lorsqu'un acheteur n'a pas finalisé son paiement.
 * @param buyerName   - Prénom de l'acheteur
 * @param productName - Nom du produit abandonné
 * @param productUrl  - URL de la page du produit
 */
export function abandonedCartEmail(
  buyerName: string,
  productName: string,
  productUrl: string
): string {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1A1A1A;">Vous avez oublié quelque chose... 🛒</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${buyerName}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Vous avez commencé à acheter <strong style="color:#0F7A60;">« ${productName} »</strong> mais n'avez pas finalisé votre commande.
      Il est encore disponible — ne laissez pas passer cette opportunité !
    </p>

    <!-- Produit abandonné -->
    <div style="background-color:#F5F5F2;border-radius:8px;padding:20px 24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:18px;">🛍️</p>
      <p style="margin:0;font-size:18px;font-weight:900;color:#1A1A1A;">${productName}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#888888;">Votre commande n'est pas encore confirmée</p>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:#666666;line-height:1.6;">
      ⏰ Les stocks sont limités — finalisez votre achat maintenant.
    </p>

    ${ctaButton('Finaliser mon achat', productUrl)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
      Si vous avez rencontré un problème lors du paiement, n'hésitez pas à nous contacter via WhatsApp.
      Nous acceptons Wave, Orange Money et les cartes bancaires.
    </p>
  `

  return emailWrapper(body, `Votre article "${productName}" vous attend encore !`)
}

// ─── 7. Email rapport hebdomadaire — Vendeur ─────────────────────────────────

/**
 * Email de rapport hebdomadaire envoyé au vendeur chaque semaine.
 * @param vendorName - Prénom/nom du vendeur
 * @param stats      - Statistiques de la semaine écoulée
 */
export function weeklyReportEmail(vendorName: string, stats: VendorStats): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'
  const formattedRevenue = new Intl.NumberFormat('fr-FR').format(stats.totalRevenue)

  // Calcul du taux de croissance — fictif pour affichage (sera calculé côté serveur)
  const revenueColor = stats.totalRevenue > 0 ? '#0F7A60' : '#888888'

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F7A60;">Votre bilan de la semaine 📊</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${vendorName}</strong>,<br/>
      voici un résumé de vos performances de la semaine écoulée.
    </p>

    <!-- KPIs -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
      <tr>
        <!-- CA de la semaine -->
        <td width="33%" style="padding:4px;">
          <div style="background-color:#F0FAF7;border-radius:8px;padding:16px 12px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:900;color:${revenueColor};">${formattedRevenue}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#888888;text-transform:uppercase;letter-spacing:0.5px;">FCFA générés</p>
          </div>
        </td>
        <!-- Commandes -->
        <td width="33%" style="padding:4px;">
          <div style="background-color:#F5F5F2;border-radius:8px;padding:16px 12px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#1A1A1A;">${stats.totalOrders}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#888888;text-transform:uppercase;letter-spacing:0.5px;">Commandes</p>
          </div>
        </td>
        <!-- Nouveaux clients -->
        <td width="33%" style="padding:4px;">
          <div style="background-color:#FDF9F0;border-radius:8px;padding:16px 12px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#C9A84C;">${stats.newCustomers}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#888888;text-transform:uppercase;letter-spacing:0.5px;">Nouveaux clients</p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Meilleur produit -->
    <div style="background-color:#F0FAF7;border-left:4px solid #0F7A60;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:13px;color:#0F7A60;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">🏆 Meilleur produit de la semaine</p>
      <p style="margin:8px 0 0;font-size:16px;font-weight:900;color:#1A1A1A;">« ${stats.bestProduct} »</p>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#666666;line-height:1.6;">
      Continuez sur cette lancée ! Pensez à partager votre boutique sur vos réseaux sociaux
      pour amplifier vos résultats la semaine prochaine. 🚀
    </p>

    ${ctaButton('Voir mon tableau de bord complet', `${appUrl}/dashboard/analytics`)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
      Ce rapport est envoyé chaque semaine automatiquement par Yayyam.
    </p>
  `

  return emailWrapper(body, `Votre bilan semaine : ${formattedRevenue} FCFA — ${stats.totalOrders} commandes`)
}

// ─── 8. Emails Automations ──────────────────────────────────────────────

export function vendorEmptyStoreEmail(vendorName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F7A60;">C'est dommage de s'arrêter là... 🚀</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${vendorName}</strong>,<br/>
      votre boutique est créée mais elle est encore vide. Ajoutez votre premier produit en moins de 2 minutes pour commencer à générer des ventes !
    </p>
    ${ctaButton('Ajouter un produit', `${appUrl}/dashboard/products/new`)}
  `
  return emailWrapper(body, "Votre boutique Yayyam attend son premier produit !")
}

export function vendorMasterclassReminderEmail(vendorName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yayyam.com'
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#0F7A60;">Arrêtez de perdre des ventes 🛑</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.6;">
      Bonjour <strong>${vendorName}</strong>,<br/>
      Nous avons créé une formation vidéo (masterclass) totalement gratuite pour vous aider à débloquer vos premières ventes avec des méthodes prouvées en Afrique.
    </p>
    ${ctaButton('Voir la formation', `${appUrl}/dashboard/academy`)}
  `
  return emailWrapper(body, "Découvrez les méthodes pour vendre plus sur Yayyam.")
}
