# 🔧 Phase 15 — Plan Chirurgical PDV Pro

**Date :** 13 avril 2026
**Build actuel :** 111 pages · Exit Code 0 ✅
**Objectif :** Corrections ciblées post-rollback + hardening production

---

## 📊 État Réel du Codebase (Audit complet effectué)

> **Bonne nouvelle** : L'état du codebase est bien meilleur qu'anticipé.
> Le rollback + les phases précédentes ont laissé **seulement 7 findMany sans pagination** (et non 19).
> Les Pixels de Conversion, Headers, et Workflow UI sont déjà en place et fonctionnels.

---

## BLOC A — Pagination des 7 `findMany` restants sans `take`

**Priorité : HAUTE** — Risque de surcharge mémoire en production.

### A1. `app/admin/marketplace/actions.ts` (3 requêtes)

| Ligne | Modèle | Requête actuelle | Correction |
|-------|--------|------------------|------------|
| 24 | `themeTemplate` | `findMany({ orderBy: { created_at: 'desc' } })` | Ajouter `take: 50` |
| 25 | `workflow` | `findMany({ where: { store_id: 'system' } })` | Ajouter `take: 50` |
| 31 | `masterclassArticle` | `findMany({ orderBy: { created_at: 'desc' } })` | Ajouter `take: 50` |

**Contexte :** Page admin marketplace — peu de données aujourd'hui, mais sans limit la croissance du catalogue créera des latences.

### A2. `app/api/cron/funds/route.ts` (2 requêtes)

| Ligne | Modèle | Requête actuelle | Correction |
|-------|--------|------------------|------------|
| 65 | `transaction` | `findMany({ where: { wallet_id: { in: walletIds }, type: 'deposit' } })` | Ajouter `take: 500` |
| 107 | `wallet` | `findMany({ where: { OR: [{ balance: { lt: 0 } }, { pending: { lt: 0 } }] } })` | Ajouter `take: 100` |

**Contexte :** CRON financier — `take: 500` pour les transactions (besoin de couvrir le batch de 100 commandes × N transactions). `take: 100` pour les wallets négatifs (anomalie = cas rare, 100 suffit largement).

### A3. `app/api/ai/coach/route.ts` (1 requête)

| Ligne | Modèle | Requête actuelle | Correction |
|-------|--------|------------------|------------|
| 42 | `masterclassArticle` | `findMany({ where: { is_active: true }, select: { title: true, intro: true, tips: true } })` | Ajouter `take: 50` |

**Contexte :** Coach IA — charge tout le catalogue de masterclasses pour le contexte. `take: 50` est safe car on a un `select` léger.

### A4. `app/dashboard/closing/page.tsx` (1 requête)

| Ligne | Modèle | Requête actuelle | Correction |
|-------|--------|------------------|------------|
| 49 | `buyerScore` | `findMany({ where: { phone: { in: phones } } })` | Ajouter `take: 200` |

**Contexte :** Lookup de scores acheteurs — filtré par `in: phones` (max 50 phones vu le `take: 50` de closingRequests). `take: 200` est un garde-fou confortable.

### Validation Bloc A
- [ ] `npx tsc --noEmit` → Exit Code 0
- [ ] Aucun `findMany` sans `take` dans le codebase (vérification grep)

---

## BLOC B — Vérification Headers (DÉJÀ OK ✅)

**Résultat de l'audit :**
Les headers et sidebars sont **déjà optimisés**. Aucun espacement excessif détecté.

| Composant | Spacing actuel | Verdict |
|-----------|---------------|---------|
| `LandingHeader.tsx` | `h-16`, `px-6`, `gap-6` | ✅ Compact |
| `PortalSidebar.tsx` | `px-3`, `py-2.5`, `gap-2` | ✅ Clean |
| `Sidebar.tsx` (Dashboard) | `px-3`, `py-2.5`, collapsed `w-11 h-11` | ✅ Optimal |
| `portal/layout.tsx` | `p-6 md:p-10`, `pt-14 lg:pt-0` | ✅ Responsive |

**Action :** Aucune modification nécessaire. Si tu souhaites un allègement supplémentaire spécifique, précise quels headers te semblent trop espacés.

---

## BLOC C — Pixels de Conversion (DÉJÀ OK ✅)

**Résultat de l'audit :**
Le système de tracking est **complet et en production**.

| Pixel | Composant | Intégré sur |
|-------|-----------|-------------|
| Meta (Facebook) | `PixelTracker.tsx` | Storefront, Checkout, Product |
| TikTok | `PixelTracker.tsx` | Storefront, Checkout, Product |
| Google Tag/GA4 | `PixelTracker.tsx` | Storefront, Checkout, Product |
| Affiliation | `AffiliateTracker.tsx` | Landing, Dashboard |
| Analytics interne | `YayyamAnalytics.tsx` | Pages de vente |

**Configuration vendeur :** `dashboard/settings/tabs/SeoTab.tsx`
**Configuration admin :** `admin/settings/PlatformSection.tsx`

**Action :** Aucune modification nécessaire. Si tu veux ajouter un pixel spécifique (Snapchat, Twitter/X, etc.), c'est un ajout mineur au `PixelTracker.tsx`.

---

## BLOC D — Workflow UI (DÉJÀ OK ✅)

**Résultat de l'audit :**
Le `UniversalWorkflowBuilder` est **complet et production-ready**.

- Dashboard avec hero banner ✅
- Cartes workflow avec toggles actif/inactif ✅
- CRUD complet (créer, éditer, supprimer, cloner) ✅
- Bibliothèque de templates globaux avec modals d'achat ✅
- Formulaires de configuration (webhook, SMS, WhatsApp, email, tâche, IA) ✅
- Aucun TODO, placeholder vide, ou "Coming Soon" détecté ✅

**Action :** Aucune modification nécessaire.

---

## 📋 Résumé Exécutif Phase 15

| Bloc | Tâches | Effort | Statut |
|------|--------|--------|--------|
| **A — Pagination** | 7 `findMany` à corriger | ~15 min | 🔴 À faire |
| **B — Headers** | Audit fait, rien à changer | 0 min | ✅ Terminé |
| **C — Pixels** | Déjà implémentés | 0 min | ✅ Terminé |
| **D — Workflow UI** | Déjà complet | 0 min | ✅ Terminé |

**Temps total estimé : ~15 minutes**
**Risque : FAIBLE** — Modifications simples, ajout de `take: X` uniquement.

---

## 🚀 Prochaines étapes suggérées (Phase 16+)

Puisque la Phase 15 est beaucoup plus légère qu'anticipé, voici ce qu'on pourrait prioriser ensuite :

1. **Pagination côté UI** — Ajouter des boutons "Charger plus" / infinite scroll sur les listes à `take: 50`
2. **Conversion Events avancés** — Ajouter `fbq('track', 'Purchase')` et `ttq.track('CompletePayment')` sur la page de succès post-checkout
3. **Monitoring CRON** — Dashboard admin pour visualiser les résultats des CRONs (funds, reminders, retention)
4. **Tests E2E** — Couvrir les parcours critiques (checkout, closing, affiliation)

---

*Plan généré par analyse exhaustive du codebase — 104 findMany audités sur 67 fichiers.*
