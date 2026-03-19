=== CONTEXTE PDV Pro ===
Projet : PDV Pro — SaaS e-commerce Afrique de l'Ouest
Stack : Next.js 14 App Router · TypeScript strict · Supabase · Prisma · Tailwind
Lancement : 24/03/2026 (J-5)
Build actuel : 114 pages propres, 0 erreurs TS
Politique : Commission 7%→4% dégressive · Zéro abonnement · Cashless prioritaire
Règle COD : uniquement vendeurs PHYSICAL/HYBRID sur produits physiques · jamais suggéré · jamais mis en avant · désactivé par défaut même si passage Hybride/Physique

📋 RAPPELS LECTURE OBLIGATOIRE :
- Lire le code complet de CHAQUE fichier concerné avant de le modifier
- Ne jamais supposer la structure — toujours lire d'abord
- Montrer le diff complet et attendre "OK" avant de passer au suivant
- Si la tâche est déjà faite → signaler et ne pas refaire
- Si déviation de la vision → refuser et expliquer

=== TÂCHE 1/3 : VENDOR TYPE — Schema Prisma + Migration Supabase ===

OBJECTIF : Ajouter le champ vendor_type à la table Store.

ÉTAPE 1 — Modifier prisma/schema.prisma

1.1. Ajouter un nouvel enum VendorType APRÈS l'enum Role existant :

enum VendorType {
  digital
  physical
  hybrid
}

1.2. Dans le model Store, ajouter le champ APRÈS le champ slug :

vendor_type VendorType @default(digital)

IMPORTANT : Le default est digital (cashless first = politique PDV Pro).

1.3. L'enum ProductType existe déjà (digital | physical | coaching). 
Ne pas la toucher. Le champ type dans Product est déjà là et suffisant.
Le checkout utilisera product.type combiné avec store.vendor_type pour décider si le COD est proposé.

ÉTAPE 2 — Générer et appliquer la migration Prisma

Commande :
npx prisma migrate dev --name add_vendor_type

Si la migration échoue (car Supabase distant), utiliser plutôt :
npx prisma db push

Puis vérifier que le client est régénéré :
npx prisma generate

ÉTAPE 3 — Vérifier le type TypeScript

Après prisma generate, le type VendorType doit être importable depuis @prisma/client. Vérifie que ça compile :
npx tsc --noEmit

S'il y a des erreurs liées au nouveau champ dans des fichiers qui font select('*') ou des types manuels, les corriger.

ÉTAPE 4 — SQL direct Supabase (si Prisma push ne fonctionne pas)

En dernier recours, exécuter ce SQL dans Supabase SQL Editor :

DO $$ BEGIN
  CREATE TYPE "VendorType" AS ENUM ('digital', 'physical', 'hybrid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Store" 
ADD COLUMN IF NOT EXISTS "vendor_type" "VendorType" NOT NULL DEFAULT 'digital';

=== RÉSULTAT ATTENDU ===
- prisma/schema.prisma : enum VendorType + champ vendor_type dans Store
- Migration appliquée (ou SQL exécuté)
- npx tsc --noEmit passe sans erreur
- Build : rm -rf .next && npm run build passe

=== NE PAS FAIRE ===
- Ne touche PAS à l'onboarding (prompt suivant)
- Ne touche PAS à la Sidebar (prompt suivant)
- Ne touche PAS aux Settings (prompt suivant)
- Ne touche PAS au checkout (prompt suivant)
- Ne crée PAS de nouvelles pages

Montre le diff de prisma/schema.prisma et le résultat de la migration. Attends "OK".
