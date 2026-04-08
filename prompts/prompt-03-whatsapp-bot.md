=== CONTEXTE Yayyam ===
Projet : Yayyam — SaaS e-commerce Afrique de l'Ouest
Stack : Next.js 14 App Router · TypeScript strict · Supabase · Prisma · Tailwind
Build actuel : Production stable, 0 erreurs TS
WhatsApp : Twilio WhatsApp API DÉJÀ configuré (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER)

📋 RAPPELS LECTURE OBLIGATOIRE :
- Lire le code complet de CHAQUE fichier concerné avant de le modifier
- Ne jamais supposer la structure — toujours lire d'abord
- Lire lib/whatsapp/ pour comprendre la logique WhatsApp existante
- Lire app/api/webhooks/ pour comprendre les webhooks existants
- Montrer le diff complet et attendre "OK" avant de passer au suivant
- Si la tâche est déjà faite → signaler et ne pas refaire

=== TÂCHE : WHATSAPP COMMERCE BOT ===

OBJECTIF : Transformer le numéro WhatsApp Twilio en un véritable auto-vendeur.
Le client envoie un message WhatsApp → le bot répond avec le catalogue, prend la commande,
génère le lien de paiement, et envoie la confirmation.

JUSTIFICATION :
- 90%+ du commerce en Afrique passe par WhatsApp
- Les vendeurs passent 3-4h/jour à répondre manuellement
- Twilio WhatsApp est DÉJÀ configuré — on l'utilise en mode "bot conversationnel"

=== ARCHITECTURE ===

Le bot fonctionne par KEYWORDS détectés dans le message entrant :

┌────────────────────────────────────────────────────┐
│  MESSAGE ENTRANT (webhook Twilio)                  │
│  ↓                                                 │
│  ROUTER :                                          │
│  "catalogue" / "produits" → Liste des produits     │
│  "commander [nom]"        → Créer commande         │
│  "prix [nom]"             → Fiche produit          │
│  "suivi" / "commande"     → Statut commande        │
│  "aide" / "help"          → Menu d'aide            │
│  Autre                    → Réponse IA ou fallback │
└────────────────────────────────────────────────────┘

=== ÉTAPE 1/6 — Schema Prisma ===

Ajouter dans prisma/schema.prisma :

model WhatsappBot {
  id                String   @id @default(uuid())
  store_id          String   @unique
  store             Store    @relation(fields: [store_id], references: [id])
  active            Boolean  @default(false)
  welcome_message   String   @default("Bienvenue ! Tapez *catalogue* pour voir nos produits ou *aide* pour les commandes disponibles.")
  auto_reply        Boolean  @default(true)
  ai_enabled        Boolean  @default(false) // Réponse IA pour les questions complexes
  phone_number      String?  // Numéro WhatsApp Business du vendeur
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
}

model WhatsappConversation {
  id           String   @id @default(uuid())
  store_id     String
  phone        String   // Numéro du client
  client_name  String?
  last_message String?
  context      Json?    // État de la conversation (étape, panier, etc.)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  @@unique([store_id, phone])
}

Ajouter dans model Store :
  whatsapp_bot       WhatsappBot?

=== ÉTAPE 2/6 — Webhook Entrant (app/api/webhooks/whatsapp-bot/route.ts) ===

Nouvelle route API (PAS une Server Action car Twilio envoie un POST webhook) :
- Recevoir le message entrant de Twilio (format form-urlencoded)
- Identifier le store à partir du numéro destinataire (To)
- Router vers la bonne fonction selon le keyword
- Répondre via TwiML ou via l'API Twilio messages

IMPORTANT : Vérifier la signature Twilio pour la sécurité (X-Twilio-Signature)

=== ÉTAPE 3/6 — Bot Engine (lib/whatsapp/bot.ts) ===

Créer lib/whatsapp/bot.ts :

Functions :
1. handleCatalogue(storeId, phone) → Envoie les 5 premiers produits avec prix
2. handleProductInfo(storeId, phone, productName) → Fiche produit détaillée + image
3. handleOrder(storeId, phone, productName) → Crée commande + génère lien de paiement
4. handleTracking(storeId, phone) → Dernière commande du numéro + statut
5. handleHelp(phone) → Liste des commandes disponibles
6. handleAI(storeId, phone, message) → Si ai_enabled, utiliser Claude pour répondre

Format des messages WhatsApp :
```
🛍️ *NOM DU PRODUIT*
💰 15.000 FCFA
📦 En stock

Pour commander, tapez :
👉 *commander [nom du produit]*

💳 Payer ici → https://yayyam.com/pay/[product_id]?ref=[phone]
```

=== ÉTAPE 4/6 — Paramètres Vendeur (app/dashboard/settings/) ===

Ajouter un nouvel onglet ou une section dans les Settings existants :

┌─────────────────────────────────────────────────────┐
│  🤖 WhatsApp Auto-Vendeur                          │
├─────────────────────────────────────────────────────┤
│  Status : [🟢 Activé / 🔴 Désactivé]               │
│                                                     │
│  Message d'accueil :                                │
│  ┌─────────────────────────────────────────────┐    │
│  │ Bienvenue chez [Boutique] ! 🙏               │    │
│  │ Tapez *catalogue* pour voir nos produits.   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Options :                                          │
│  [✅] Réponse automatique                           │
│  [  ] IA pour les questions complexes (claude)      │
│                                                     │
│  Numéro WhatsApp Business :                         │
│  +221 77 XXX XX XX                                  │
│                                                     │
│  Commandes disponibles :                            │
│  • "catalogue" → Liste des produits                 │
│  • "commander [nom]" → Prise de commande            │
│  • "prix [nom]" → Détail produit                    │
│  • "suivi" → Statut dernière commande               │
│  • "aide" → Menu d'aide                             │
└─────────────────────────────────────────────────────┘

NE PAS créer un nouveau fichier de settings.
Lire app/dashboard/settings/ pour comprendre la structure à onglets existante,
puis ajouter une section ou un onglet "WhatsApp Bot".

=== ÉTAPE 5/6 — App Store Integration ===

Lire app/dashboard/apps/ et le système d'InstalledApp existant.
Le WhatsApp Bot doit être une APP installable depuis l'App Store :
- app_id: 'whatsapp-bot'
- Nom: "WhatsApp Auto-Vendeur"
- Description: "Votre vendeur automatique 24/7 par WhatsApp"
- Prix : 5.000 FCFA/mois (ou gratuit en version de base)
- Quand installée → créer l'entrée WhatsappBot dans la DB
- Quand désinstallée → désactiver le bot (active = false)

=== ÉTAPE 6/6 — Sidebar Integration ===

NE PAS modifier la sidebar.
Lire components/dashboard/Sidebar.tsx pour comprendre le système
d'affichage conditionnel basé sur installedApps.
Le lien vers les settings du bot apparaîtra automatiquement si l'app est installée.

=== RÉSULTAT ATTENDU ===
- Prisma schema mis à jour (WhatsappBot, WhatsappConversation)
- Webhook route: app/api/webhooks/whatsapp-bot/route.ts
- Bot engine: lib/whatsapp/bot.ts
- Section settings intégrée dans les settings existants
- App Store entry pour le WhatsApp Bot
- npx tsc --noEmit passe sans erreur
- Build : rm -rf .next && npm run build passe

=== NE PAS FAIRE ===
- Ne touche PAS à lib/whatsapp/sendWhatsApp.ts (fonction d'envoi existante)
- Ne modifie PAS les webhooks CinetPay/Bictorys existants
- Ne crée PAS une page dashboard séparée — utilise les settings
- Ne réinstalle PAS Twilio
- N'utilise PAS de SDK WhatsApp tiers — utilise Twilio uniquement

Montre le diff de prisma/schema.prisma d'abord. Attends "OK".
