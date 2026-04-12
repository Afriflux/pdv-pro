// ─── lib/rate-limit.ts ──────────────────────────────────────────────────────
// Rate Limiting via Upstash Redis (compatible Netlify, Vercel, Edge)
// Remplace l'ancien Vercel KV par @upstash/ratelimit + @upstash/redis
// ─────────────────────────────────────────────────────────────────────────────

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Singleton du rate limiter ────────────────────────────────────────────────
// Initialisation paresseuse : on ne crée l'instance que si les env vars existent

let _ratelimit: Ratelimit | null = null
let _checked = false

function getRateLimiter(): Ratelimit | null {
  if (_checked) return _ratelimit

  _checked = true

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Rate Limit] Upstash Redis non configuré — rate limiting désactivé (mode passant).')
    return null
  }

  _ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    // Sliding window : 5 requêtes par minute par IP (configurable)
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: true,
    prefix: 'yayyam:ratelimit',
  })

  return _ratelimit
}

// ── Fonction publique ────────────────────────────────────────────────────────
// Rétro-compatible avec l'ancienne API getRateLimitStatus()

export async function getRateLimitStatus(
  ip: string,
  limit: number = 5,
  windowMs: number = 60000
): Promise<{ success: boolean; error?: string }> {
  try {
    const rl = getRateLimiter()

    // Si Upstash n'est pas configuré → mode passant (fail-open)
    if (!rl) {
      return { success: true }
    }

    // Créer un limiter dynamique si les params diffèrent du défaut
    const windowSec = Math.floor(windowMs / 1000)
    let limiter = rl

    if (limit !== 5 || windowSec !== 60) {
      // Rate limiter personnalisé pour cette route
      limiter = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
        analytics: true,
        prefix: `yayyam:ratelimit:${limit}:${windowSec}`,
      })
    }

    const { success, remaining } = await limiter.limit(ip)

    if (!success) {
      console.warn(`[Rate Limit] IP ${ip} bloquée (${remaining} restantes)`)
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error('[Rate Limit] Upstash error:', error)
    // En cas de panne Redis, on laisse passer la requête (fail-open)
    return { success: true, error: (error as Error).message }
  }
}
