=== CONTEXTE Yayyam ===
Projet : Yayyam — SaaS e-commerce Afrique de l'Ouest
Stack : Next.js 14 App Router · TypeScript strict · Supabase · Prisma · Tailwind
Build actuel : Production stable, 0 erreurs TS

📋 RAPPELS LECTURE OBLIGATOIRE :
- Lire le code complet de CHAQUE fichier concerné avant de le modifier
- Lire app/dashboard/page.tsx (dashboard vendeur existant)
- Lire lib/ai/ pour comprendre l'intégration Claude existante
- Lire app/api/cron/ pour le format des cron jobs
- Montrer le diff complet et attendre "OK" avant de passer au suivant

=== TÂCHE : COACH IA PROACTIF (Daily Insights) ===

OBJECTIF : Transformer le Coach IA existant (GlobalCoach) d'un assistant réactif
en un coach PROACTIF qui POUSSE des insights et recommandations chaque jour.

⚠️ Le GlobalCoach EXISTE DÉJÀ (voir components/dashboard/GlobalCoach.tsx).
⚠️ NE PAS le remplacer. Ajouter un NOUVEAU système de "Daily Digest" en parallèle.

=== CONCEPT ===

Chaque matin à 8h (heure Dakar, UTC+0), un cron job analyse les données
de chaque boutique et génère un résumé IA personnalisé :

"📊 Bonjour Rose Beauty !
Hier :
• 12 visiteurs, 3 ventes (+50% vs veille)
• Panier moyen : 18.500 FCFA
• 2 paniers abandonnés (perte potentielle : 37.000 FCFA)

💡 Suggestions :
1. Activez la relance WhatsApp automatique pour récupérer les abandons
2. Votre 'Parfum Dubai XL' se vend 3x plus que la moyenne — augmentez le stock
3. Publiez une story WhatsApp entre 18h et 20h (pic de trafic hier)

🔥 Score boutique : 72/100 (+5 pts)"

=== ÉTAPE 1/4 — Schema Prisma ===

model DailyDigest {
  id            String   @id @default(uuid())
  store_id      String
  store         Store    @relation(fields: [store_id], references: [id])
  date          DateTime @db.Date
  summary       String   @db.Text  // Le résumé IA généré
  metrics       Json     // {visitors, orders, revenue, avg_cart, abandoned, top_product}
  suggestions   Json     // [{text, priority, action_url}]
  score         Int      @default(0) // Score boutique 0-100
  read          Boolean  @default(false)
  created_at    DateTime @default(now())

  @@unique([store_id, date])
}

Ajouter dans model Store :
  daily_digests  DailyDigest[]

=== ÉTAPE 2/4 — Cron Job (app/api/cron/daily-digest/route.ts) ===

GET route protégée par CRON_SECRET.
- Récupérer TOUTES les boutiques actives (avec au moins 1 produit)
- Pour chaque boutique, calculer les métriques de la veille :
  * Nombre de commandes
  * Revenue total
  * Panier moyen
  * Produit le plus vendu
  * Nombre de paniers abandonnés (commandes pending > 30min puis annulées)
  * Comparaison avec J-1 et J-7
- Générer un résumé via Claude (Anthropic API déjà configurée) :
  * System prompt : "Tu es un coach e-commerce expert du marché africain. Génère un résumé quotidien concis et actionnable en français."
  * Limiter à 200 tokens max
  * 3 suggestions max, chacune avec un lien d'action
- Sauvegarder dans DailyDigest
- Envoyer une notification In-App (table Notification existante)

Fréquence : ajouter dans vercel.json : "0 8 * * *" (8h UTC = 8h Dakar)

=== ÉTAPE 3/4 — Widget Dashboard ===

NE PAS modifier le dashboard existant. Ajouter UN widget en haut de la page :

┌─────────────────────────────────────────────────────┐
│  🤖 Votre Coach Quotidien · Aujourd'hui             │
│                                                     │
│  📊 Hier : 3 ventes · 55.500 FCFA · +50% vs veille │
│                                                     │
│  💡 Activez la relance WhatsApp pour récupérer     │
│     2 paniers abandonnés (37.000 FCFA potentiel)    │
│     → [Activer maintenant]                          │
│                                                     │
│  🔥 Score boutique : 72/100                        │
│  [Voir le rapport complet]                          │
└─────────────────────────────────────────────────────┘

Si aucun digest pour aujourd'hui → ne pas afficher le widget.
Le widget doit être un composant client séparé importé dans la page dashboard.

=== ÉTAPE 4/4 — Page Historique (optionnel) ===

Créer app/dashboard/analytics/insights/page.tsx :
- Liste des daily digests par date
- Graphique de l'évolution du score boutique
- Détail cliquable pour chaque jour

=== RÉSULTAT ATTENDU ===
- DailyDigest dans Prisma schema
- Cron : app/api/cron/daily-digest/route.ts
- Widget : components/dashboard/DailyDigestWidget.tsx
- Entrée dans vercel.json
- Build passe

=== NE PAS FAIRE ===
- Ne touche PAS à GlobalCoach.tsx
- Ne modifie PAS la page dashboard existante SAUF pour importer le widget
- Ne touche PAS aux analytics existantes
- N'utilise PAS de librairie IA supplémentaire — Anthropic est déjà configuré

Montre le diff de prisma/schema.prisma d'abord. Attends "OK".
