# PDV Pro — SKILLS.md v2
> **RÈGLE ANTI-GRAVITY N°1** : Lis ce fichier ENTIÈREMENT avant chaque session.
> **RÈGLE N°2** : Réponds TOUJOURS en français.
> **RÈGLE N°3** : Fournis TOUJOURS les scripts SQL Supabase directement dans la discussion.
> **RÈGLE N°4** : Guide TOUJOURS l'utilisateur étape par étape pour chaque manipulation manuelle.
> **RÈGLE N°5** : Confirme chaque étape avant de passer à la suivante.

---

## 🎯 Vision

**PDV Pro** — La plateforme de vente en ligne pour l'Afrique de l'Ouest.
**Philosophie** : **SIMPLICITÉ ABSOLUE**. Si ça prend plus de 3 clics, c'est trop compliqué.
**Domaine** : pdvpro.com
**Langues** : Français (principal) — Anglais (secondaire)

---

## 💰 Modèle Économique

- Gratuit pour les vendeurs — zéro abonnement
- **10% de commission PDV Pro** sur chaque vente (modifiable par Super Admin)
- **Règle absolue** : commission prélevée EN PREMIER, avant tout versement au vendeur
- MVP : **MODE PLATEFORME uniquement** — PDV Pro collecte, vendeur fait une demande de retrait

---

## 💳 Passerelles de Paiement (ces 3 uniquement)

| Passerelle | Usage |
|------------|-------|
| **CinetPay** | Principal — multi-pays |
| **PayTech** | Sénégal |
| **Wave Business** | Mobile Money Sénégal |

---

## 👥 Catégories d'Utilisateurs

### Admin & Personnel PDV Pro
- **Super Admin** : tout — commission, vendeurs, retraits, analytics, modération
- **Gestionnaire** : support, litiges, validation retraits

### Vendeurs & Partenaires
- **Vendeur** : boutique, produits, pages de vente, commandes, wallet, affiliation
- **Affilié** : liens trackés, commissions sur ventes générées

### Acheteurs
- **Client inscrit** : checkout 1 clic (infos pré-remplies)
- **Client invité** : nom + numéro uniquement — c'est tout

---

## 🗂️ Ce qu'on construit

### PHASE 1 — Semaines 1-3 : "Vendre en 10 minutes"

**Auth**
- Inscription/connexion téléphone ou email
- Rôles : super_admin, gestionnaire, vendeur, affilié, acheteur

**Boutique vitrine automatique**
- Dès l'inscription : pdvpro.com/[nom-boutique]
- Liste tous les produits automatiquement
- Personnalisable : nom, logo, couleurs
- Bouton Partager / Copier le lien toujours visible

**Produits**
- Types : Digital, Physique, Coaching
- Variétés : max 2 dimensions (ex: taille + couleur) avec stock par variété
- Catégories créées par le vendeur
- Plusieurs produits sur une même page de vente
- Bouton Partager / Copier le lien sur chaque produit

**Lien de paiement direct**
- Sans page de vente — lien direct vers checkout
- Idéal vendeurs WhatsApp
- Généré en 1 clic depuis le dashboard

**Page de vente**
- Plusieurs pages par vendeur (illimité)
- 5 templates fixes : Produit physique, Ebook/Digital, Formation, Coaching, Multi-produits
- Sections configurables : titre, description, prix, témoignages, FAQ, compte à rebours
- Bouton Partager / Copier le lien toujours visible

**Checkout — PRIORITÉ ABSOLUE**
- Client inscrit : 1 clic, infos pré-remplies, choisir passerelle, PAYER
- Client invité : nom + numéro, choisir passerelle, PAYER
- Localisation GPS auto ou adresse profil (livraison physique)
- Sélection variété si applicable
- Code promo optionnel (champ discret)
- NE JAMAIS demander plus d'infos que nécessaire

**Commandes**
- 4 statuts : Confirmée → En préparation → Expédiée → Livrée (+ Annulée)
- Notifications WhatsApp acheteur à chaque statut
- Facture PDF simple : boutique, produit, montant, date

**Wallet vendeur**
- Solde = ventes - 10% commission PDV Pro
- Historique transactions
- Demande de retrait → validation Admin → virement

---

### PHASE 2 — Semaines 4-6 : "Grandir"

**Affiliation**
- Lien tracké unique par affilié
- Commission % définie par le vendeur
- Dashboard simple : clics, conversions, commissions
- Retrait affilié via même mécanisme que vendeur

**Codes Promo**
- % ou montant fixe, limité dans le temps ou en quantité
- Appliqué au checkout (champ optionnel)

**Analytics**
- Par page et par produit : visites, clics, achats, annulations, taux de closing
- Pixels : Meta Ads, Google Ads, TikTok Ads

**Admin Super**
- Dashboard : GMV, commissions PDV Pro, vendeurs actifs
- Modifier taux commission
- Valider/refuser retraits
- Gérer utilisateurs

---

### PHASE 3 — v2 (après validation marché — NE PAS CODER AVANT)

- White-label & domaines custom
- Builder drag & drop
- AI Closing Booster
- Espace communauté
- Mode Direct (split automatique passerelle)
- API publique

---

## 🔧 Stack Technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 App Router — TypeScript strict |
| Base de données | Supabase (PostgreSQL) |
| ORM | Prisma |
| UI | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Emails | Resend |
| Notifications | WhatsApp Business API (Twilio) |
| Déploiement | Vercel |

---

## 📁 Structure Dossiers

```
/app
  /dashboard
    /products     → Produits + variétés
    /pages        → Pages de vente
    /orders       → Commandes
    /wallet       → Portefeuille & retraits
    /affiliates   → Programme affiliation
    /analytics    → Stats & pixels
    /settings     → Boutique & passerelles
  /[store]        → Boutique vitrine publique
    /[page]       → Page de vente
    /[product]    → Page produit
  /checkout       → Tunnel paiement simplifié
  /track/[id]     → Suivi commande
  /admin          → Super Admin
    /withdrawals  → Validation retraits
    /vendors      → Gestion vendeurs
    /settings     → Config commission
  /api
    /payments     → Webhooks CinetPay, PayTech, Wave
    /affiliates   → Tracking liens
    /analytics    → Collecte visites/clics
    /invoices     → Génération factures PDF
    /notifications → WhatsApp & email

/components
  /checkout       → Checkout simplifié
  /dashboard      → Dashboard vendeur
  /storefront     → Boutique & pages publiques
  /admin          → Admin
  /shared
    /ShareButton  → Bouton partage (PARTOUT, sans exception)
    /PromoField   → Champ code promo
  /ui             → shadcn/ui

/lib
  /payments       → CinetPay, PayTech, Wave
  /affiliates     → Tracking & commissions
  /storage        → Upload Supabase
  /invoice        → PDF factures
  /notifications  → WhatsApp, email
  /analytics      → Visites, clics, conversions

/prisma
  schema.prisma
```

---

## 🗄️ Schéma Base de Données Principal

```prisma
model User {
  id           String   @id @default(uuid())
  role         Role     // super_admin | gestionnaire | vendeur | affilie | acheteur
  name         String
  phone        String   @unique
  email        String?
  address      String?
  location_lat Float?
  location_lng Float?
  created_at   DateTime @default(now())
}

model Store {
  id            String  @id @default(uuid())
  user_id       String
  name          String
  slug          String  @unique
  logo_url      String?
  primary_color String?
}

model Product {
  id          String         @id @default(uuid())
  store_id    String
  type        ProductType    // digital | physical | coaching
  name        String
  description String?
  price       Float
  images      String[]
  category    String?
  variants    ProductVariant[]
  active      Boolean        @default(true)
}

model ProductVariant {
  id           String  @id @default(uuid())
  product_id   String
  dimension_1  String? // ex: "Taille"
  value_1      String? // ex: "L"
  dimension_2  String? // ex: "Couleur"
  value_2      String? // ex: "Rouge"
  stock        Int     @default(0)
  price_adjust Float   @default(0)
}

model SalePage {
  id          String   @id @default(uuid())
  store_id    String
  title       String
  slug        String
  template    String   // physical | digital | formation | coaching | multi
  sections    Json
  product_ids String[]
  active      Boolean  @default(true)
}

model Order {
  id               String      @id @default(uuid())
  buyer_id         String?
  buyer_name       String
  buyer_phone      String
  store_id         String
  product_id       String
  variant_id       String?
  quantity         Int         @default(1)
  subtotal         Float
  promo_discount   Float       @default(0)
  platform_fee     Float       // 10% PDV Pro — toujours calculé en premier
  vendor_amount    Float       // subtotal - promo_discount - platform_fee
  total            Float
  status           OrderStatus // confirmed | preparing | shipped | delivered | cancelled
  payment_method   String      // cinetpay | paytech | wave
  payment_ref      String?
  delivery_address String?
  created_at       DateTime    @default(now())
}

model Wallet {
  id           String @id @default(uuid())
  vendor_id    String @unique
  balance      Float  @default(0)
  pending      Float  @default(0)
  total_earned Float  @default(0)
}

model Withdrawal {
  id             String           @id @default(uuid())
  wallet_id      String
  amount         Float
  status         WithdrawalStatus // pending | approved | rejected | paid
  payment_method String
  requested_at   DateTime         @default(now())
  processed_at   DateTime?
}

model Affiliate {
  id              String @id @default(uuid())
  vendor_id       String
  user_id         String
  token           String @unique
  commission_rate Float
  clicks          Int    @default(0)
  conversions     Int    @default(0)
  total_earned    Float  @default(0)
}

model Promo {
  id         String    @id @default(uuid())
  store_id   String
  code       String
  type       String    // percent | fixed
  value      Float
  max_uses   Int?
  uses       Int       @default(0)
  expires_at DateTime?
  active     Boolean   @default(true)
}

model PageAnalytics {
  id            String   @id @default(uuid())
  page_id       String
  visits        Int      @default(0)
  clicks        Int      @default(0)
  purchases     Int      @default(0)
  cancellations Int      @default(0)
  date          DateTime @default(now())
}
```

---

## ⚙️ Conventions de Code

- TypeScript strict — jamais de `any`
- Composants dans `/components`
- Logique métier dans `/lib`
- API routes dans `/app/api`
- Variables sensibles dans `.env.local`
- **Mobile first sur tout le code UI**
- `<ShareButton />` importé sur TOUTE page publique sans exception

---

## 🔴 Règles Métier Absolues

1. Commission 10% **toujours prélevée en premier**
2. `vendor_amount = subtotal - promo_discount - platform_fee`
3. Checkout invité : **nom + numéro = maximum demandé, jamais plus**
4. Bouton partage : **présent sur toute page produit, boutique, page de vente**
5. Passerelles : **CinetPay, PayTech, Wave — rien d'autre**
6. Phase 3 : **ne pas coder avant validation marché**
7. Simplicité : **si une fonctionnalité prend plus de 3 clics, la revoir**
