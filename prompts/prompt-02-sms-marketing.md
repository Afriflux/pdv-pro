=== CONTEXTE Yayyam ===
Projet : Yayyam — SaaS e-commerce Afrique de l'Ouest
Stack : Next.js 14 App Router · TypeScript strict · Supabase · Prisma · Tailwind
Build actuel : Production stable, 0 erreurs TS
Politique : Commission 7%→4% dégressive · Zéro abonnement · Cashless prioritaire
framer-motion : Version 11.15.0 (NE PAS upgrader à v12 — incompatible Next 14.2)

📋 RAPPELS LECTURE OBLIGATOIRE :
- Lire le code complet de CHAQUE fichier concerné avant de le modifier
- Ne jamais supposer la structure — toujours lire d'abord
- Montrer le diff complet et attendre "OK" avant de passer au suivant
- Si la tâche est déjà faite → signaler et ne pas refaire
- Si déviation de la vision → refuser et expliquer
- Twilio est DÉJÀ installé dans package.json (ne pas réinstaller)

=== TÂCHE : SMS MARKETING — Module complet ===

OBJECTIF : Permettre aux vendeurs d'envoyer des campagnes SMS et des SMS automatiques
(panier abandonné, confirmation commande, suivi livraison) depuis leur dashboard.

JUSTIFICATION :
- Twilio est DÉJÀ dans package.json mais AUCUNE interface SMS n'existe
- 98% taux d'ouverture SMS vs 20% email en Afrique de l'Ouest
- Complémentaire au WhatsApp (pas tout le monde a WhatsApp)

=== ÉTAPE 1/5 — Schema Prisma + Migration ===

1.1. Ajouter dans prisma/schema.prisma :

model SmsCredit {
  id          String   @id @default(uuid())
  store_id    String
  store       Store    @relation(fields: [store_id], references: [id])
  credits     Int      @default(0)
  used        Int      @default(0)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@unique([store_id])
}

model SmsCampaign {
  id            String   @id @default(uuid())
  store_id      String
  store         Store    @relation(fields: [store_id], references: [id])
  name          String
  message       String   // max 160 chars
  recipients    Json     // [{phone: "+221...", name: "..."}]
  total_sent    Int      @default(0)
  total_failed  Int      @default(0)
  status        String   @default("draft") // draft | sending | completed | failed
  scheduled_at  DateTime?
  sent_at       DateTime?
  created_at    DateTime @default(now())
}

model SmsLog {
  id           String   @id @default(uuid())
  store_id     String
  phone        String
  message      String
  type         String   // campaign | auto_abandoned | auto_confirm | auto_tracking
  status       String   @default("sent") // sent | delivered | failed
  twilio_sid   String?
  campaign_id  String?
  created_at   DateTime @default(now())
}

1.2. Ajouter les relations dans le model Store existant :
  sms_credits   SmsCredit?
  sms_campaigns SmsCampaign[]

1.3. Exécuter :
  npx prisma db push && npx prisma generate

=== ÉTAPE 2/5 — Lib SMS (lib/sms/send.ts) ===

Créer lib/sms/send.ts :
- Utiliser les variables TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
  (mais pour le SMS, utiliser le format standard, PAS le whatsapp: prefix)
- Fonction sendSMS(to: string, body: string, storeId: string): Promise<{success, sid}>
- Décrémenter SmsCredit à chaque envoi réussi
- Logger chaque envoi dans SmsLog
- Gérer le format numéro : +221... (Sénégal), +225... (Côte d'Ivoire), etc.

=== ÉTAPE 3/5 — Server Actions (app/actions/sms.ts) ===

'use server'

Actions à créer :
1. purchaseSmsCredits(storeId, quantity) — Redirige vers paiement CinetPay
2. sendSmsCampaign(campaignId) — Envoie en batch à tous les destinataires
3. createSmsCampaign(storeId, {name, message, recipients}) — Crée un brouillon
4. getSmsDashboard(storeId) — Stats : crédits restants, campagnes, logs

=== ÉTAPE 4/5 — Page Dashboard (app/dashboard/marketing/sms/) ===

Créer app/dashboard/marketing/sms/page.tsx :

┌─────────────────────────────────────────────────────┐
│  📱 SMS Marketing                     [Acheter SMS] │
├─────────────────────────────────────────────────────┤
│  CRÉDITS : 342 SMS restants                         │
│  ━━━━━━━━━━━━━━━━━━━━ 68% utilisé                   │
├─────────────────────────────────────────────────────┤
│  CAMPAGNE RAPIDE                                    │
│  Destinataires : [Tous les clients] [Import CSV]    │
│  Message (160 car.) :                               │
│  ┌─────────────────────────────────────────────┐    │
│  │ Salut {prenom}! -20% sur tout le magasin    │    │
│  │ jusqu'à dimanche. Cliquez → {lien}          │    │
│  └─────────────────────────────────────────────┘    │
│  Variables : {prenom} {boutique} {lien}             │
│  [Envoyer maintenant]  [Programmer]                 │
├─────────────────────────────────────────────────────┤
│  HISTORIQUE                                         │
│  📊 Promo Tabaski   342 envoyés  98% livrés  12/04 │
│  📊 Relance stock   128 envoyés  96% livrés  08/04 │
└─────────────────────────────────────────────────────┘

Style : Utiliser les classes du design system existant (bg-emerald, text-ink, etc.)
Garder la cohérence avec les autres pages dashboard.

=== ÉTAPE 5/5 — SMS Automatiques (intégrer dans les Workflows existants) ===

Ajouter un nouveau type d'action dans le Workflow builder existant :
- action_type: 'sms' (en plus de 'whatsapp', 'email', 'webhook')
- Workflows pré-configurés à ajouter :
  1. "Confirmation commande par SMS" : order.created → SMS au client
  2. "Suivi livraison SMS" : order.shipped → SMS avec tracking
  3. "Panier abandonné SMS" : checkout > 30min → SMS relance

NE PAS recréer le workflow builder. Juste ajouter le type 'sms' aux actions possibles.

=== RÉSULTAT ATTENDU ===
- Prisma schema mis à jour avec SmsCredit, SmsCampaign, SmsLog
- lib/sms/send.ts fonctionnel avec Twilio
- app/actions/sms.ts avec toutes les server actions
- app/dashboard/marketing/sms/page.tsx avec interface complète
- Type 'sms' ajouté au workflow builder existant
- npx tsc --noEmit passe sans erreur
- Build : rm -rf .next && npm run build passe

=== NE PAS FAIRE ===
- Ne touche PAS aux pages existantes du marketing hub
- Ne modifie PAS le workflow builder UI — ajoute seulement le type 'sms'
- Ne réinstalle PAS Twilio (déjà dans package.json)
- Ne crée PAS de nouvelle sidebar — ajoute l'entrée SMS dans la section Marketing existante
- N'ajoute PAS de route API — utilise les Server Actions uniquement

Montre le diff de prisma/schema.prisma d'abord. Attends "OK".
