# Yayyam — SKILLS.md
# Guide complet de développement et décisions produit
# Dernière mise à jour : 13/03/2026 — Version 5.0 FINALE
# Objectif lancement : 1er avril 2026

---

## 🏗️ STACK TECHNIQUE

- **Framework** : Next.js 14 + TypeScript strict
- **Base de données** : Supabase + Prisma ORM
- **Auth** : Supabase Auth (JWT)
- **Styling** : Tailwind CSS + shadcn/ui
- **Déploiement** : Vercel
- **Storage fichiers** : Supabase Storage (PDF, audio, zip)
- **Storage vidéo** : Bunny.net (streaming + CDN Afrique)
- **WhatsApp** : Twilio WhatsApp API
- **PDF** : @react-pdf/renderer
- **QR Code** : librairie `qrcode` (npm)
- **PWA** : Service Worker + Web Manifest
- **IA** : Anthropic Claude API (claude-sonnet-4-20250514)
- **Chat support** : Tawk.to (gratuit)
- **Supabase Project ID** : ncyloylrxmwesngjlagl

### Variables d'environnement complètes
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Passerelles paiement
CINETPAY_API_KEY=
CINETPAY_SITE_ID=
PAYTECH_API_KEY=
PAYTECH_API_SECRET=
WAVE_API_KEY=

# WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

# IA
ANTHROPIC_API_KEY=

# Vidéo Bunny.net
BUNNY_STORAGE_KEY=
BUNNY_STORAGE_ZONE=pdvpro
BUNNY_CDN_URL=https://pdvpro.b-cdn.net
BUNNY_STREAM_KEY=
BUNNY_LIBRARY_ID=

# Domaines personnalisés
VERCEL_API_TOKEN=
VERCEL_PROJECT_ID=
```

---

## 📁 STRUCTURE PROJET

```
/app
  /dashboard
    /page.tsx               → Tableau de bord
    /products               → CRUD produits ✅ FAIT
    /pages                  → Pages de vente
    /orders                 → Commandes
    /wallet                 → Portefeuille & retraits
    /marketing              → Partage, QR, liens, stats
    /promotions             → Promotions
    /affilies               → Affiliation
    /promos                 → Codes promo
    /analytics              → Analytics
    /workflows              → Workflow Builder (Pro+)
    /tasks                  → Task Manager
    /closing                → Closing COD
    /abonnements            → Plans Starter/Pro+
    /tips                   → Infos & Astuces
    /settings               → Paramètres
  /admin                    → Super Admin
  /[slug]                   → Boutique vitrine
  /[slug]/[page_id]         → Page de vente
  /pay/[product_id]         → Lien paiement direct
  /dl/[token]               → Livraison digitale
  /verify/[id]              → Vérification certificat licence
  /s/[code]                 → Liens courts
  /boutiques                → Marketplace
/lib
  /supabase
  /payments                 → cinetpay.ts, paytech.ts, wave.ts
  /whatsapp                 → sendWhatsApp.ts
  /pdf                      → generateInvoice.ts, generateCertificate.ts
  /qrcode                   → generateQR.ts
  /ai                       → generateContent.ts, intelligence.ts
  /automation               → workflows.ts, pulses.ts, tasks.ts
  /domains                  → customDomain.ts
  /video                    → bunny.ts
  /digital                  → access.ts, token.ts
```

---

## MODÈLE ÉCONOMIQUE DÉFINITIF

### PLAN GRATUIT — Commission dégressive
- **Commission automatique sur le CA mensuel :**
  - 0 - 100K FCFA/mois      → **7%**
  - 100K - 500K FCFA/mois   → **6%**
  - 500K - 1M FCFA/mois     → **5%**
  - +1M FCFA/mois           → **4%**
- **Yayyam absorbe TOUS les frais** (passerelles + frais de retrait).
- **Acheteur paie** : le prix exact affiché (zéro frais caché).
- **Vendeur reçoit** : (100% - commission) net garanti.
- **Disponibilité des fonds** : IMMÉDIATE après chaque paiement confirmé.

### OPTION COD — 9 900 FCFA/mois
- **Débloque le paiement à la livraison.**
- **0% commission** sur les ventes COD.
- **Frais achat (1-2%)** : supportés par l'acheteur.
- **Frais retrait Wave (1%)** : supportés par le vendeur.
- **Disponibilité des fonds** : Immédiate après confirmation de la livraison.

---

### FRAIS PASSERELLES (Pour info technique)
À l'achat :
  Wave     : 1%
  CinetPay : 2%
  PayTech  : 2%

Au retrait :
  Wave     : 1% ← recommandé
  CinetPay : 2%
  PayTech  : 2%

---

## 🗃️ BASE DE DONNÉES — TOUTES LES TABLES

### ⚠️ BUG À CORRIGER EN PREMIER
```sql
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS
  cash_on_delivery BOOLEAN NOT NULL DEFAULT FALSE;
-- Puis : npx prisma db pull && npx prisma generate
```

### Colonnes à ajouter sur Product
```sql
-- Type de produit
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS
  product_type TEXT NOT NULL DEFAULT 'physical';
  -- 'physical' | 'digital' | 'coaching' | 'cod'

-- Contenu digital
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS
  digital_files JSONB;
  -- [{ type: 'pdf'|'audio'|'zip'|'link'|'member'|'video',
  --    url: '...', filename: '...', size: 0,
  --    bunny_video_id: '...' }]

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS
  access_duration_days INTEGER DEFAULT 30;
  -- null = à vie

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS
  max_downloads INTEGER DEFAULT 3;
  -- null = illimité

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS
  video_download_allowed BOOLEAN DEFAULT FALSE;
  -- streaming seul ou streaming + téléchargement

-- Licence & droits de revente
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS
  license_type TEXT DEFAULT 'personal';
  -- 'personal'|'resell'|'mrr'|'plr'|'whitelabel'

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS
  license_notes TEXT;
```

### Colonnes à ajouter sur Order
```sql
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'physical';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_payment';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS download_token TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS download_expires_at TIMESTAMPTZ;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS cod_confirmed_at TIMESTAMPTZ;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS slot_reserved_until TIMESTAMPTZ;
```

### Nouvelles tables
```sql
-- Abonnements
CREATE TABLE IF NOT EXISTS "Subscription" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES "Store"(id),
  plan TEXT NOT NULL DEFAULT 'free',
  expires_at TIMESTAMPTZ,
  payment_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications internes
CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "User"(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Signalements & litiges
CREATE TABLE IF NOT EXISTS "Report" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES "Order"(id),
  reporter_id UUID NOT NULL REFERENCES "User"(id),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Logs admin
CREATE TABLE IF NOT EXISTS "AdminLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES "User"(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Score marketplace
CREATE TABLE IF NOT EXISTS "StoreScore" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL UNIQUE REFERENCES "Store"(id),
  score INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Factures
CREATE TABLE IF NOT EXISTS "Invoice" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES "Order"(id),
  numero TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  white_label BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Liens courts
CREATE TABLE IF NOT EXISTS "ShortLink" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  store_id UUID REFERENCES "Store"(id),
  product_id UUID REFERENCES "Product"(id),
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics clics
CREATE TABLE IF NOT EXISTS "ClickAnalytics" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  short_link_id UUID NOT NULL REFERENCES "ShortLink"(id),
  source TEXT,
  city TEXT,
  country TEXT,
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Closing COD
CREATE TABLE IF NOT EXISTS "ClosingRequest" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES "Order"(id),
  closer_id UUID REFERENCES "User"(id),
  status TEXT NOT NULL DEFAULT 'awaiting_closer',
  attempts INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  commission_amount INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Règle : annulation COD après statut "delivered" → bloquée automatiquement
-- Champ fraud_suspected BOOLEAN sur Order pour flag admin
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS cod_cash_collected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cod_fraud_suspected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS commission_frozen_amount INTEGER DEFAULT 0;

-- Domaines personnalisés
CREATE TABLE IF NOT EXISTS "CustomDomain" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL UNIQUE REFERENCES "Store"(id),
  domain TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  ssl_active BOOLEAN NOT NULL DEFAULT FALSE,
  trial_started_at TIMESTAMPTZ,
  trial_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Promotions
CREATE TABLE IF NOT EXISTS "Promotion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES "Store"(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value INTEGER,
  min_order_amount INTEGER,
  product_ids UUID[],
  bundle_config JSONB,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  views INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue_generated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflows automation
CREATE TABLE IF NOT EXISTS "Workflow" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES "Store"(id),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  condition_config JSONB,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  executions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tâches
CREATE TABLE IF NOT EXISTS "Task" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES "Store"(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'todo',
  source TEXT NOT NULL DEFAULT 'manual',
  related_order_id UUID REFERENCES "Order"(id),
  related_product_id UUID REFERENCES "Product"(id),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pulses temps réel
CREATE TABLE IF NOT EXISTS "Pulse" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES "Store"(id),
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  action_url TEXT,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Infos & Astuces
CREATE TABLE IF NOT EXISTS "Tip" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  target_plan TEXT,
  target_condition JSONB,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TipRead" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tip_id UUID NOT NULL REFERENCES "Tip"(id),
  user_id UUID NOT NULL REFERENCES "User"(id),
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tip_id, user_id)
);

-- Scoring acheteurs
CREATE TABLE IF NOT EXISTS "BuyerScore" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES "Store"(id),
  score INTEGER NOT NULL DEFAULT 50,
  total_orders INTEGER NOT NULL DEFAULT 0,
  completed_orders INTEGER NOT NULL DEFAULT 0,
  cancelled_orders INTEGER NOT NULL DEFAULT 0,
  disputed_orders INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phone, store_id)
);

-- Accès digitaux
CREATE TABLE IF NOT EXISTS "DigitalAccess" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES "Order"(id),
  product_id UUID NOT NULL REFERENCES "Product"(id),
  token TEXT NOT NULL UNIQUE,
  downloads_used INTEGER NOT NULL DEFAULT 0,
  downloads_max INTEGER,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historique téléchargements
CREATE TABLE IF NOT EXISTS "DownloadLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  digital_access_id UUID NOT NULL REFERENCES "DigitalAccess"(id),
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quota vidéo par boutique
CREATE TABLE IF NOT EXISTS "VideoQuota" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL UNIQUE REFERENCES "Store"(id),
  storage_used_mb INTEGER NOT NULL DEFAULT 0,
  storage_limit_mb INTEGER NOT NULL DEFAULT 10240,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coaching créneaux (Phase 2)
CREATE TABLE IF NOT EXISTS "CoachingSlot" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES "Product"(id),
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "Booking" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES "Order"(id),
  slot_id UUID NOT NULL REFERENCES "CoachingSlot"(id),
  datetime_confirmed TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);
```

---

## 📁 PRODUITS DIGITAUX — Spec complète

### Formats supportés

| Format | Extensions | Taille max | Stockage |
|---|---|---|---|
| PDF | .pdf | 100 MB | Supabase Storage (privé) |
| Document | .docx, .pptx, .xlsx | 50 MB | Supabase Storage (privé) |
| Audio / Podcast | .mp3, .wav, .m4a | 200 MB | Supabase Storage (privé) |
| Archive | .zip, .rar | 500 MB | Supabase Storage (privé) |
| Vidéo | .mp4, .mov | 5 GB/fichier | Bunny.net Stream |
| Lien externe | URL | — | Aucun |
| Espace membre | URL + identifiants | — | Aucun |

### Vidéo — Bunny.net

```
POURQUOI BUNNY.NET :
  ✅ CDN Johannesburg + Lagos → rapide en Afrique
  ✅ Streaming adaptatif (360p/480p/720p selon connexion)
  ✅ Lecteur intégré simple
  ✅ DRM léger (signed URLs)
  ✅ ~1$/100 GB/mois — le moins cher du marché
  ✅ API simple

QUOTA PAR PLAN :
  Starter → Vidéo non disponible
  Pro+    → 10 GB inclus
             Dépassement : 1 000 FCFA/10 GB

UPLOAD FLOW :
  Vendeur upload vidéo → Yayyam → Bunny.net
  Encodage automatique (360p, 480p, 720p)
  Thumbnail auto générée
  Prêt en ~2-5 min selon taille

ACCÈS ACHETEUR :
  Lecteur intégré Yayyam (Bunny player)
  Streaming uniquement (défaut)
  Téléchargement optionnel (vendeur active)
```

```typescript
// lib/video/bunny.ts

async function uploadVideo(
  file: Buffer,
  filename: string,
  storeId: string
): Promise<{ videoId: string; thumbnailUrl: string }> {
  // 1. Créer vidéo dans library Bunny Stream
  // POST https://video.bunnycdn.com/library/{LIBRARY_ID}/videos
  // 2. Upload le fichier
  // PUT https://video.bunnycdn.com/library/{LIBRARY_ID}/videos/{VIDEO_ID}
  // 3. Retourner videoId + thumbnail
}

function generateSecureStreamUrl(
  videoId: string,
  expiresInHours: number = 24
): string {
  // URL signée HMAC — expire après X heures
  // https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{VIDEO_ID}?token={HMAC}&expires={TS}
}
```

### Accès configurable par produit

```
Vendeur définit :
  DURÉE D'ACCÈS : 7j / 30j / 1an / À vie
  TÉLÉCHARGEMENTS : 1 / 3 / Illimité
  VIDÉO TÉLÉCHARGEABLE : OUI / NON
  Défaut : 30 jours + 3 téléchargements
```

### Livraison automatique

```
IPN paiement confirmé
        ↓
Token SHA-256 généré (unique par commande)
        ↓
WhatsApp acheteur :
"📥 [Produit] est prêt !
 Accéder → yayyam.com/dl/[token]
 ⚠️ Valable [X jours]"
        ↓
Page /dl/[token] vérifie :
  ✅ Token valide
  ✅ Non expiré
  ✅ Downloads restants
  ✅ Non révoqué
  → Sert fichier (signed URL 60 sec)
  → OU lecteur vidéo Bunny (signed URL 24h)
  → OU redirige vers lien externe
  → OU affiche identifiants espace membre
```

### Sécurité fichiers

```
Bucket Supabase PRIVÉ — jamais d'URL directe
Signed URL générée à la volée (valable 60 sec)
Fichiers : /digital/[store_id]/[product_id]/[filename]
Vidéos : Bunny.net avec token signé HMAC
```

### Page /dl/[token] — Interface mobile

```
┌─────────────────────────────────┐
│  📥 Formation Marketing Digital │
│  Rose Beauty Dakar              │
├─────────────────────────────────┤
│  🎬 [Lecteur vidéo Bunny.net]   │
│     Auto-qualité selon connexion│
├─────────────────────────────────┤
│  FICHIERS INCLUS                │
│  📄 Support PDF        [⬇️]     │
│  🎵 Résumé audio       [⬇️]     │
│  📦 Ressources ZIP     [⬇️]     │
├─────────────────────────────────┤
│  ⏱️ Accès jusqu'au 13/04/2026   │
│  📊 2 téléchargements restants  │
├─────────────────────────────────┤
│  💼 Licence MRR incluse         │
│  [Voir certificat PDF]          │
├─────────────────────────────────┤
│  Un problème ? [WhatsApp]       │
└─────────────────────────────────┘
```

### Règles métier digital

```
Vendeur peut :
  - Voir qui a téléchargé, quand, combien de fois
  - Révoquer un accès (litige)
  - Prolonger un accès manuellement
  - Renvoyer le lien depuis la commande
  - Renvoyer lien vidéo expire → régénère token 24h

Super Admin peut :
  - Révoquer tout accès digital
  - Voir tous les accès d'une boutique
```

---

## 🏷️ LICENCES & DROITS DE REVENTE

### 5 types

| Licence | Badge | Ce que peut faire l'acheteur |
|---|---|---|
| **Usage personnel** | 🔒 | Usage privé uniquement |
| **Revente simple** | 📤 | Revendre tel quel |
| **MRR** | 💼 | Revendre + transmettre droits de revente |
| **PLR** | ✏️ | Modifier + revendre comme sien |
| **White-label** | 🏢 | Rebaptiser totalement + revendre |

### Certificat de licence automatique

```
Après achat digital → PDF généré :
  - Nom produit, acheteur, date, commande
  - Type de licence + droits détaillés
  - QR Code vérification → yayyam.com/verify/[id]
  
Envoyé avec le lien de téléchargement
White-label Pro+ : logo boutique au lieu de Yayyam
```

### Affichage page de vente

```
Badge licence visible sous le prix :
"💼 MRR INCLUS — Vous pouvez revendre
 ce produit et ses droits [En savoir plus]"
```

---

## 📦 FLOWS COMMANDES

### Statuts

- **Physique** : pending → paid → processing → shipped → delivered → completed
- **Digital** : pending → paid → completed (livraison auto immédiate)
- **Coaching** : slot_reserved → pending → paid → confirmed → completed
- **COD** : `pending` → `confirmed` → `shipped` → `delivered` → `cod_confirmed` → `completed`

Statuts spéciaux COD :
- `cod_pending_confirmation` : livré mais confirmation en attente
- `cod_fraud_suspected` : annulation post-livraison bloquée, en attente admin
- `no_answer` : 3 tentatives Closing sans réponse

### Cron Jobs

| Job | Fréquence | Action |
|---|---|---|
| Expiration paiement | 5 min | pending > 30 min → cancelled |
| Expiration slot | 5 min | slot_reserved > 15 min → libéré |
| Fonds disponibles | 1h | delivered > 48h → wallet available |
| Rappel COD | 1h | delivered COD > 48h → WhatsApp |
| Rappel coaching | 8h/jour | Séance dans 24h → WhatsApp |
| Promo expirée | 1h | Date dépassée → désactivée |
| Vérif domaine | 10 min | DNS lookup → verified |
| Essai domaine | 1h | trial > 14j + free → retrait domaine |
| Escalade litige | 1h | Litige > 48h sans réponse → admin |
| Quota vidéo | 1h | Vérifier dépassement → alerte vendeur |

---

## 🎯 SERVICE CLOSING COD

### Principe fondamental
Le COD (Cash on Delivery) est uniquement disponible pour les **produits physiques**.
Les produits digitaux, coaching et RDV nécessitent un paiement en ligne obligatoire
avant toute livraison ou réservation de créneau.

| Type produit | COD autorisé |
|---|---|
| Physique | ✅ Oui |
| Digital (PDF, vidéo, audio, lien) | ❌ Non |
| Coaching / RDV | ❌ Non |

---

### Accès au COD selon le plan

| Plan | Condition d'accès | Commission |
|---|---|---|
| Starter | Solde portefeuille ≥ 10% du prix produit | 10% prélevée à la confirmation livraison |
| Pro+ | Aucune caution requise | 0% |

---

### Mécanisme de caution Starter — règle du 10%

Avant d'accepter une commande COD, le système vérifie automatiquement :

```
Solde portefeuille ≥ (Prix produit × 10%)
```

Exemples :
- Produit à 10 000 FCFA → caution requise : 1 000 FCFA
- Produit à 50 000 FCFA → caution requise : 5 000 FCFA
- Produit à 80 000 FCFA → caution requise : 8 000 FCFA

Si le solde est insuffisant → commande COD **bloquée automatiquement**.
Message vendeur : *"Créditez X FCFA dans votre portefeuille pour accepter cette commande COD."*

Le montant COD autorisé par vente = Solde portefeuille ÷ 10%

---

### Cycle de vie de la commission COD

```
1. Commande COD créée
        ↓
2. Système vérifie : solde ≥ 10% du prix ?
   NON → commande bloquée
   OUI → commission GELÉE (réservée, non débitée)
        ↓
3. Commande en livraison
        ↓
4a. Livraison CONFIRMÉE
    → Commission PRÉLEVÉE définitivement
    → Fonds vendeur disponibles sous 48h
        ↓
4b. Annulation AVANT statut "Livré"
    → Commission LIBÉRÉE automatiquement
    → Portefeuille restauré intégralement
        ↓
4c. Annulation APRÈS statut "Livré"
    → BLOQUÉE automatiquement
    → Nécessite validation Super Admin
    → Alerte fraud détectée
```

---

### Protection anti-fraude COD

Le risque principal : vendeur encaisse le cash et déclare faussement "Annulé"
pour récupérer sa commission gelée.

Règles de protection :

```
- Annulation après "Livré" → impossible sans admin
- 2 annulations post-livraison → avertissement automatique
- 3 annulations post-livraison → suspension COD du compte
- Suspension COD → notification vendeur + ticket admin ouvert
- Service Closing = tiers confirmateur indépendant
```

Indicateurs de fraude surveillés :
- Ratio annulations post-livraison > 20% → flag orange
- Ratio annulations post-livraison > 40% → flag rouge + suspension auto
- Même numéro acheteur + plusieurs annulations → score acheteur dégradé

---

### Service Closing COD (optionnel)

- Disponible Starter et Pro+
- Activable dans Paramètres boutique
- Commission Closing : **3%** sur vente confirmée uniquement
- Le closer est un tiers indépendant qui contacte l'acheteur
- 3 tentatives maximum sur 24h
- Sans réponse après 3 tentatives → statut `no_answer` → commande annulée
- Le closer confirme la livraison indépendamment du vendeur
- En cas de litige annulation post-livraison → rapport Closing fait foi

---

### Cron Jobs COD

| Job | Fréquence | Action |
|---|---|---|
| Vérif caution | Temps réel | Bloquer commande si solde insuffisant |
| Rappel COD | 1h | Livré > 48h sans confirmation → WhatsApp vendeur |
| Escalade COD | 1h | COD > 72h sans confirmation → alerte admin |
| Fraude COD | 6h | Calculer ratio annulations post-livraison |
| Déblocage fonds | 48h | Livraison confirmée → fonds disponibles |

---

### Interface vendeur — toggle COD

```text
┌─────────────────────────────────────────┐
│  💵 Paiement à la livraison (COD)       │
│                                         │
│  [PLAN STARTER]                         │
│  Votre solde : 3 500 FCFA               │
│  → COD autorisé jusqu'à : 35 000 FCFA  │
│  → Créditez pour débloquer plus         │
│                                         │
│  [PLAN PRO+]                            │
│  ✅ COD activé sans caution             │
│  Commission : 0%                        │
│                                         │
│  ⚠️ COD disponible uniquement pour      │
│  les produits physiques                 │
└─────────────────────────────────────────┘
```

---

## 💰 WALLET & RETRAITS

- Délai Starter : 48h après confirmation livraison
- Délai Pro+ : Instantané — fonds disponibles immédiatement après confirmation
- Minimum retrait : 1 000 FCFA
- Retrait auto Pro+ : seuil configurable dans Paramètres
- Impossible si litige ouvert ou abonnement en retard
- COD Starter : commission gelée libérée après cod_confirmed
- COD Pro+ : 0% commission, retrait instantané après livraison confirmée

---

## 🌐 DOMAINE PERSONNALISÉ

- Pro+ uniquement — 14j essai gratuit
- CNAME → cname.yayyam.com
- SSL Let's Encrypt auto via Vercel API
- Vérification DNS toutes les 10 min
- Retour yayyam.com/[slug] + 301 si essai expiré

---

## 🎯 PROMOTIONS — 6 TYPES

1. **Flash** ⚡ — compte à rebours, Starter + Pro+
2. **Saisonnières** 📅 — Tabaski, Ramadan, Noël... Pro+
3. **Bundle** 📦 — achetez 2 payez 1, pack... Pro+
4. **Livraison gratuite** 🚚 — conditions configurables, Pro+
5. **Première commande** 🎁 — détection auto numéro, Pro+
6. **IA suggérée** 🤖 — analyse données → 1 clic, Pro+

Règles : 1 promo active/produit, non cumulable avec codes promo

---

## ⚡ AUTOMATISATIONS

### Flows pré-configurés

```
ABANDON CHECKOUT (Starter + Pro+)
  checkout > 30 min → WhatsApp acheteur

RELANCE POST-ACHAT (Pro+)
  completed + 7j → WhatsApp acheteur

UPSELL AUTO (Pro+)
  paiement confirmé → WhatsApp acheteur -10%
```

### Escalades automatiques

```
COD > 48h → WhatsApp vendeur
COD > 72h → Alerte admin
COD > 96h → Proposition closing auto
Litige > 48h → WhatsApp critique vendeur
Litige > 72h → Escalade Super Admin
Shipped > 7j → WhatsApp vendeur
Shipped > 14j → Litige auto
Retrait > 48h → Alerte admin
```

### Détection fraude

```
Même acheteur > 3 annulations → Flag admin
Même IP > 5 commandes/h → Blocage temp
Taux annulation vendeur > 30% → Avertissement
Taux annulation vendeur > 50% → Suspension préventive
```

### Workflow Builder no-code (Pro+)

```
[TRIGGER] → [CONDITION] → [ACTION]
Triggers : commande, paiement, stock, abandon,
           acheteur récurrent, X jours sans vente,
           affilié, date programmée
Conditions : montant, produit, ville, premier achat
Actions : WhatsApp, tâche, promo, webhook, email
```

---

## 🤖 INTELLIGENCE ARTIFICIELLE

### 6 fonctionnalités IA

| # | Fonctionnalité | Plan | Déclencheur |
|---|---|---|---|
| 1 | Description produit | Tous | Bouton "✨ Générer" |
| 2 | Contenu page de vente | Tous | Bouton "✨ Générer" |
| 3 | Recommandations hebdo | Starter 1/sem, Pro+ illimité | Auto |
| 4 | Assistant conversationnel | Pro+ | Chat dashboard |
| 5 | Prix suggéré | Tous | Création produit |
| 6 | Promotion suggérée | Pro+ | Détection auto |

```typescript
// lib/ai/generateContent.ts
// Modèle : claude-sonnet-4-20250514
// Clé : ANTHROPIC_API_KEY (serveur uniquement)
// Coût moyen : ~0.003$ par génération
```

---

## ⚡ PULSES — Signaux temps réel

```
🔴 CRITIQUE : litige ouvert, retrait rejeté
🟠 URGENT   : COD > 48h, stock épuisé
🟡 IMPORTANT: 200 vues 0 vente, promo expire
🟢 INFO     : nouvel affilié, récap disponible
```

---

## ✅ TASK MANAGER

```
Sources : système auto, IA, vendeur manuel
Vue : liste ou kanban
Starter : 10 tâches actives max
Pro+    : illimitées
```

---

## 🔗 WEBHOOKS & MCP

### Webhooks (Pro+)

```
Événements : order.*, withdrawal.*, stock.low, promotion.expired
Signature HMAC + retry 3 tentatives
```

### MCP Server (Phase 3)

```
Compatible : Claude Desktop, Zapier, Make, n8n
Outils : getOrders, updateStatus, getWallet,
         createProduct, sendWhatsApp, getAnalytics
```

---

## 👨‍💼 GAMIFICATION & ONBOARDING

### Badges

🌱 Première vente | ⚡ 10 ventes/mois | 🔥 50 ventes
💎 Pro+ | 🏆 Top du mois | ⭐ Zéro litige 3 mois
🚀 100 ventes/mois | 👑 500 ventes total

### Onboarding auto

```
J+0  WhatsApp bienvenue + checklist 5 étapes
J+1  Si 0 produit → relance WhatsApp
J+3  Si 0 page → relance WhatsApp
J+5  Si 0 vente → 3 conseils
J+7  Si 0 vente → coaching gratuit
J+30 Si actif → suggestion Pro+ + calcul économie
```

---

## 💡 INFOS & ASTUCES

```
Section /dashboard/tips :
  - Nouveautés Yayyam (épinglées)
  - Conseils IA personnalisés
  - 8 guides pratiques
  - Alertes saisonnières (7j avant)
  - Actualités + maintenance

Notifications push sidebar avec badge non-lu
Astuce hebdo automatique chaque lundi 8h
```

---

## 📱 NOTIFICATIONS FREEMIUM

| | Starter | Pro+ |
|---|---|---|
| Dashboard interne | ✅ Toutes | ✅ Toutes |
| WA nouvelle commande | ✅ | ✅ |
| WA compte suspendu | ✅ | ✅ |
| WA retrait | ❌ | ✅ |
| WA stock épuisé | ❌ | ✅ |
| WA fonds disponibles | ❌ | ✅ |
| WA rappel coaching | ❌ | ✅ |
| WA récap hebdo | ❌ | ✅ |
| Acheteurs | ✅ Toujours | ✅ Toujours |

---

## 💳 PASSERELLES DE PAIEMENT

### CinetPay

- ⚠️ Montant multiple de 5 obligatoire
- Intégration : Redirection uniquement (bug Safari iOS)
- Env : `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`

### PayTech

- ⚠️ Toujours côté serveur (CORS désactivé)
- IPN : HMAC-SHA256
- Retraits : `POST /transfer/transferFund`
- Env : `PAYTECH_API_KEY`, `PAYTECH_API_SECRET`

### Wave Business

- ⚠️ Timestamp valide 5 min max
- ⚠️ IP Whitelisting obligatoire en production
- Env : `WAVE_API_KEY`

---

## 🖥️ DASHBOARD VENDEUR — SIDEBAR FINALE

```
PRINCIPAL
  🏠 Tableau de bord
  📦 Mes Produits
  🛍️ Pages de vente
  📋 Commandes

FINANCES
  💰 Portefeuille

CROISSANCE
  📤 Marketing
  🎯 Promotions
  👥 Affiliés
  🎫 Codes Promo
  📊 Analytics

AUTOMATISATIONS (Pro+)
  ⚡ Workflows
  ✅ Tâches

SERVICES
  🎯 Closing (si COD activé)

COMPTE
  💎 Abonnements
  💡 Infos & Astuces
  ⚙️ P## 🤖 BOT TELEGRAM — SPEC TECHNIQUE COMPLÈTE

Le bot Telegram `@Yayyam_bot` est le pilier de l'automatisation des produits de type "Communauté" et de l'assistance vendeur mobile.

### 1. CONFIGURATION & ENV
- `TELEGRAM_BOT_TOKEN` : Token BotFather
- `TELEGRAM_BOT_USERNAME` : `@Yayyam_bot`
- Webhook URL : `${APP_URL}/api/notifications/telegram/webhook` (HMAC vérifié)

### 2. COMMANDES RÉFÉRENCE
| Commande | Contexte | Action |
|---|---|---|
| `/start` | Privé | Lien avec compte Yayyam + Menu principal |
| `/connect [CODE]` | Canal/Groupe | Lie le canal à un produit "Communauté" via son code secret |
| `/status` | Canal/Groupe | Vérifie les droits du bot et le nombre de membres actifs |
| `/dashboard` | Privé | Affiche le solde wallet et les dernières ventes |
| `/link [ID]` | Privé | Génère rapidement un lien de paiement pour un produit |
| `/help` | Tous | Liste des commandes disponibles |

### 3. FONCTIONNALITÉS — COMMUNAUTÉS PAYANTES (PRO)
- **Admission Auto** : Dès paiement validé, génération d'un `ChatInviteLink` unique via `createChatInviteLink`.
- **Lien à usage unique** : expire après 24h ou 1 utilisation.
- **Tracking des membres** : Stockage du `telegram_user_id` lié à la `Order`.
- **Expulsion Auto** : `banChatMember` (puis `unbanChatMember` pour permettre le retour futur) à l'expiration de l'accès.
- **Relances WhatsApp** : Notifications synchronisées avec l'expiration Telegram (J-3, J-1, Jour J).

### 4. FONCTIONNALITÉS — ASSISTANT VENDEUR
- **Alertes Instantanées** : Notification push Telegram pour chaque vente (produit, montant, client).
- **Gestion Mobile** : Boutons inline `[Confirmer la livraison]` (pour COD) ou `[Détails client]`.
- **Sécurité** : Demande du PIN de sécurité pour les actions sensibles (ex: initier un retrait).

### 5. FORMATIONS & COACHING
- **Groupes de Soutien** : Admission auto des élèves dans le groupe lié à la formation.
- **Rappels Coaching** : Notification Telegram + WhatsApp 1h avant la session de coaching.
- **Lien Meet** : Envoi automatique du lien de visioconférence.
emplates 1-5 + IA
18/03             Pages de vente templates 6-10
19/03             Boutique vitrine + Factures PDF
                  Produits digitaux (fichiers + Bunny vidéo)
                  Licences + Certificats + /dl/[token]
20/03             Marketing Hub + Promotions + Closing
21/03             Workflows + Tasks + Pulses + Super Admin
22/03             Landing page + Marketplace + PWA + SEO
23/03             Plans Pro+ + Domaine perso + Tips
                  Tests end-to-end + Beta 5 vendeurs
01/04             🚀 LANCEMENT PUBLIC
```

---

## 🤖 BOT TELEGRAM — SPEC COMPLÈTE

Variables d'environnement requises :
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME=@Yayyam_bot`

### 1. COMMUNAUTÉS PAYANTES (PRO)
- **Flow Vendeur** : 
  - Ajoute @Yayyam_bot comme administrateur du canal/groupe.
  - Tape `/connect YAYYAM-[CODE]` dans le canal pour lier à sa boutique.
- **Flow Acheteur** :
  - Après paiement validé → Reçoit un lien d'invitation unique à usage unique.
  - Le bot gère les admissions automatiques.
- **Gestion des Expirations** :
  - Retrait automatique du membre à la date d'expiration.
  - Relances WhatsApp automatiques à J-3, J-1 et le jour de l'expiration.

### 2. FORMATIONS & COACHING
- **Achat de formation** : Accès automatique au groupe Telegram de soutien.
- **Coaching** : Confirmation instantanée + Lien Google Meet + Rappel automatique.
- **Alertes** : Rappel WhatsApp 1h avant chaque session de coaching.
- **Feedback** : Demande de feedback automatique après chaque session.

### 3. BOT ASSISTANT VENDEUR
- **Alertes Commandes** : Notification instantanée sur Telegram pour chaque nouvelle vente.
- **Gestion Rapide** : Boutons "Confirmer" ou "Annuler" les commandes directement depuis le bot.
- **Dashboard Mobile** : Consultation du solde Wallet et des statistiques du jour.
- **Partage Rapide** : Génération de liens de vente et QR Codes à la demande.

---

## 📏 RÈGLES DE DÉVELOPPEMENT

1. Toujours répondre en FRANÇAIS
2. Scripts SQL directement dans la discussion
3. Guider chaque manipulation manuelle étape par étape
4. Ne jamais sauter d'étapes
5. Confirmer chaque étape avant la suivante
6. Un fichier à la fois — attendre confirmation
7. TypeScript strict — zéro `any`
8. Server Actions pour toutes les mutations
9. RLS activé sur toutes les nouvelles tables
10. Tester le build après chaque série de fichiers
11. SPECS GELÉES — coder exactement ce fichier

---

*Yayyam — La plateforme de vente intelligente pour l'Afrique de l'Ouest*
*Next.js 14 + Supabase + Prisma + Tailwind + Vercel + Claude AI + Bunny.net*
*Supabase ID : ncyloylrxmwesngjlagl*
*🚀 Lancement : 1er avril 2026*
