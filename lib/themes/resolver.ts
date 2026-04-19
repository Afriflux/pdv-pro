/**
 * Résolution dynamique des thèmes Yayyam
 * Utilisé pour charger le bon composant selon les préférences du vendeur.
 */

export type StorefrontTheme = 'classic' | 'cinematic'
export type FunnelTheme = 'classic' | 'cinematic'
export type ProductCardTheme = 'minimal' | 'hover_reveal'

export interface ThemePreferences {
  theme_storefront: StorefrontTheme
  theme_funnel: FunnelTheme
  theme_product_card: ProductCardTheme
}

export const DEFAULT_THEMES: ThemePreferences = {
  theme_storefront: 'classic',
  theme_funnel: 'classic',
  theme_product_card: 'minimal',
}

export function resolveThemePreferences(store: Record<string, any> | null): ThemePreferences {
  if (!store) return DEFAULT_THEMES
  return {
    theme_storefront: (store.theme_storefront as StorefrontTheme) || DEFAULT_THEMES.theme_storefront,
    theme_funnel: (store.theme_funnel as FunnelTheme) || DEFAULT_THEMES.theme_funnel,
    theme_product_card: (store.theme_product_card as ProductCardTheme) || DEFAULT_THEMES.theme_product_card,
  }
}
