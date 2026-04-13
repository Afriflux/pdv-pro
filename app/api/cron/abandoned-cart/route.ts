import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/cron-helpers'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'
import { executeWorkflows } from '@/lib/workflows/execution'

export async function GET(req: NextRequest) {
  // Optionnel : Vérifier un CRON_SECRET pour la sécurité
  if (!verifyCronSecret(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // On récupère les leads "panier abandonné" créés il y a plus de 30 minutes, non contactés.
    // Pour des raisons de MVP/Vitesse, je cible tous les `new` qui ont au moins 30 minutes.
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    const abandonedLeads = await prisma.lead.findMany({ take: 50, 
      where: {
        source: 'abandoned_cart',
        status: 'new',
        created_at: { lte: thirtyMinutesAgo }
      },
    })

    const productIds = Array.from(new Set(abandonedLeads.map(l => l.product_id).filter(Boolean) as string[]))
    const products = await prisma.product.findMany({ take: 50, 
      where: { id: { in: productIds } },
      select: { id: true, name: true, store: { select: { id: true, name: true } } }
    })

    if (abandonedLeads.length === 0) {
      return NextResponse.json({ message: 'No abandoned carts to process.' })
    }

    let processed = 0
    let failed = 0

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yayyam.com'
    
    // Process en boucle
    for (const lead of abandonedLeads) {
      if (!lead.phone) continue

      const checkoutUrl = `${baseUrl}/checkout/${lead.product_id}?ref=${encodeURIComponent(lead.phone)}`
      const product = products.find(p => p.id === lead.product_id)
      const storeName = product?.store?.name || 'Notre Boutique'
      const productName = product?.name || 'l\'article'

      const msg = `🛒 *Votre panier vous attend !*\n\nBonjour${lead.name ? ' ' + lead.name : ''},\n\nVous avez récemment montré de l\'intérêt pour *${productName}* sur *${storeName}*, mais vous n\'avez pas finalisé votre achat.\n\nAvez-vous rencontré un problème technique ? Si vous êtes toujours intéressé(e), vous pouvez reprendre votre commande exactement là où vous l\'avez laissée ici :\n\n👉 ${checkoutUrl}\n\nSi vous avez la moindre question, répondez simplement à ce message ! 🙏\n\nL'équipe ${storeName}`

      const sent = await sendWhatsApp({ to: lead.phone, body: msg })

      if (sent) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: 'contacted' }
        })
        processed++

        // Trigger "Panier Abandonné" workflow for customizable vendor reactions
        if (lead.product_id) {
          const product = products.find(p => p.id === lead.product_id)
          if (product?.store?.id) {
            executeWorkflows(product.store.id, 'Panier Abandonné', {
              client_name: lead.name || 'Client',
              client_phone: lead.phone || '',
              product_name: product.name || 'Produit',
              store_name: product.store.name || 'Boutique',
            }).catch(e => console.error('[Workflow Panier Abandonné]', e))
          }
        }
      } else {
        // En cas d'échec WhatsApp, on peut le marquer failed ou réessayer plus tard. On ignore pour l'instant.
        failed++
      }
    }

    return NextResponse.json({
      message: 'Processing complete',
      processed,
      failed
    })
  } catch (error) {
    console.error('[CRON Abandoned Cart Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
