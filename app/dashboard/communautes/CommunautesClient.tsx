'use client'

// ─── app/dashboard/communautes/CommunautesClient.tsx ─────────────────────────
// Client Component — Feed communautaire PDV Pro
// 4 onglets : Feed | Classement | Groupes | Ressources

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PostItem, LeaderboardEntry, CurrentStore } from './page'

interface StoreProduct {
  id: string
  name: string
  type: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommunautesClientProps {
  initialPosts:       PostItem[]
  initialLeaderboard: LeaderboardEntry[]
  store:              CurrentStore
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId     = 'feed' | 'classement' | 'groupes' | 'ressources'
type FilterId  = 'all' | 'general' | 'question' | 'success' | 'tip' | 'mode' | 'digital' | 'food'

interface CommentItem {
  id:         string
  post_id:    string
  store_id:   string
  content:    string
  created_at: string
  store_name: string
  store_logo: string | null
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const FILTERS: { id: FilterId; label: string; emoji: string }[] = [
  { id: 'all',      label: 'Tous',      emoji: '🌐' },
  { id: 'general',  label: 'Général',   emoji: '📣' },
  { id: 'question', label: 'Question',  emoji: '❓' },
  { id: 'success',  label: 'Succès',    emoji: '🏆' },
  { id: 'tip',      label: 'Astuce',    emoji: '💡' },
  { id: 'mode',     label: 'Mode',      emoji: '👗' },
  { id: 'digital',  label: 'Digital',   emoji: '📱' },
  { id: 'food',     label: 'Food',      emoji: '🍎' },
]

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  general:  { label: 'Général',  emoji: '📣', color: 'bg-gray-100 text-gray-600'    },
  question: { label: 'Question', emoji: '❓', color: 'bg-blue-100 text-blue-700'   },
  success:  { label: 'Succès',   emoji: '🏆', color: 'bg-yellow-100 text-yellow-700' },
  tip:      { label: 'Astuce',   emoji: '💡', color: 'bg-amber-100 text-amber-700'  },
  mode:     { label: 'Mode',     emoji: '👗', color: 'bg-pink-100 text-pink-700'    },
  digital:  { label: 'Digital',  emoji: '📱', color: 'bg-indigo-100 text-indigo-700' },
  food:     { label: 'Food',     emoji: '🍎', color: 'bg-green-100 text-green-700'  },
}



const RESOURCES = [
  { emoji: '📖', title: 'Comment écrire une description qui vend',  desc: 'Les 5 éléments d\'une fiche produit irrésistible pour le marché africain.' },
  { emoji: '🎯', title: '5 techniques pour booster vos ventes',     desc: 'Stratégies éprouvées par les top-vendeurs PDV Pro pour multiplier leur CA.' },
  { emoji: '📸', title: 'Guide photo produit avec un smartphone',   desc: 'Prendre des photos professionnelles avec votre téléphone en 10 minutes.' },
  { emoji: '💡', title: 'Utiliser WhatsApp Business pour vendre',   desc: 'Catalogue, réponses automatiques et statuts : guide complet.' },
  { emoji: '📊', title: 'Comprendre vos analytics PDV Pro',         desc: 'Lire vos statistiques et prendre les bonnes décisions pour votre boutique.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)   return 'À l\'instant'
  if (mins < 60)  return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `il y a ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `il y a ${days}j`
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

function StoreAvatar({ name, logo, size = 'md' }: { name: string; logo: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  if (logo) {
    return (
      <img
        src={logo} alt={name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-[#0F7A60] flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm`}
    >
      <span className="font-black text-white">{getInitial(name)}</span>
    </div>
  )
}

// ─── Composant PostCard ───────────────────────────────────────────────────────

interface PostCardProps {
  post:      PostItem
  currentStoreId: string
  onLike:    (postId: string) => void
}

function PostCard({ post, currentStoreId, onLike }: PostCardProps) {
  const [commentsOpen, setCommentsOpen]   = useState(false)
  const [comments,     setComments]       = useState<CommentItem[]>([])
  const [commentsLoad, setCommentsLoad]   = useState(false)
  const [newComment,   setNewComment]     = useState('')
  const [submitting,   setSubmitting]     = useState(false)

  const cat = CATEGORY_LABELS[post.category] ?? CATEGORY_LABELS['general']

  const loadComments = async () => {
    if (commentsOpen) { setCommentsOpen(false); return }
    setCommentsOpen(true)
    if (comments.length > 0) return
    setCommentsLoad(true)
    try {
      const res = await fetch(`/api/community/posts/${post.id}/comments`)
      if (res.ok) {
        const json = await res.json() as { comments?: CommentItem[] }
        setComments(json.comments ?? [])
      }
    } finally {
      setCommentsLoad(false)
    }
  }

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const json = await res.json() as { comment: CommentItem }
        setComments(prev => [...prev, json.comment])
        setNewComment('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* ── Header ── */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <StoreAvatar name={post.store_name} logo={post.store_logo} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-black text-sm text-[#1A1A1A] truncate">{post.store_name}</p>
            <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">{timeAgo(post.created_at)}</span>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full mt-0.5 ${cat.color}`}>
            {cat.emoji} {cat.label}
          </span>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      {/* ── Image ── */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <img
            src={post.image_url} alt="Image du post"
            className="w-full rounded-xl object-cover max-h-64"
          />
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-4 px-4 pb-3 pt-1 border-t border-gray-50">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm font-bold transition-all duration-200 hover:scale-105 ${
            post.user_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
          }`}
        >
          <span className="text-base">{post.user_liked ? '❤️' : '🤍'}</span>
          <span>{post.likes_count}</span>
        </button>

        <button
          onClick={loadComments}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-[#0F7A60] transition-colors"
        >
          <span className="text-base">💬</span>
          <span>{post.comments_count}</span>
        </button>
      </div>

      {/* ── Commentaires ── */}
      {commentsOpen && (
        <div className="border-t border-gray-50 bg-[#FAFAF7] px-4 py-3 space-y-3">
          {commentsLoad ? (
            <p className="text-xs text-gray-400 text-center py-2 animate-pulse">Chargement…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2 italic">Aucun commentaire. Soyez le premier !</p>
          ) : (
            <div className="space-y-2.5">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2">
                  <StoreAvatar name={c.store_name} logo={c.store_logo} size="sm" />
                  <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-500 mb-0.5">{c.store_name}</p>
                    <p className="text-xs text-gray-700">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input commentaire */}
          <div className="flex items-center gap-2">
            <StoreAvatar name={currentStoreId} logo={null} size="sm" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
                placeholder="Écrire un commentaire…"
                maxLength={500}
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none
                  focus:border-[#0F7A60] transition-colors bg-white"
              />
              <button
                onClick={submitComment}
                disabled={!newComment.trim() || submitting}
                className="px-3 py-2 bg-[#0F7A60] text-white text-xs font-black rounded-xl
                  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0D6B53] transition-colors"
              >
                {submitting ? '…' : '↑'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CommunautesClient({
  initialPosts,
  initialLeaderboard,
  store,
}: CommunautesClientProps) {

  // ── État global ─────────────────────────────────────────────────────────────
  const [posts,        setPosts]        = useState<PostItem[]>(initialPosts)
  const [leaderboard,  setLeaderboard]  = useState<LeaderboardEntry[]>(initialLeaderboard)
  const [activeTab,    setActiveTab]    = useState<TabId>('feed')
  const [activeFilter, setActiveFilter] = useState<FilterId>('all')
  const [postContent,  setPostContent]  = useState('')
  const [postCategory, setPostCategory] = useState('general')
  const [publishing,   setPublishing]   = useState(false)
  const [feedLoading,  setFeedLoading]  = useState(false)
  const [lbPeriod,     setLbPeriod]     = useState<'month' | 'all'>('month')
  const [lbLoading,    setLbLoading]    = useState(false)

  // ── Charger le feed par catégorie ──────────────────────────────────────────
  const loadFeed = useCallback(async (filter: FilterId) => {
    setFeedLoading(true)
    setActiveFilter(filter)
    try {
      const url = `/api/community/posts?limit=20${filter !== 'all' ? `&category=${filter}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json() as { posts?: PostItem[] }
        setPosts(json.posts ?? [])
      }
    } finally {
      setFeedLoading(false)
    }
  }, [])

  // ── Charger le leaderboard ─────────────────────────────────────────────────
  const loadLeaderboard = async (period: 'month' | 'all') => {
    setLbPeriod(period)
    setLbLoading(true)
    try {
      const res = await fetch(`/api/community/leaderboard?period=${period}`)
      if (res.ok) {
        const json = await res.json() as { leaderboard?: LeaderboardEntry[] }
        setLeaderboard(json.leaderboard ?? [])
      }
    } finally {
      setLbLoading(false)
    }
  }

  // ── Publier un post ─────────────────────────────────────────────────────────
  const publishPost = async () => {
    if (!postContent.trim() || publishing) return
    setPublishing(true)
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent.trim(), category: postCategory }),
      })
      if (res.ok) {
        const json = await res.json() as { post: { id: string; content: string; category: string; created_at: string; likes_count: number } }
        // Ajout optimiste en tête du feed
        const newPost: PostItem = {
          id:             json.post.id,
          store_id:       store.id,
          content:        json.post.content,
          image_url:      null,
          category:       json.post.category,
          likes_count:    0,
          comments_count: 0,
          user_liked:     false,
          created_at:     json.post.created_at,
          store_name:     store.name,
          store_logo:     store.logo_url,
        }
        setPosts(prev => [newPost, ...prev])
        setPostContent('')
        setPostCategory('general')
        if (activeTab !== 'feed') setActiveTab('feed')
      }
    } finally {
      setPublishing(false)
    }
  }

  // ── Toggle like optimiste ──────────────────────────────────────────────────
  const handleLike = useCallback(async (postId: string) => {
    // Mise à jour optimiste immédiate
    setPosts(prev => prev.map(p =>
      p.id !== postId ? p : {
        ...p,
        user_liked:  !p.user_liked,
        likes_count: p.user_liked ? p.likes_count - 1 : p.likes_count + 1,
      }
    ))
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' })
      if (res.ok) {
        const json = await res.json() as { liked: boolean; likes_count: number }
        // Synchroniser avec la valeur serveur
        setPosts(prev => prev.map(p =>
          p.id !== postId ? p : { ...p, user_liked: json.liked, likes_count: json.likes_count }
        ))
      } else {
        // Annuler l'optimiste en cas d'erreur
        setPosts(prev => prev.map(p =>
          p.id !== postId ? p : {
            ...p,
            user_liked:  !p.user_liked,
            likes_count: p.user_liked ? p.likes_count - 1 : p.likes_count + 1,
          }
        ))
      }
    } catch {
      // Annuler l'optimiste en cas d'erreur réseau
      setPosts(prev => prev.map(p =>
        p.id !== postId ? p : {
          ...p,
          user_liked:  !p.user_liked,
          likes_count: p.user_liked ? p.likes_count - 1 : p.likes_count + 1,
        }
      ))
    }
  }, [])

  // ─── RENDU ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-16">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-black text-[#1A1A1A]">Communauté PDV Pro 🌍</h1>
          <p className="text-sm text-gray-500 mt-1">Vendeurs africains — Partagez, apprenez, progressez ensemble.</p>
        </div>
      </div>

      {/* ── ONGLETS ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {([
            { id: 'feed',       label: 'Feed',        emoji: '📰' },
            { id: 'classement', label: 'Classement',  emoji: '🏆' },
            { id: 'groupes',    label: 'Groupes',     emoji: '💬' },
            { id: 'ressources', label: 'Ressources',  emoji: '🎓' },
          ] as { id: TabId; label: string; emoji: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-black whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#0F7A60] text-[#0F7A60]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ══════════════════════════════════════════════════════════════════
            ONGLET 1 — FEED
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'feed' && (
          <div className="space-y-5">

            {/* Formulaire création post */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-start gap-3">
                <StoreAvatar name={store.name} logo={store.logo_url} />
                <div className="flex-1 space-y-3">
                  <textarea
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    placeholder={`Partagez quelque chose avec la communauté, ${store.name} !`}
                    maxLength={1000}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none
                      focus:border-[#0F7A60] transition-colors resize-none placeholder:text-gray-400"
                  />
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <select
                        aria-label="Catégorie de post"
                        title="Catégorie de post"
                        value={postCategory}
                        onChange={e => setPostCategory(e.target.value)}
                        className="text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none
                          focus:border-[#0F7A60] font-bold text-gray-600 cursor-pointer bg-white"
                      >
                        <option value="general">📣 Général</option>
                        <option value="question">❓ Question</option>
                        <option value="success">🏆 Succès</option>
                        <option value="tip">💡 Astuce</option>
                        <option value="mode">👗 Mode</option>
                        <option value="digital">📱 Digital</option>
                        <option value="food">🍎 Food</option>
                      </select>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {postContent.length}/1000
                      </span>
                    </div>
                    <button
                      onClick={publishPost}
                      disabled={!postContent.trim() || publishing}
                      className="px-5 py-2 bg-[#0F7A60] text-white text-xs font-black rounded-xl
                        disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0D6B53]
                        transition-all shadow-sm shadow-[#0F7A60]/20"
                    >
                      {publishing ? 'Publication…' : '✈️ Publier'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres catégories */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => loadFeed(f.id)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black
                    border transition-all ${
                    activeFilter === f.id
                      ? 'bg-[#0F7A60] text-white border-[#0F7A60] shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#0F7A60]/40'
                  }`}
                >
                  <span>{f.emoji}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>

            {/* Posts */}
            {feedLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
                <p className="text-4xl">📭</p>
                <p className="font-black text-[#1A1A1A]">Aucun post dans cette catégorie</p>
                <p className="text-sm text-gray-400">Soyez le premier à publier !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentStoreId={store.id}
                    onLike={handleLike}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ONGLET 2 — CLASSEMENT
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'classement' && (
          <div className="space-y-6">

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A]">🏆 Top Vendeurs</h2>
                <p className="text-xs text-gray-400">
                  {lbPeriod === 'month' ? 'Ce mois-ci' : 'Depuis le début'}
                </p>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {(['month', 'all'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => loadLeaderboard(p)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                      lbPeriod === p ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    {p === 'month' ? 'Ce mois' : 'Tout temps'}
                  </button>
                ))}
              </div>
            </div>

            {lbLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-4xl mb-3">📊</p>
                <p className="font-black text-gray-500">Pas encore de données pour cette période.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Podium top 3 */}
                {leaderboard.slice(0, 3).length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {(['🥇', '🥈', '🥉'] as string[]).map((medal, idx) => {
                      const entry = leaderboard[idx]
                      if (!entry) return <div key={idx} />
                      const isMe = entry.store_id === store.id
                      return (
                        <div
                          key={entry.store_id}
                          className={`bg-white rounded-2xl border p-4 text-center space-y-2 shadow-sm ${
                            isMe ? 'border-[#0F7A60] ring-2 ring-[#0F7A60]/20' : 'border-gray-100'
                          } ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}
                        >
                          <div className="text-3xl">{medal}</div>
                          <StoreAvatar name={entry.store_name} logo={entry.store_logo} size="lg" />
                          <div>
                            <p className="font-black text-xs text-[#1A1A1A] truncate">{entry.store_name}</p>
                            <p className="text-[10px] text-gray-400">{entry.level_emoji} {entry.level}</p>
                          </div>
                          <p className="text-[10px] font-black text-[#0F7A60]">
                            {Math.round(entry.total_revenue).toLocaleString('fr-FR')} F
                          </p>
                          {isMe && <span className="text-[10px] font-black text-[#0F7A60]">← Vous</span>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Positions 4-10 */}
                {leaderboard.slice(3).map(entry => {
                  const isMe = entry.store_id === store.id
                  return (
                    <div
                      key={entry.store_id}
                      className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm transition-all ${
                        isMe ? 'border-[#0F7A60] ring-2 ring-[#0F7A60]/20' : 'border-gray-100 hover:shadow-md'
                      }`}
                    >
                      <span className="text-xl font-black text-gray-400 w-8 text-center flex-shrink-0">
                        #{entry.rank}
                      </span>
                      <StoreAvatar name={entry.store_name} logo={entry.store_logo} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm text-[#1A1A1A] truncate">{entry.store_name}</p>
                          {isMe && <span className="text-[10px] font-black text-white bg-[#0F7A60] px-2 py-0.5 rounded-full">Vous</span>}
                        </div>
                        <p className="text-[10px] text-gray-400">{entry.level_emoji} {entry.level} · {entry.order_count} commandes</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-sm text-[#0F7A60]">
                          {Math.round(entry.total_revenue).toLocaleString('fr-FR')}
                        </p>
                        <p className="text-[10px] text-gray-400">FCFA</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ONGLET 3 — GROUPES
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'groupes' && (
          <TelegramGroupsTab storeId={store.id} />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ONGLET 4 — RESSOURCES
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'ressources' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-[#1A1A1A]">🎓 Ressources & Guides</h2>
              <p className="text-sm text-gray-400 mt-1">
                Conseils pratiques pour développer votre activité en Afrique.
              </p>
            </div>

            <div className="space-y-3">
              {RESOURCES.map((r, i) => (
                <a
                  key={i}
                  href="/dashboard/tips"
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                    flex items-start gap-4 hover:shadow-md hover:border-[#0F7A60]/30
                    transition-all duration-200 group"
                >
                  <span className="text-3xl flex-shrink-0">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#1A1A1A] group-hover:text-[#0F7A60] transition-colors text-sm">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{r.desc}</p>
                  </div>
                  <span className="text-[#0F7A60] font-black text-sm flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    Lire →
                  </span>
                </a>
              ))}
            </div>

            <div className="bg-[#0F7A60]/5 border border-[#0F7A60]/20 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <p className="text-sm text-[#0F7A60] font-medium">
                De nouveaux guides sont ajoutés chaque semaine. Rejoignez la communauté pour ne rien manquer.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Types Telegram Communities ───────────────────────────────────────────────

interface TelegramCommunity {
  id: string
  chat_id: string
  chat_title: string
  chat_type: 'group' | 'supergroup' | 'channel'
  product_id: string | null
  is_active: boolean
  members_count: number
  created_at: string
}

type ConnectStep = 'idle' | 'generating' | 'waiting' | 'success' | 'error'

// ─── Hook Countdown ───────────────────────────────────────────────────────────

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    if (!expiresAt) { setRemaining(0); return }
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      setRemaining(Math.max(0, diff))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return { remaining, display: `${mins}:${secs.toString().padStart(2, '0')}` }
}

// ─── Composant TelegramGroupsTab ──────────────────────────────────────────────

function TelegramGroupsTab({ storeId }: { storeId: string }) {
  const [communities, setCommunities] = useState<TelegramCommunity[]>([])
  const [step, setStep]   = useState<ConnectStep>('idle')
  const [code, setCode]   = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const [products, setProducts] = useState<StoreProduct[]>([])
  const [productLinks, setProductLinks] = useState<Record<string, string>>({})

  // Charger les produits au montage
  useEffect(() => {
    if (!storeId) return
    const supabase = createClient()
    supabase
      .from('Product')
      .select('id, name, type')
      .eq('store_id', storeId)
      .eq('active', true)
      .order('name')
      .then(({ data }) => setProducts(data || []))
  }, [storeId])

  // Initialiser les liens au chargement des communautés
  useEffect(() => {
    const links: Record<string, string> = {}
    communities.forEach(c => {
      if (c.product_id) links[c.id] = c.product_id
    })
    setProductLinks(links)
  }, [communities])

  // Lier le produit via l'API
  async function linkProduct(communityId: string, productId: string | null) {
    const res = await fetch('/api/telegram/community', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ community_id: communityId, product_id: productId || null })
    })
    if (res.ok) {
      setProductLinks(prev => ({
        ...prev,
        [communityId]: productId || ''
      }))
    }
  }

  const { remaining, display: countdown } = useCountdown(expiresAt)

  // Charger les communautés au montage
  const fetchCommunities = useCallback(async () => {
    try {
      const res = await fetch(`/api/telegram/community?store_id=${storeId}`)
      const data = await res.json()
      setCommunities(data.communities || [])
    } catch {
      console.error('Erreur chargement communautés')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => { fetchCommunities() }, [fetchCommunities])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  // Générer un code
  const handleGenerateCode = async () => {
    setStep('generating')
    setError(null)
    try {
      const res = await fetch('/api/telegram/community/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCode(data.code)
      setExpiresAt(data.expires_at)
      setStep('waiting')
      startPolling(data.code)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setStep('error')
    }
  }

  // Auto-polling toutes les 5s pendant 2 minutes
  const startPolling = (pollCode: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    let elapsed = 0
    pollingRef.current = setInterval(async () => {
      elapsed += 5000
      if (elapsed > 120_000) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        return
      }
      try {
        const res = await fetch(
          `/api/telegram/community/verify?store_id=${storeId}&code=${pollCode}`
        )
        const data = await res.json()
        if (data.linked) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setStep('success')
          await fetchCommunities()
        }
      } catch { /* silence */ }
    }, 5000)
  }

  // Vérification manuelle
  const verifyConnection = async () => {
    if (!code) return
    try {
      const res = await fetch(
        `/api/telegram/community/verify?store_id=${storeId}&code=${code}`
      )
      const data = await res.json()
      if (data.linked) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        setStep('success')
        await fetchCommunities()
      } else if (data.expired) {
        setError('Code expiré. Générez un nouveau code.')
        setStep('error')
      }
    } catch {
      setError('Erreur de vérification')
    }
  }

  // Supprimer une communauté
  const deleteCommunity = async (communityId: string) => {
    if (!confirm('Supprimer cette communauté ? Le groupe Telegram ne sera pas supprimé.')) return
    setDeleting(communityId)
    try {
      await fetch('/api/telegram/community', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ community_id: communityId }),
      })
      await fetchCommunities()
    } finally {
      setDeleting(null)
    }
  }

  // Copier le code
  const copyCode = () => {
    if (!code) return
    navigator.clipboard.writeText(`/connect ${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Reset
  const resetFlow = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setStep('idle')
    setCode(null)
    setExpiresAt(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-[#0F7A60] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1A1A1A]">
            📡 {communities.length > 0 ? `Mes communautés (${communities.length})` : 'Communautés Telegram'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Liez vos groupes et canaux Telegram à votre boutique.
          </p>
        </div>
        {step === 'idle' && (
          <button
            onClick={handleGenerateCode}
            className="bg-[#0F7A60] hover:bg-[#0D6B53] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
          >
            <span>+</span> Nouvelle communauté
          </button>
        )}
      </div>

      {/* ── Flow de connexion ── */}
      {(step === 'generating' || step === 'waiting' || step === 'success' || step === 'error') && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="font-black text-[#1A1A1A]">Connecter votre groupe Telegram</h3>

          {step === 'generating' && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#0F7A60] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-500">Génération du code…</span>
            </div>
          )}

          {step === 'waiting' && code && (
            <div className="space-y-6">
              {/* Étape 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-[#0F7A60]/10 text-[#0F7A60] rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm">1</div>
                <div>
                  <p className="font-bold text-sm text-[#1A1A1A]">Ajoutez @PDVProBot comme administrateur</p>
                  <p className="text-xs text-gray-400 mt-1">Permission : Inviter des utilisateurs • Bannir des utilisateurs</p>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-[#0F7A60]/10 text-[#0F7A60] rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm">2</div>
                <div className="flex-1 space-y-2">
                  <p className="font-bold text-sm text-[#1A1A1A]">Dans votre groupe, tapez :</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm text-[#1A1A1A] font-bold">
                      /connect {code}
                    </code>
                    <button
                      onClick={copyCode}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        copied
                          ? 'bg-[#0F7A60] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {copied ? '✓ Copié' : '📋 Copier'}
                    </button>
                  </div>
                  <p className={`text-xs font-bold flex items-center gap-1 ${
                    remaining < 120_000 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    ⏱️ Code expire dans {countdown}
                  </p>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-[#0F7A60]/10 text-[#0F7A60] rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm">3</div>
                <div className="flex-1">
                  <button
                    onClick={verifyConnection}
                    className="bg-[#0F7A60] hover:bg-[#0D6B53] text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors"
                  >
                    ✓ Vérifier la connexion
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2">Vérification automatique toutes les 5 secondes.</p>
                </div>
              </div>

              <button
                onClick={resetFlow}
                className="text-sm text-gray-400 hover:text-gray-600 font-bold transition-colors"
              >
                ← Annuler
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-[#0F7A60]/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-black text-[#1A1A1A]">Groupe connecté avec succès !</p>
                <p className="text-sm text-gray-400 mt-1">Votre groupe Telegram est désormais lié à votre boutique.</p>
              </div>
              <button
                onClick={resetFlow}
                className="bg-[#0F7A60] hover:bg-[#0D6B53] text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors"
              >
                Fermer
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">❌</span>
              </div>
              <div>
                <p className="font-black text-red-600">{error || 'Une erreur est survenue'}</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button onClick={resetFlow} className="text-sm text-gray-400 hover:text-gray-600 font-bold">
                  Annuler
                </button>
                <button
                  onClick={handleGenerateCode}
                  className="bg-[#0F7A60] hover:bg-[#0D6B53] text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors"
                >
                  Nouveau code
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Liste des communautés liées ── */}
      {communities.length > 0 ? (
        <div className="space-y-3">
          {communities.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{c.chat_type === 'channel' ? '📢' : '💬'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[#1A1A1A] truncate">{c.chat_title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                        {c.chat_type}
                      </span>
                      <span className="text-xs text-gray-400">{c.members_count} membres</span>
                      {c.is_active && (
                        <span className="flex items-center gap-1 text-xs text-[#0F7A60] font-bold">
                          <span className="w-1.5 h-1.5 bg-[#0F7A60] rounded-full animate-pulse" />
                          Actif
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteCommunity(c.id)}
                  disabled={deleting === c.id}
                  className="text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {deleting === c.id ? '…' : '🗑 Supprimer'}
                </button>
              </div>

              {/* Produit lié */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                  🔗 Accès automatique après achat de :
                </label>
                <select
                  value={productLinks[c.id] || c.product_id || ''}
                  onChange={(e) => linkProduct(c.id, e.target.value || null)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                    focus:outline-none focus:border-[#0F7A60] bg-white transition-colors"
                >
                  <option value="">— Aucun produit lié —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.type === 'digital' ? '📦' : '🛍️'} {p.name}
                    </option>
                  ))}
                </select>
                {productLinks[c.id] && (
                  <p className="text-[10px] text-[#0F7A60] font-bold mt-1">
                    ✅ Les acheteurs reçoivent l&apos;accès automatiquement
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : step === 'idle' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center space-y-4">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <span className="text-4xl">📡</span>
          </div>
          <div>
            <p className="font-black text-[#1A1A1A]">Aucune communauté liée</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              Connectez un groupe ou canal Telegram pour créer un espace réservé à vos acheteurs.
            </p>
          </div>
          <button
            onClick={handleGenerateCode}
            className="bg-[#0F7A60] hover:bg-[#0D6B53] text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors inline-flex items-center gap-2"
          >
            <span>+</span> Connecter un groupe
          </button>
        </div>
      ) : null}
    </div>
  )
}
