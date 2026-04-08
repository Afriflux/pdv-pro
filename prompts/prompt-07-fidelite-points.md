=== CONTEXTE Yayyam ===
Projet : Yayyam — SaaS e-commerce Afrique de l'Ouest
Stack : Next.js 14 App Router · TypeScript strict · Supabase · Prisma · Tailwind
Build actuel : Production stable, 0 erreurs TS

📋 RAPPELS LECTURE OBLIGATOIRE :
- Lire le code complet de CHAQUE fichier concerné avant de le modifier
- Lire app/client/ — le portail acheteur existant
- Lire le checkout existant
- Montrer le diff complet et attendre "OK" avant de passer au suivant

=== TÂCHE : PROGRAMME DE FIDÉLITÉ (POINTS & CASHBACK) ===

OBJECTIF : Système de points de fidélité qui récompense les acheteurs récurrents
et incite les vendeurs à fidéliser leur clientèle.

JUSTIFICATION :
- Les acheteurs achètent chez 10 vendeurs différents sans jamais revenir
- Un système de points transforme les acheteurs occasionnels en clients récurrents
- Le vendeur finance les points (% de commission) — Yayyam prend une marge sur la conversion

=== CONCEPT ===

1 achat = X points (1 point par 100 FCFA dépensé)
Points convertibles en :
  - Réduction sur la prochaine commande (100 points = 100 FCFA)
  - Cashback wallet client (si wallet client existe)

Niveaux :
  🥉 Bronze : 0-499 points (0% bonus)
  🥈 Argent : 500-1999 points (10% bonus points)
  🥇 Or : 2000-4999 points (25% bonus points)
  💎 Diamant : 5000+ points (50% bonus points)

Le niveau se base sur les points GAGNÉS au total (pas le solde restant).

=== ÉTAPE 1/4 — Schema Prisma ===

model LoyaltyAccount {
  id              String   @id @default(uuid())
  phone           String   // Le numéro de l'acheteur (identifiant universel)
  total_earned    Int      @default(0) // Total points gagnés (pour le niveau)
  balance         Int      @default(0) // Points disponibles à dépenser
  tier            String   @default("bronze") // bronze | silver | gold | diamond
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  transactions    LoyaltyTransaction[]

  @@unique([phone])
}

model LoyaltyTransaction {
  id              String   @id @default(uuid())
  account_id      String
  account         LoyaltyAccount @relation(fields: [account_id], references: [id])
  type            String   // earn | redeem | bonus | expire
  points          Int      // Positif pour earn/bonus, négatif pour redeem
  description     String
  order_id        String?  // Lié à quelle commande
  store_id        String?  // Chez quel vendeur
  created_at      DateTime @default(now())
}

model LoyaltyConfig {
  id              String   @id @default(uuid())
  store_id        String   @unique
  store           Store    @relation(fields: [store_id], references: [id])
  enabled         Boolean  @default(false)
  points_per_100  Int      @default(1)   // 1 point par 100 FCFA
  max_redeem_pct  Int      @default(20)  // Max 20% de la commande payable en points
  created_at      DateTime @default(now())
}

=== ÉTAPE 2/4 — Logique Checkout ===

Lire le checkout existant.
Ajouter APRÈS le calcul du prix total, AVANT le paiement :

┌─────────────────────────────────────────────────────┐
│  🎯 Vos points fidélité                             │
│                                                     │
│  Solde : 450 points (💎 Diamant)                    │
│                                                     │
│  [Utiliser] [____] points (max 300 sur cette cmd)   │
│  = -300 FCFA de réduction                           │
│                                                     │
│  Total après réduction : 14.700 FCFA                │
│  + Vous gagnerez 147 points avec cet achat !        │
└─────────────────────────────────────────────────────┘

=== ÉTAPE 3/4 — Portail Client (app/client/) ===

Ajouter une section dans le portail client existant :

┌─────────────────────────────────────────────────────┐
│  🎯 Mon Programme Fidélité                          │
│                                                     │
│  💎 Niveau Diamant · 5.230 points gagnés            │
│  ━━━━━━━━━━━━━━━━━━━━ 50% bonus actif              │
│                                                     │
│  Solde : 1.280 points disponibles                   │
│                                                     │
│  📜 Historique récent                               │
│  +150 pts  Achat chez Rose Beauty       12/04       │
│  -300 pts  Utilisé chez Mode Dakar      10/04       │
│  +75 pts   Bonus niveau Diamant         10/04       │
└─────────────────────────────────────────────────────┘

=== ÉTAPE 4/4 — Settings Vendeur ===

Dans les settings vendeur, ajouter une section :
- Toggle : "Activer la fidélité pour ma boutique"
- Réglage : points par 100 FCFA (défaut: 1)
- Réglage : % max de la commande payable en points (défaut: 20%)

=== RÉSULTAT ATTENDU ===
- Schema : LoyaltyAccount, LoyaltyTransaction, LoyaltyConfig
- Logique fidélité dans le checkout
- Section dans le portail client
- Settings vendeur
- Build passe

=== NE PAS FAIRE ===
- Ne modifie PAS le flow de paiement (CinetPay, Wave, etc.)
- Ne crée PAS un wallet séparé — les points sont un système distinct
- Ne touche PAS au wallet client existant
- Les points sont par NUMÉRO DE TÉLÉPHONE (pas par user_id) car les acheteurs n'ont pas toujours un compte

Montre le diff de prisma/schema.prisma d'abord. Attends "OK".
