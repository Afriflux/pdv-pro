=== CONTEXTE Yayyam ===
Projet : Yayyam — SaaS e-commerce Afrique de l'Ouest
Stack : Next.js 14 App Router · TypeScript strict · Supabase · Prisma · Tailwind
Build actuel : Production stable, 0 erreurs TS

📋 RAPPELS LECTURE OBLIGATOIRE :
- Lire le code complet de CHAQUE fichier concerné avant de le modifier
- Lire SKILLS.md sections "BuyerScore" et "Anti-fraude" — il y a DÉJÀ une table BuyerScore
- Ne jamais supposer la structure — toujours lire d'abord
- Montrer le diff complet et attendre "OK" avant de passer au suivant

=== TÂCHE : SYSTÈME ANTI-FRAUDE COD ===

OBJECTIF : Exploiter la table BuyerScore (DÉJÀ existante dans le schéma) pour
créer un vrai système de scoring acheteur visible dans le dashboard vendeur.

⚠️ La table BuyerScore EXISTE DÉJÀ (voir SKILLS.md ligne 412-423).
⚠️ Des règles de fraude existent DÉJÀ (voir SKILLS.md ligne 896-903).
⚠️ NE PAS recréer ces tables — les UTILISER.

=== CE QUI MANQUE ===

1. Interface vendeur pour voir le score d'un acheteur
2. Blacklist partagée entre vendeurs (acheteurs qui refusent 3+ livraisons)
3. Logique automatique dans le checkout qui bloque les COD pour les acheteurs risqués
4. Dashboard admin pour voir les acheteurs flaggés

=== ÉTAPE 1/4 — Schema (ajouts minimaux) ===

Ajouter dans prisma/schema.prisma :

model BuyerBlacklist {
  id           String   @id @default(uuid())
  phone        String   @unique
  reason       String   // "3+ cancelled COD" | "fraud_detected" | "manual"
  flagged_by   String?  // store_id qui a signalé
  total_refused Int     @default(0)
  created_at   DateTime @default(now())
}

⚠️ NE PAS modifier la table BuyerScore existante. Juste ajouter BuyerBlacklist.

=== ÉTAPE 2/4 — Logique Checkout ===

Lire app/checkout/ et le flow COD existant.
Ajouter une vérification AVANT d'autoriser le COD :

1. Vérifier si le numéro est dans BuyerBlacklist → bloquer COD, forcer prépaiement
2. Vérifier BuyerScore : score < 30 → bloquer COD
3. Vérifier BuyerScore : score 30-50 → warning "Acheteur à risque"
4. Score > 50 → COD normal

Afficher un message clair au checkout si COD bloqué :
"Le paiement à la livraison n'est pas disponible pour ce numéro. 
Veuillez payer en ligne via Wave ou Mobile Money."

=== ÉTAPE 3/4 — Dashboard Vendeur (section Commandes) ===

Dans la vue commande existante, ajouter un badge de score acheteur :

🟢 Score 80+ : "Client fiable"
🟡 Score 50-79 : "Client normal"  
🟠 Score 30-49 : "Client à surveiller"
🔴 Score < 30 : "Client risqué"

Bouton : [🚫 Signaler ce numéro] → ajoute à BuyerBlacklist

=== ÉTAPE 4/4 — Cron Job (enrichissement automatique) ===

Lire app/api/cron/ pour comprendre le format des cron jobs existants.
Créer app/api/cron/buyer-scores/route.ts :
- Fréquence : toutes les 6h (ajouter dans vercel.json)
- Calcul : pour chaque phone dans BuyerScore, recalculer le score basé sur :
  * completed_orders × 10 points
  * cancelled_orders × -20 points
  * disputed_orders × -30 points
  * Score min = 0, max = 100
- Si score < 20 ET cancelled_orders >= 3 → auto-ajouter à BuyerBlacklist

⚠️ NE PAS modifier les crons existants. Ajouter le nouveau dans vercel.json.

=== RÉSULTAT ATTENDU ===
- BuyerBlacklist ajouté au Prisma schema
- Vérification anti-fraude dans le checkout COD
- Badge score dans la vue commande
- Cron buyer-scores ajouté
- npx tsc --noEmit passe
- Build passe

=== NE PAS FAIRE ===
- Ne recrée PAS la table BuyerScore (elle existe déjà)
- Ne modifie PAS les règles de fraude existantes dans SKILLS.md
- Ne touche PAS au flow de paiement en ligne (seulement COD)

Montre le diff de prisma/schema.prisma d'abord. Attends "OK".
