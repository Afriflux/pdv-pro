import { notFound }               from 'next/navigation'
import Link                        from 'next/link'
import { validateDigitalToken }    from '@/lib/digital/access'
import type { DigitalFile }        from '@/lib/digital/access'

// ─── Types locaux ──────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ token: string }>
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

const FILE_ICONS: Record<DigitalFile['type'], string> = {
  pdf:    '📄',
  audio:  '🎵',
  zip:    '📦',
  link:   '🔗',
  member: '👤',
  video:  '🎬',
}

const FILE_LABELS: Record<DigitalFile['type'], string> = {
  pdf:    'PDF',
  audio:  'Audio',
  zip:    'Archive ZIP',
  link:   'Lien externe',
  member: 'Espace membre',
  video:  'Vidéo',
}

const LICENSE_BADGES: Record<string, { emoji: string; label: string }> = {
  personal:   { emoji: '🔒', label: 'Usage personnel uniquement' },
  resell:     { emoji: '📤', label: 'Revente simple autorisée' },
  mrr:        { emoji: '💼', label: 'MRR — Droits de revente inclus' },
  plr:        { emoji: '✏️', label: 'PLR — Modifiable & revendable' },
  whitelabel: { emoji: '🏢', label: 'White-label — Rebrandable' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DigitalDeliveryPage({ params }: PageProps) {
  const { token } = await params
  const result    = await validateDigitalToken(token)

  // Token introuvable → 404
  if (result.status === 'not_found') notFound()

  // États d'erreur (révoqué, expiré, épuisé)
  // À ce stade result.status ∈ { 'ok', 'expired', 'exhausted', 'revoked' }
  if (result.status !== 'ok' || !result.access) {
    const errorStatus = result.status as 'expired' | 'exhausted' | 'revoked'
    return <ErrorPage status={errorStatus} />
  }

  const { access } = result
  const { order, product } = access

  const expiresDate     = access.expires_at ? new Date(access.expires_at) : null
  const remaining       = access.downloads_max !== null
    ? Math.max(0, access.downloads_max - access.downloads_used)
    : null
  const progressPct     = access.downloads_max
    ? Math.round(((access.downloads_max - (remaining ?? 0)) / access.downloads_max) * 100)
    : 0

  const licenceBadge    = product.license_type
    ? (LICENSE_BADGES[product.license_type] ?? null)
    : null

  const hasFiles        = (product.digital_files?.length ?? 0) > 0
  const videoFiles      = product.digital_files?.filter(f => f.type === 'video') ?? []
  const otherFiles      = product.digital_files?.filter(f => f.type !== 'video') ?? []

  return (
    <main className="min-h-screen bg-[#F0FDF4] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#D1FAE5]/40 via-transparent to-transparent flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#34D399]/20 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#10B981]/15 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-[420px] space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out z-10">

        {/* ── Header Yayyam ─────────────────────────────────────────── */}
        <div className="text-center space-y-0.5">
          <p className="text-2xl font-black text-[#0F7A60] tracking-tight">Yayyam</p>
          {order.store.name && (
            <p className="text-xs text-gray-400 font-medium">{order.store.name}</p>
          )}
        </div>

        {/* ── Card produit ──────────────────────────────────────────── */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-emerald-900/5 overflow-hidden border border-white/60 relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
          
          {product.images[0] && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
            </div>
          )}
          <div className="p-6 relative z-20 -mt-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-xl shadow-gray-200/50 border border-gray-100/50 shrink-0">
                <span className="text-2xl">📥</span>
              </div>
              <div className="pt-1">
                <h1 className="text-lg font-black text-[#1A1A1A] leading-tight font-display">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100/60">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Acheté par : <span className="text-[#0F7A60]">{order.buyer_name}</span></p>
            </div>
          </div>
        </div>

        {/* ── Quota & expiration ────────────────────────────────────── */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-lg shadow-gray-200/20 border border-white p-5 space-y-3">
          {remaining !== null && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Téléchargements restants
                </span>
                <span className="font-black text-gray-800 bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm">{remaining}/{access.downloads_max}</span>
              </div>
              <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0F7A60] to-[#34D399] transition-all duration-1000"
                  style={{ width: `${100 - progressPct}%` }}
                />
              </div>
            </>
          )}
          {remaining === null && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-100">
              <span className="text-emerald-500">✅</span>
              <p className="text-xs font-bold w-full text-center">Téléchargements illimités depuis ce lien.</p>
            </div>
          )}
          {expiresDate && (
            <div className="flex justify-center mt-2">
              <p className="inline-flex items-center gap-1.5 text-xs text-rose-500 font-bold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                ⏱️ Lien expire le {expiresDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
          {!expiresDate && remaining !== null && (
            <p className="text-xs text-gray-500 text-center font-medium mt-1">Lien valable <span className="font-bold text-gray-700">à vie</span>.</p>
          )}
        </div>

        {/* ── Lecteur vidéo Bunny ───────────────────────────────────── */}
        {videoFiles.map((vf) => (
          <div key={vf.bunny_video_id ?? vf.url} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 px-4 pt-3 pb-2 uppercase tracking-wide">
              🎬 Vidéo
            </p>
            {vf.bunny_video_id ? (
              <div className="aspect-video w-full">
                <iframe
                  src={`https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${vf.bunny_video_id}?autoplay=false&responsive=true`}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  title={vf.filename}
                />
              </div>
            ) : (
              <div className="px-4 pb-4">
                <a
                  href={`/api/dl/${token}?file=${encodeURIComponent(vf.url)}`}
                  className="flex items-center gap-2 text-sm text-[#0F7A60] font-semibold underline"
                >
                  🎬 {vf.filename || 'Voir la vidéo'}
                </a>
              </div>
            )}
          </div>
        ))}

        {/* ── Fichiers téléchargeables ──────────────────────────────── */}
        {otherFiles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            <p className="text-xs font-semibold text-gray-500 px-4 pt-3 pb-2 uppercase tracking-wide">
              Fichiers inclus
            </p>
            {otherFiles.map((file, idx) => (
              <FileRow key={idx} file={file} token={token} />
            ))}
          </div>
        )}

        {/* ── Bouton principal (si pas de multi-fichiers) ───────────── */}
        {!hasFiles && (
          <a
            href={`/api/dl/${token}`}
            className="flex items-center justify-center gap-3 w-full bg-[#0F7A60] hover:bg-[#0D5C4A] active:scale-95 text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-[#0F7A60]/20"
          >
            <span className="text-xl">⬇️</span>
            Télécharger maintenant
          </a>
        )}

        {/* ── Badge licence ─────────────────────────────────────────── */}
        {licenceBadge && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-start gap-3">
            <span className="text-xl">{licenceBadge.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">{licenceBadge.label}</p>
              {product.license_notes && (
                <p className="text-xs text-amber-600 mt-0.5">{product.license_notes}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Support & Accès Client ────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 p-6 flex flex-col items-center justify-center text-center shadow-lg shadow-gray-200/20 mt-4 space-y-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
            <span className="text-2xl">🔐</span>
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-sm">Ne perdez jamais vos accès</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-[250px] mx-auto leading-relaxed">
              Consultez tous vos achats à volonté (même si ce lien expire) via votre espace client gratuit.
            </p>
          </div>
          <Link href="/client" className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 active:scale-95">
            Ouvrir l'Espace Client
          </Link>
          <div className="w-full border-t border-gray-100 my-2"></div>
          <p className="text-xs text-gray-400">
            Un problème ?{' '}
            <a
              href={`https://wa.me/${order.buyer_phone.replace(/\D/g, '')}`}
              className="text-[#0F7A60] font-bold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contacter le vendeur
            </a>
          </p>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="text-center pb-4">
          <Link href="/" className="text-xs text-gray-300 hover:text-gray-400 transition">
            Propulsé par Yayyam 🚀
          </Link>
        </div>

      </div>
    </main>
  )
}

// ─── Composant FileRow ────────────────────────────────────────────────────────

function FileRow({ file, token }: { file: DigitalFile; token: string }) {
  const icon  = FILE_ICONS[file.type]
  const label = FILE_LABELS[file.type]

  // Lien externe ou espace membre → ouvre directement
  if (file.type === 'link' || file.type === 'member') {
    return (
      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {file.filename || label}
            </p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        </div>
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#0F7A60] bg-[#0F7A60]/10 px-3 py-1.5 rounded-lg hover:bg-[#0F7A60]/20 transition border border-[#0F7A60]/20"
        >
          Ouvrir →
        </a>
      </div>
    )
  }

  // Fichiers stockés → passe par /api/dl/[token] avec param file
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-700">
            {file.filename || label}
          </p>
          <p className="text-xs text-gray-400">
            {label}
            {file.size > 0 && ` · ${formatSize(file.size)}`}
          </p>
        </div>
      </div>
      <a
        href={`/api/dl/${token}?file=${encodeURIComponent(file.url)}`}
        className="text-xl text-gray-400 hover:text-[#0F7A60] transition px-2"
        title="Télécharger"
      >
        ⬇️
      </a>
    </div>
  )
}

// ─── Page d'erreur ────────────────────────────────────────────────────────────

function ErrorPage({ status }: { status: 'expired' | 'exhausted' | 'revoked' | 'not_found' }) {
  const configs = {
    expired: {
      emoji: '⏰',
      title: 'Lien expiré',
      message: 'Ce lien de téléchargement a expiré. Contactez le vendeur pour un nouveau lien.',
      color: 'red',
    },
    exhausted: {
      emoji: '🔒',
      title: 'Limite atteinte',
      message: 'Vous avez atteint le nombre maximum de téléchargements autorisés.',
      color: 'amber',
    },
    revoked: {
      emoji: '⛔',
      title: 'Accès révoqué',
      message: "Cet accès a été révoqué par le vendeur. Contactez-le pour plus d'informations.",
      color: 'red',
    },
    not_found: {
      emoji: '🔍',
      title: 'Lien invalide',
      message: "Ce lien de téléchargement n'existe pas ou a été supprimé.",
      color: 'gray',
    },
  }

  const cfg = configs[status] ?? configs.not_found

  return (
    <main className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <p className="text-2xl font-black text-[#0F7A60]">Yayyam</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-3">
          <p className="text-4xl">{cfg.emoji}</p>
          <p className="font-bold text-gray-800 text-lg">{cfg.title}</p>
          <p className="text-sm text-gray-500">{cfg.message}</p>
        </div>
        <div className="text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-500 transition">
            Propulsé par Yayyam 🚀
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1_048_576)  return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}
