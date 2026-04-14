'use client'

import { toast } from 'sonner';

// ─── app/dashboard/communautes/CommunautesClient.tsx ─────────────────────────
// Client Component — Feed communautaire Yayyam
// 4 onglets : Feed | Classement | Groupes | Ressources

import { useState, useCallback, useRef } from 'react'
import { Trash2, MessageSquare, Send, RefreshCw, ChevronRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { PostItem, LeaderboardEntry, CurrentStore } from './page'



// ─── Props ────────────────────────────────────────────────────────────────────

interface CommunautesClientProps {
  initialPosts:       PostItem[]
  initialLeaderboard: LeaderboardEntry[]
  store:              CurrentStore
  initialTab?:        TabId
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

// ─── Gamification Helper ────────────────────────────────────────────────────────
function getNextTierGamification(revenue: number) {
  if (revenue < 100000) return { current: 'Débutant', next: 'Actif', emoji: '🌱', threshold: 100000, gap: 100000 - revenue }
  if (revenue < 500000) return { current: 'Actif', next: 'Pro', emoji: '🔥', threshold: 500000, gap: 500000 - revenue }
  if (revenue < 1000000) return { current: 'Pro', next: 'Élite', emoji: '💼', threshold: 1000000, gap: 1000000 - revenue }
  return { current: 'Élite', next: null, emoji: '👑', threshold: null, gap: 0 }
}

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
  question: { label: 'Question', emoji: '❓', color: 'bg-emerald-100 text-emerald-700'   },
  success:  { label: 'Succès',   emoji: '🏆', color: 'bg-yellow-100 text-yellow-700' },
  tip:      { label: 'Astuce',   emoji: '💡', color: 'bg-amber-100 text-amber-700'  },
  mode:     { label: 'Mode',     emoji: '👗', color: 'bg-pink-100 text-pink-700'    },
  digital:  { label: 'Digital',  emoji: '📱', color: 'bg-indigo-100 text-indigo-700' },
  food:     { label: 'Food',     emoji: '🍎', color: 'bg-green-100 text-green-700'  },
}



const RESOURCES = [
  { emoji: '📖', title: 'Comment écrire une description qui vend',  desc: 'Les 5 éléments d\'une fiche produit irrésistible pour le marché africain.' },
  { emoji: '🎯', title: '5 techniques pour booster vos ventes',     desc: 'Stratégies éprouvées par les top-vendeurs Yayyam pour multiplier leur CA.' },
  { emoji: '📸', title: 'Guide photo produit avec un smartphone',   desc: 'Prendre des photos professionnelles avec votre téléphone en 10 minutes.' },
  { emoji: '💡', title: 'Utiliser WhatsApp Business pour vendre',   desc: 'Catalogue, réponses automatiques et statuts : guide complet.' },
  { emoji: '📊', title: 'Comprendre vos analytics Yayyam',         desc: 'Lire vos statistiques et prendre les bonnes décisions pour votre boutique.' },
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

function StoreAvatar({ name, logo, size = 'md', className = '' }: { name: string; logo: string | null; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 md:w-24 md:h-24 text-2xl md:text-3xl' }
  if (logo) {
    return (
      <div className={`relative ${sizes[size]} rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm ${className}`}>
        <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          src={logo} alt={name}
          fill
          unoptimized
          className="object-cover"
        />
      </div>
    )
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-[#0DE0A1] to-[#0F7A60] flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm ${className}`}
    >
      <span className="font-black text-white drop-shadow-sm">{getInitial(name)}</span>
    </div>
  )
}

// ─── Composant PostCard ───────────────────────────────────────────────────────

interface PostCardProps {
  post:      PostItem
  currentStoreId: string
  onLike:    (postId: string) => void
  onDelete?: (postId: string) => void
}

function PostCard({ post, currentStoreId, onLike, onDelete }: PostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [commentsOpen, setCommentsOpen]   = useState(false)
  const [comments,     setComments]       = useState<CommentItem[]>([])
  const [commentsLoad, setCommentsLoad]   = useState(false)
  const [newComment,   setNewComment]     = useState('')
  const [submitting,   setSubmitting]     = useState(false)
  const [isDeleting,   setIsDeleting]     = useState(false)
  const [isPulsing,    setIsPulsing]      = useState(false)
  const [exporting,    setExporting]      = useState(false)

  const handleLikeClick = () => {
    onLike(post.id)
    if (!post.user_liked) {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), 400)
    }
  }

  const exportAsImage = async () => {
    if (!cardRef.current || exporting) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `yayyam-success-${post.id}.png`
      link.href = imgData
      link.click()
    } catch(err) {
      console.error(err)
      toast.error("Erreur lors de l'export de l'image.")
    } finally {
      setExporting(false)
    }
  }

  const cat = CATEGORY_LABELS[post.category] ?? CATEGORY_LABELS['general']
  const isMyPost = post.store_id === currentStoreId

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

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return
    // eslint-disable-next-line no-alert
    if (!confirm('Voulez-vous vraiment supprimer cette publication ?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/community/posts/${post.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(post.id)
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isDeleting) return null; // Hide optimistically

  return (
    <article ref={cardRef} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-[0_8px_30px_rgb(15,122,96,0.06)] hover:-translate-y-1 hover:border-[#0DE0A1]/30 transition-all duration-300 group/card relative">
      {/* ── Header ── */}
      <div className="flex items-start gap-4 p-6 pb-4">
        <StoreAvatar name={post.store_name} logo={post.store_logo} size="lg" />
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-extrabold tracking-tight text-base text-slate-900 truncate hover:text-[#0F7A60] transition-colors cursor-pointer">{post.store_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg ${cat.color}`}>
                  {cat.emoji} {cat.label}
                </span>
                <span className="text-xs text-slate-400 font-medium">{timeAgo(post.created_at)}</span>
              </div>
            </div>
            
            {/* Owner Actions */}
            {isMyPost && (
              <button
                onClick={handleDelete}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover/card:opacity-100 focus:opacity-100"
                title="Supprimer la publication"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="px-5 pb-4 pt-1">
        <p className="text-[15px] font-medium text-slate-700 leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      {/* ── Image ── */}
      {post.image_url && (
        <div className="px-5 pb-4">
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group/img">
            <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              src={post.image_url} alt="Image du post"
              width={800} height={600}
              unoptimized
              className="w-full h-auto max-h-80 object-cover group-hover/img:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-6 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={handleLikeClick}
          className={`flex items-center gap-2 text-[13px] font-black transition-all duration-300 group/like ${
            post.user_liked ? 'text-red-500' : 'text-slate-500 hover:text-red-400'
          }`}
        >
          <div className={`p-1.5 rounded-full transition-all duration-300 ${post.user_liked ? 'bg-red-50 text-red-500' : 'bg-white border border-slate-200 text-slate-400 group-hover/like:border-red-200'} ${isPulsing ? 'scale-[1.6] rotate-12 drop-shadow-lg' : 'scale-100'}`}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill={post.user_liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={post.user_liked ? "scale-110" : ""}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <span>{post.likes_count} J'aime</span>
        </button>

        <button
          onClick={loadComments}
          className="flex items-center gap-2 text-[13px] font-black text-slate-500 hover:text-emerald-600 transition-colors group/comment"
        >
          <div className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-400 group-hover/comment:border-emerald-200 group-hover/comment:text-emerald-500 transition-colors">
            <MessageSquare size={18} strokeWidth={2.5} />
          </div>
          <span className="hidden sm:inline">{post.comments_count} Commentaires</span>
          <span className="inline sm:hidden">{post.comments_count}</span>
        </button>

        {post.category === 'success' && (
          <button
            onClick={exportAsImage}
            disabled={exporting}
            className="flex items-center gap-2 text-[12px] font-black text-amber-500 hover:text-amber-600 transition-all ml-auto group/export shadow-sm hover:shadow active:scale-95 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200"
          >
            <div className={`${exporting ? 'animate-pulse' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
            <span className="hidden sm:inline">{exporting ? 'Export...' : 'Partager !'}</span>
          </button>
        )}
      </div>

      {/* ── Commentaires ── */}
      {commentsOpen && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {commentsLoad ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="mx-auto text-slate-300 mb-2" size={24} />
              <p className="text-sm font-bold text-slate-500">Aucun commentaire</p>
              <p className="text-xs text-slate-400">Lancez la discussion !</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <StoreAvatar name={c.store_name} logo={c.store_logo} size="md" />
                  <div className="flex-1 bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-sm relative group/c">
                    <p className="text-xs font-black text-[#1A1A1A] mb-1">{c.store_name}</p>
                    <p className="text-[13px] text-slate-700 leading-snug">{c.content}</p>
                    <span className="text-xs font-bold text-slate-400 mt-2 block">{timeAgo(c.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input commentaire */}
          <div className="flex items-start gap-3 pt-2">
            <StoreAvatar name={currentStoreId} logo={null} size="md" />
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
                }}
                placeholder="Rédigez votre réponse…"
                maxLength={500}
                rows={1}
                className="w-full text-[13px] font-medium border border-slate-300 rounded-2xl pl-4 pr-12 py-3 outline-none
                  focus:border-[#0F7A60] focus:ring-4 focus:ring-[#0DE0A1]/10 transition-all bg-white min-h-[44px] resize-none"
              />
              <button
                onClick={submitComment}
                disabled={!newComment.trim() || submitting}
                className="absolute right-2 top-2 p-1.5 bg-[#0F7A60] text-white font-black rounded-xl
                  disabled:opacity-0 hover:bg-emerald-700 hover:scale-105 transition-all shadow-md shadow-emerald-900/20"
              >
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
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
  initialTab,
}: CommunautesClientProps) {

  // ── État global ─────────────────────────────────────────────────────────────
  const [posts,        setPosts]        = useState<PostItem[]>(initialPosts)
  const [leaderboard,  setLeaderboard]  = useState<LeaderboardEntry[]>(initialLeaderboard)
  const [activeTab,    setActiveTab]    = useState<TabId>(initialTab || 'feed')
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
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col w-full">

      {/* ── MOBILE HEADER & TABS ── */}
      <div className="xl:hidden bg-white/90 backdrop-blur-xl px-6 py-4 border-b border-slate-100/50 z-20 relative">
        <div className="flex items-center justify-between gap-4">
           <div>
             <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Communauté 🌍</h1>
             <p className="text-xs text-slate-500 font-medium mt-0.5">Partagez, apprenez, vendez.</p>
           </div>
           <StoreAvatar name={store.name} logo={store.logo_url} size="md" />
        </div>
      </div>
      <div className="xl:hidden bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30 pb-2 pt-2 shadow-sm">
        <div className="px-4 flex gap-2 overflow-x-auto custom-scrollbar">
          {([
            { id: 'feed',       label: 'Le Mur',      emoji: '📰' },
            { id: 'classement', label: 'Classement',  emoji: '🏆' },
            { id: 'groupes',    label: 'Groupes VIP', emoji: '💬' },
            { id: 'ressources', label: 'Ressources',  emoji: '🎓' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-black whitespace-nowrap rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0F7A60] text-white shadow-md'
                  : 'bg-slate-50 text-slate-500 hover:text-[#1A1A1A] hover:bg-slate-100'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── HERO BANNER IMMERSIF (Pleine Largeur - Version Claire) ── */}
      <div className="hidden xl:block relative bg-white w-full pt-10 pb-16 lg:pt-14 lg:pb-20 overflow-hidden border-b border-slate-200 shrink-0 shadow-sm">
         <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-50/50 to-transparent"></div>
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0DE0A1]/10 rounded-full blur-[100px] pointer-events-none"></div>
         <div className="absolute top-1/2 -left-20 w-72 h-72 bg-[#0F7A60]/5 rounded-full blur-[80px] pointer-events-none"></div>

         <div className="max-w-[1600px] px-6 lg:px-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5 lg:gap-6">
               <div className="relative group cursor-pointer hidden sm:block">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#0DE0A1] to-[#0F7A60] rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                 <StoreAvatar name={store.name} logo={store.logo_url} size="xl" className="border-[4px] border-white shadow-lg relative z-10" />
               </div>
               <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-3 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#0DE0A1] animate-[pulse_2s_infinite]"></span>
                    <span className="text-xs uppercase font-bold tracking-widest text-[#0F7A60]">En ligne</span>
                 </div>
                 <h1 className="text-3xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight">Centre des Vendeurs</h1>
                 <p className="text-slate-500 font-medium mt-2 text-sm lg:text-[15px] leading-relaxed max-w-lg">Plongez dans l'écosystème, trouvez l'inspiration et dominez vos ventes avec la communauté. 🔥</p>
               </div>
            </div>

            {/* Quick Stats in Header */}
            <div className="hidden xl:flex gap-4">
              <div className="bg-white border border-slate-200 backdrop-blur-md rounded-2xl p-4 min-w-[130px] flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow duration-300">
                 <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Impact Vendeur</p>
                 <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Élite 🚀</p> 
                 <p className="text-xs text-[#0F7A60] font-bold mt-1">+12% ce mois</p>
              </div>
            </div>
         </div>
      </div>

      {/* ── ZONE INFERIEURE (Sidebar + Contenu) ── */}
      <div className="flex-1 flex items-stretch w-full overflow-hidden">
         
         {/* ════════════════════════════════════════════════════════════
             COLONNE 1: NAVIGATION LATERALE (Secondary Sidebar - Desktop)
             ════════════════════════════════════════════════════════════ */}
         <div className="hidden xl:flex flex-col w-[280px] flex-shrink-0 sticky top-0 h-screen bg-white border-r border-slate-200 pt-8 pb-8 px-5 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-20 overflow-y-auto custom-scrollbar">
            
            <div className="mb-6 px-2">
               <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">Navigation</h2>
               <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Hub Social Yayyam</p>
            </div>

            {/* Menu */}
            <nav className="flex flex-col gap-2 flex-1">
               {([
                   { id: 'feed',       label: 'Le Mur',      emoji: '🗞️' },
                   { id: 'classement', label: 'Classement',  emoji: '🏆' },
                   { id: 'groupes',    label: 'Groupes VIP', emoji: '💬' },
                   { id: 'ressources', label: 'Ressources',  emoji: '🎓' },
               ] as const).map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-left border ${
                       activeTab === tab.id
                         ? 'bg-[#0F7A60] text-white border-[#0F7A60] shadow-xl shadow-emerald-900/10 scale-105 ml-2'
                         : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'
                     }`}
                   >
                     <span className={`text-xl transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 drop-shadow-md' : 'opacity-80'}`}>{tab.emoji}</span>
                     <div className="font-black text-[14px]">{tab.label}</div>
                   </button>
               ))}
            </nav>
            
            {/* Bouton d'action bonus (Parrainage) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
               <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
                  <span className="text-3xl mb-2 drop-shadow-sm hover:scale-110 transition-transform">🎁</span>
                  <p className="text-xs font-bold text-slate-700 mb-3">Parrainez un vendeur et gagnez de l'argent !</p>
                  <Link href="/dashboard/affilies" className="text-[13px] font-extrabold tracking-wide text-white bg-gradient-to-r from-[#0F7A60] to-emerald-600 hover:to-[#0DE0A1] px-4 py-3 rounded-xl transition-all duration-300 w-full shadow-md shadow-emerald-900/10 hover:shadow-emerald-900/30">Programme Affilié</Link>
               </div>
            </div>
         </div>

         {/* ════════════════════════════════════════════════════════════
             ZONE PRINCIPALE (Feed + Widgets Droits)
             ════════════════════════════════════════════════════════════ */}
         <div className="flex-1 min-w-0 bg-[#FAFAF7] overflow-x-hidden p-4 md:p-6 lg:p-10 relative">
            <div className="max-w-[1200px] w-full mx-auto pb-16">
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
                 
                 {/* ── CONTENU CENTRAL ── */}
                 <div className="flex-1 min-w-0 w-full space-y-8">
            
            {/* ── ONGLET 1 — FEED ── */}
            {activeTab === 'feed' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Formulaire création post */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 relative overflow-hidden group focus-within:ring-4 focus-within:ring-[#0DE0A1]/20 transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0DE0A1]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-start gap-4">
                    <StoreAvatar name={store.name} logo={store.logo_url} size="lg" />
                    <div className="flex-1 space-y-4">
                      <textarea
                        value={postContent}
                        onChange={e => setPostContent(e.target.value)}
                        placeholder={`Une réussite à partager aujourd'hui, ${store.name} ?`}
                        maxLength={1000}
                        rows={3}
                        className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-[15px] outline-none
                          focus:bg-white focus:shadow-inner transition-all resize-none placeholder:text-slate-400 font-medium text-[#1A1A1A]"
                      />
                      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-50/50 p-2 pl-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <select
                            aria-label="Catégorie de post"
                            title="Catégorie de post"
                            value={postCategory}
                            onChange={e => setPostCategory(e.target.value)}
                            className="text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none
                              focus:border-[#0DE0A1] focus:ring-2 focus:ring-[#0DE0A1]/20 font-black text-slate-700 cursor-pointer bg-white transition-all hover:bg-slate-50 shadow-sm"
                          >
                            <option value="general">📣 Général</option>
                            <option value="question">❓ Question</option>
                            <option value="success">🏆 Succès</option>
                            <option value="tip">💡 Astuce</option>
                            <option value="mode">👗 Mode</option>
                            <option value="digital">📱 Digital</option>
                            <option value="food">🍎 Food</option>
                          </select>
                          <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                            {postContent.length}/1000
                          </span>
                        </div>
                        <button
                          onClick={publishPost}
                          disabled={!postContent.trim() || publishing}
                          className="px-6 py-3 bg-gradient-to-r from-[#0F7A60] to-emerald-600 text-white text-[13px] font-extrabold tracking-wide rounded-xl
                            disabled:opacity-50 disabled:cursor-not-allowed hover:to-[#0DE0A1]
                            transition-all duration-500 shadow-md shadow-emerald-900/10 hover:shadow-emerald-900/30 flex items-center gap-2 group/btn"
                        >
                          {publishing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />}
                          {publishing ? 'Publication…' : 'Publier'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtres catégories */}
                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                  {FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => loadFeed(f.id)}
                      className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black
                        border-2 transition-all duration-300 shadow-sm ${
                        activeFilter === f.id
                          ? 'bg-[#0F7A60] text-white shadow-md scale-105 border-transparent'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-[#0DE0A1]/50 hover:bg-emerald-50 hover:text-[#0F7A60]'
                      }`}
                    >
                      <span className="text-lg">{f.emoji}</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>

                {/* Posts */}
                {feedLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-3xl border border-slate-200 h-48 animate-pulse shadow-sm" />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center space-y-4 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <span className="text-4xl">📭</span>
                    </div>
                    <div>
                      <p className="font-black text-2xl text-[#1A1A1A]">Aucune publication</p>
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        Soyez le premier à briser la glace dans ce canal !
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    {/* 📌 POST ÉPINGLÉ OFFICIEL (Visible uniquement sur Mobile/Tablette) */}
                    <div className="xl:hidden bg-gradient-to-r from-emerald-500 to-[#0F7A60] rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden mb-2">
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <span className="text-8xl">📣</span>
                      </div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-md shadow-inner border border-white/10">
                           <span className="text-xl">⚡</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">Annonce Officielle</span>
                          </div>
                          <p className="font-medium text-[13px] leading-relaxed mb-4 text-emerald-50">
                            Bienvenue dans le nouveau <b>Hub Communautaire Yayyam !</b> Restez engagé, vendez plus, et connectez vos groupes Telegram pour notifier automatiquement vos membres. 🚀
                          </p>
                          <button className="text-xs font-black bg-white text-[#0F7A60] px-4 py-2 rounded-xl shadow-sm hover:scale-105 hover:shadow-md transition-all">
                            Voir les Nouveautés
                          </button>
                        </div>
                      </div>
                    </div>

                    {posts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentStoreId={store.id}
                        onLike={handleLike}
                        onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ONGLET 2 — CLASSEMENT ── */}
            {activeTab === 'classement' && (
              <div className="space-y-6 animate-in fade-in duration-500">
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

                {/* BARRE DE PROGRESSION - GAMIFICATION DU RANG (Affiche si on a les datas) */}
                {(!lbLoading && leaderboard.length > 0) && (() => {
                  const myEntry = leaderboard.find(e => e.store_id === store.id);
                  const rev = myEntry ? myEntry.total_revenue : 0;
                  const { current, next, emoji, threshold, gap } = getNextTierGamification(rev);
                  
                  if (!next) {
                    return (
                      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-6 text-white shadow-xl shadow-yellow-500/20 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-8xl opacity-20 pointer-events-none">👑</div>
                        <div className="relative z-10">
                          <h3 className="text-xl font-black mb-1">Vous êtes au sommet !</h3>
                          <p className="text-sm font-medium opacity-90">Statut Élite débloqué. Vous dominez le classement Yayyam.</p>
                        </div>
                      </div>
                    )
                  }

                  const progressPercent = Math.min(100, Math.max(0, (rev / (threshold as number)) * 100));

                  return (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-[#0DE0A1]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{emoji}</span>
                            <h3 className="text-lg font-black text-[#1A1A1A]">Niveau {current}</h3>
                          </div>
                          <p className="text-sm font-medium text-slate-500">
                            Plus que <span className="text-[#0F7A60] font-black">{Math.round(gap).toLocaleString('fr-FR')} FCFA</span> de ventes pour devenir <span className="font-black text-[#1A1A1A]">{next}</span> !
                          </p>
                        </div>
                        <div className="w-full md:w-1/3 flex-shrink-0">
                          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                            <span>Progression</span>
                            <span>{next}</span>
                          </div>
                          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                            <div 
                              className="h-full bg-gradient-to-r from-[#0DE0A1] to-[#0F7A60] rounded-full relative transition-all duration-1000 ease-out"
                              style={{ width: `${progressPercent}%` }}
                            >
                              <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

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
                    {/* Podium top 3 en mode 3D/Premium */}
                    {leaderboard.slice(0, 3).length > 0 && (
                      <div className="flex items-end justify-center gap-2 md:gap-6 mb-12 mt-8 px-2">
                        {(['🥈', '🥇', '🥉']).map((_medal, visualIdx) => {
                          const dataIdx = visualIdx === 1 ? 0 : visualIdx === 0 ? 1 : 2;
                          const entry = leaderboard[dataIdx]
                          
                          if (!entry) return <div key={visualIdx} className="w-1/3 max-w-[140px]" />
                          
                          const isMe = entry.store_id === store.id
                          const isFirst = dataIdx === 0
                          const isSecond = dataIdx === 1
                          
                          const heightClass = isFirst ? 'h-48 md:h-56' : isSecond ? 'h-36 md:h-44' : 'h-32 md:h-40'
                          
                          const themeClass = isFirst 
                            ? 'bg-gradient-to-t from-yellow-300 via-amber-100 to-white border-yellow-200 shadow-yellow-500/20' 
                            : isSecond 
                            ? 'bg-gradient-to-t from-slate-200 via-slate-50 to-white border-slate-200 shadow-slate-400/20'
                            : 'bg-gradient-to-t from-orange-200 via-orange-50 to-white border-orange-200 shadow-orange-500/20'

                          return (
                            <div key={entry.store_id} className="relative w-1/3 max-w-[150px] flex flex-col items-center group/podium">
                              {/* Crown for 1st */}
                              {isFirst && (
                                <div className="absolute -top-10 animate-bounce">
                                  <span className="text-4xl drop-shadow-md">👑</span>
                                </div>
                              )}
                              
                              {/* Avatar flottant */}
                              <div className={`absolute -top-6 transform transition-transform duration-500 group-hover/podium:-translate-y-2 z-10 ${isFirst ? 'scale-125 -top-8' : ''}`}>
                                <div className={`p-1 rounded-full bg-white shadow-lg ${isFirst ? 'ring-4 ring-yellow-400' : isSecond ? 'ring-2 ring-slate-300' : 'ring-2 ring-orange-300'}`}>
                                   <StoreAvatar name={entry.store_name} logo={entry.store_logo} size={isFirst ? "lg" : "md"} />
                                </div>
                              </div>

                              {/* Socle du podium */}
                              <div className={`w-full rounded-t-2xl border shadow-xl flex flex-col items-center justify-end pb-4 px-2 relative overflow-hidden transition-all duration-300 ${heightClass} ${themeClass} ${isMe ? 'ring-4 ring-[#0DE0A1]/50' : ''}`}>
                                 <div className="absolute inset-x-0 -top-12 h-24 bg-white/40 blur-xl transform -skew-y-12"></div>
                                 
                                 <div className="relative z-10 w-full text-center space-y-1">
                                   <p className="font-black text-xs md:text-sm text-[#1A1A1A] truncate w-full px-1">{entry.store_name}</p>
                                   <div className="flex justify-center">
                                     <span className="text-xs md:text-xs font-bold text-slate-600 bg-white/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                       {entry.level_emoji} {entry.level}
                                     </span>
                                   </div>
                                   <p className="text-xs md:text-sm font-black mt-2 text-[#1A1A1A]">
                                     {Math.round(entry.total_revenue).toLocaleString('fr-FR')} <span className="text-xs">F</span>
                                   </p>
                                   {isMe && <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs font-black text-white bg-[#0F7A60] px-2 py-0.5 rounded-full shadow-sm">Vous</span>}
                                 </div>
                                 
                                 <div className="absolute bottom-0 w-full h-1 bg-black/5"></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Positions 4-10 */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      {leaderboard.slice(3).map((entry, idx) => {
                        const isMe = entry.store_id === store.id
                        return (
                          <div
                            key={entry.store_id}
                            className={`p-4 md:p-5 flex items-center gap-4 transition-colors ${
                              idx !== leaderboard.slice(3).length - 1 ? 'border-b border-slate-100' : ''
                            } ${
                              isMe ? 'bg-[#0DE0A1]/5 relative' : 'hover:bg-slate-50'
                            }`}
                          >
                            {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0DE0A1]" />}
                            <span className="text-lg font-black text-slate-300 w-8 text-center flex-shrink-0">
                              {entry.rank}
                            </span>
                            <StoreAvatar name={entry.store_name} logo={entry.store_logo} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-black text-[15px] text-[#1A1A1A] truncate">{entry.store_name}</p>
                                {isMe && <span className="text-xs font-black text-white bg-[#0F7A60] px-2 py-0.5 rounded-full shadow-sm">Vous</span>}
                              </div>
                              <p className="text-[12px] font-medium text-slate-500">{entry.level_emoji} {entry.level} <span className="mx-1">•</span> {entry.order_count} ventes</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-black text-[15px] text-[#0F7A60]">
                                {Math.round(entry.total_revenue).toLocaleString('fr-FR')} F
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ONGLET 3 — GROUPES ── */}
            {activeTab === 'groupes' && (
              <div className="animate-in fade-in duration-500 bg-gradient-to-br from-[#0F7A60] to-emerald-900 rounded-3xl p-8 md:p-[5%] overflow-hidden shadow-2xl relative flex flex-col md:flex-row items-center gap-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#0DE0A1]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                
                <div className="relative z-10 md:w-1/2 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-inner">
                    <span className="text-xs font-bold text-white uppercase tracking-widest pl-1">Monétisation VIP</span>
                  </div>
                  <h2 className="text-3xl md:text-[40px] font-extrabold text-white tracking-tight leading-tight">
                    Gérez vos <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0DE0A1] to-emerald-400">Communautés Telegram</span>
                  </h2>
                  <p className="text-slate-300 font-medium text-[15px] leading-relaxed max-w-xl">
                    Connectez vos groupes et canaux Telegram à Yayyam. Automatisez les ajouts, gérez les expulsions expirées et vendez l'accès VIP à vos audiences en pilote automatique.
                  </p>
                  
                  <Link
                    href="/dashboard/telegram"
                    className="inline-flex items-center justify-center gap-3 bg-[#0DE0A1] hover:bg-emerald-400 text-[#0F7A60] px-8 py-3.5 rounded-2xl text-[15px] font-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 w-full sm:w-auto"
                  >
                    Accéder au Dashboard Telegram
                    <ArrowRight size={18} />
                  </Link>
                </div>

                <div className="relative z-10 md:w-1/2 w-full flex justify-center">
                   <div className="w-full max-w-[280px] aspect-square rounded-full border border-white/10 bg-white/5 backdrop-blur-3xl flex items-center justify-center shadow-xl relative">
                      <div className="absolute inset-4 rounded-full border border-white/5 bg-white/5 backdrop-blur-md"></div>
                      <div className="w-24 h-24 bg-gradient-to-tr from-[#0DE0A1] to-[#0F7A60] rounded-full flex items-center justify-center shadow-2xl z-10 animate-pulse">
                        <span className="text-4xl">✈️</span>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* ── ONGLET 4 — RESSOURCES ── */}
            {activeTab === 'ressources' && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div>
                  <h2 className="text-xl font-black text-[#1A1A1A]">🎓 Ressources & Guides</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Conseils pratiques pour développer votre activité en Afrique.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {RESOURCES.map((r, i) => (
                    <a
                      key={i}
                      href="/dashboard/tips"
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden
                        flex flex-col gap-4 hover:shadow-lg hover:border-[#0DE0A1] hover:-translate-y-1
                        transition-all duration-300 group/res relative"
                    >
                      {/* Effet fond brillant */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover/res:bg-emerald-500/10 transition-colors pointer-events-none" />
                      
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shadow-sm group-hover/res:scale-110 transition-transform duration-300">
                        {r.emoji}
                      </div>
                      
                      <div className="flex-1 min-w-0 relative z-10">
                        <p className="font-black text-lg text-[#1A1A1A] group-hover/res:text-[#0F7A60] transition-colors leading-tight mb-2">
                          {r.title}
                        </p>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">{r.desc}</p>
                      </div>
                      
                      <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Guide Yayyam</span>
                         <span className="w-8 h-8 rounded-full bg-emerald-50 text-[#0F7A60] flex items-center justify-center group-hover/res:bg-[#0F7A60] group-hover/res:text-white transition-colors">
                           <ChevronRight size={16} strokeWidth={3} />
                         </span>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-[#0DE0A1] to-[#0F7A60] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 mt-8 shadow-xl">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl border border-white/20 shrink-0 shadow-inner">
                    💡
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-lg font-black text-white">L'académie Yayyam s'agrandit</p>
                    <p className="text-sm text-slate-300 font-medium mt-1">
                      De nouveaux guides experts sont ajoutés chaque semaine. Restez à l'affût pour propulser vos ventes !
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ════════════════════════════════════════════════════════════
              COLONNE DROITE: WIDGETS LATERAUX (Desktop)
              ════════════════════════════════════════════════════════════ */}
          {(activeTab === 'feed' || activeTab === 'ressources' || activeTab === 'classement') && (
            <div className="hidden lg:flex flex-col gap-6 sticky top-8 h-max w-[300px] flex-shrink-0 z-10">
              
              {/* Widget 1: Annonce Officielle */}
              <div className="bg-gradient-to-r from-emerald-500 to-[#0F7A60] rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                  <span className="text-8xl">📣</span>
                </div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-md shadow-inner border border-white/10">
                     <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">Nouveauté</span>
                    </div>
                    <p className="font-medium text-[13px] leading-relaxed mb-4 text-emerald-50">
                      Bienvenue dans le nouveau <b>Hub Communautaire Yayyam !</b> Restez engagé, vendez plus, et connectez vos groupes Telegram pour notifier automatiquement vos membres. 🚀
                    </p>
                  </div>
                </div>
              </div>

              {/* Widget 2: Raccourci vers les Groupes */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 p-6 shadow-lg shadow-slate-200/30 overflow-hidden relative group hover:border-[#0DE0A1]/30 transition-colors duration-300">
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#0DE0A1]/10 rounded-full blur-2xl translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="font-extrabold tracking-tight text-slate-900 mb-2 flex items-center gap-2 relative z-10 text-lg">
                  <div className="p-2 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-100/50">
                     <MessageSquare size={16} className="text-[#0F7A60]"/>
                  </div>
                  Groupes VIP
                </h3>
                <p className="text-[13px] text-slate-500 font-medium mb-5 relative z-10 leading-relaxed">Monétisez vos canaux Telegram privés et automatisez vos expulsions en un clin d'œil.</p>
                <button
                  onClick={() => setActiveTab('groupes')}
                  className="w-full text-[13px] font-extrabold tracking-wide bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-[#0F7A60] hover:to-emerald-600 transition-all duration-500 py-3 rounded-xl border border-transparent shadow-md hover:shadow-xl hover:shadow-emerald-900/20 hover:-translate-y-0.5 relative z-10"
                >
                  Configurer mes accès VIP
                </button>
              </div>

            </div>
          )}

         </div>
       </div>
      </div>
     </div>
    </div>
  )
}
