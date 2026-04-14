# Walkthrough — Harmonisation UX Mobile

## Résumé

Harmonisation complète de l'expérience mobile-native sur **tous les dashboards** de la plateforme Yayyam, en alignant chaque rôle (admin, client, affilié, closer) sur le pattern établi pour le vendeur.

## Changements effectués

### 1. Fix Viewport — Zoom Mobile

**Fichier** : [layout.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/app/layout.tsx)

```diff
 export const viewport: Viewport = {
   themeColor: '#0F7A60',
   width: 'device-width',
   initialScale: 1,
-  maximumScale: 5,
+  maximumScale: 1,
+  userScalable: false,
 }
```

> [!IMPORTANT]
> Ce fix empêche le pinch-to-zoom involontaire sur mobile. Le site ne sera plus zoomé par défaut.

---

### 2. Nouveaux Composants — Bottom Tab Bar Mobile (×4)

Chaque composant suit **exactement** le même pattern que le vendeur (`MobileBottomNav.tsx`) :

- ✅ Bottom tab bar glassmorphism avec 4 tabs + Menu
- ✅ Slide-up profile sheet avec swipe-to-dismiss
- ✅ Focus trap pour accessibilité (ESC, Tab cycling)
- ✅ Body scroll lock quand le sheet est ouvert
- ✅ Fermeture automatique au changement de route

| Composant | Tabs | Fichier |
| --- | --- | --- |
| `AdminMobileBottomNav` | Accueil, Utilisateurs, Commandes, Notifs, Menu | [AdminMobileBottomNav.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/components/admin/AdminMobileBottomNav.tsx) |
| `ClientMobileBottomNav` | Accueil, Achats, Biblio, Notifs, Menu | [ClientMobileBottomNav.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/components/client/ClientMobileBottomNav.tsx) |
| `PortalMobileBottomNav` | Accueil, Liens, Ventes, Wallet, Menu | [PortalMobileBottomNav.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/components/portal/PortalMobileBottomNav.tsx) |
| `CloserMobileBottomNav` | Accueil, Terminal, Appels, Wallet, Menu | [CloserMobileBottomNav.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/components/closer/CloserMobileBottomNav.tsx) |

---

### 3. Sidebar Refactors — Hamburger → Top Bar Compacte (×4)

Chaque sidebar a été modifié pour **supprimer le hamburger menu + drawer latéral** et le remplacer par une **top bar compacte** (Logo Yayyam + icône maison + Avatar utilisateur), identique au pattern vendeur.

| Sidebar | Fichier |
| --- | --- |
| `AdminSidebar` | [AdminSidebar.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/components/admin/AdminSidebar.tsx) |
| `ClientSidebar` | [ClientSidebar.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/components/client/ClientSidebar.tsx) |
| `PortalSidebar` | [PortalSidebar.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/components/portal/PortalSidebar.tsx) |
| `CloserSidebar` | [CloserSidebar.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/components/closer/CloserSidebar.tsx) |

> [!NOTE]
> Les sidebars **desktop** (`lg:`) restent 100% inchangées — seule la partie mobile a été remplacée.

---

### 4. Layout Integration (×4)

Chaque layout a été mis à jour avec :

- ✅ **Mesh background** (même effet que le vendeur — emerald/teal glows pulsants)
- ✅ **Padding harmonisé** : `pt-14 lg:pt-4 pb-24 lg:pb-12 px-3 lg:px-8 xl:px-10`
- ✅ **Bottom nav** intégré en tant que composant sibling du `<main>`
- ✅ **max-w-[2000px]** pour le contenu principal

| Layout | Fichier |
| --- | --- |
| Admin | [admin/layout.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/app/admin/layout.tsx) |
| Client | [client/layout.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/app/client/layout.tsx) |
| Portal | [portal/layout.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/app/portal/layout.tsx) |
| Closer | [closer/layout.tsx](file:///Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV%20Pro/app/closer/layout.tsx) |

---

### 5. Non modifié

- **`/delivery`** — Déjà mobile-first par design (page standalone sans sidebar)
- **`/dashboard` (vendeur)** — Déjà conforme, c'est le modèle de référence

## Vérification

- ✅ `npm run build` — **Exit code 0**, zéro erreur TypeScript
- ✅ Toutes les routes compilent correctement (admin, client, closer, portal, dashboard, delivery)
- ✅ Aucune régression desktop — les sidebars `lg:` sont intactes

## Matrice finale de conformité

| Dashboard | Top Bar Compacte | Bottom Nav | Mesh BG | Padding Harmonisé | Status |
| :---: | :---: | :---: | :---: | :---: | :---: |
| Vendeur | ✅ | ✅ | ✅ | ✅ | ✅ Référence |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ Harmonisé |
| Client | ✅ | ✅ | ✅ | ✅ | ✅ Harmonisé |
| Affilié | ✅ | ✅ | ✅ | ✅ | ✅ Harmonisé |
| Closer | ✅ | ✅ | ✅ | ✅ | ✅ Harmonisé |
| Livraison | N/A | N/A | N/A | N/A | ⚪ Mobile-first |
