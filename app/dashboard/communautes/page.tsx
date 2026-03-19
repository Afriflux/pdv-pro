// ─── app/dashboard/communautes/page.tsx ──────────────────────────────────────
// Server Component — Communauté PDV Pro
// Charge posts + leaderboard en parallèle, délègue l'UI à CommunautesClient

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import CommunautesClient from './CommunautesClient'

export const dynamic = 'force-dynamic'

// ─── Types partagés avec CommunautesClient ────────────────────────────────────

export interface PostItem {
  id:             string
  store_id:       string
  content:        string
  image_url:      string | null
  category:       string
  likes_count:    number
  comments_count: number
  user_liked:     boolean
  created_at:     string
  store_name:     string
  store_logo:     string | null
}

export interface LeaderboardEntry {
  rank:          number
  store_id:      string
  store_name:    string
  store_logo:    string | null
  store_slug:    string
  total_revenue: number
  order_count:   number
  level:         string
  level_emoji:   string
}

export interface CurrentStore {
  id:       string
  name:     string
  logo_url: string | null
  slug:     string | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CommunautesPage() {
  const supabase = await createClient()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── URL de base + cookies pour les fetch internes (auth SSR) ─────────────
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const cookieStore = cookies()
  const cookieHeader = cookieStore.toString()

  // ── Chargements parallèles ────────────────────────────────────────────────
  const [postsRes, leaderboardRes, storeRes] = await Promise.all([
    fetch(`${appUrl}/api/community/posts?limit=20`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    }),
    fetch(`${appUrl}/api/community/leaderboard?period=month`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    }),
    supabase
      .from('Store')
      .select('id, name, logo_url, slug')
      .eq('user_id', user.id)
      .single(),
  ])

  // ── Store obligatoire ─────────────────────────────────────────────────────
  const store = storeRes.data as CurrentStore | null
  if (!store) redirect('/dashboard')

  // ── Données posts ─────────────────────────────────────────────────────────
  let initialPosts: PostItem[] = []
  if (postsRes.ok) {
    try {
      const json = await postsRes.json() as { posts?: PostItem[] }
      initialPosts = json.posts ?? []
    } catch {
      // Feed vide si erreur de parsing
    }
  }

  // ── Données leaderboard (top 5 affiché initialement) ─────────────────────
  let initialLeaderboard: LeaderboardEntry[] = []
  if (leaderboardRes.ok) {
    try {
      const json = await leaderboardRes.json() as { leaderboard?: LeaderboardEntry[] }
      initialLeaderboard = (json.leaderboard ?? []).slice(0, 5)
    } catch {
      // Classement vide si erreur
    }
  }

  return (
    <CommunautesClient
      initialPosts={initialPosts}
      initialLeaderboard={initialLeaderboard}
      store={store}
    />
  )
}
