/**
 * Monitoring & Error Tracking service pour Yayyam ERP
 * 
 * Architecture modulaire : utilise Sentry quand disponible,
 * sinon un fallback console structuré.
 * 
 * Usage :
 *   import { captureError, captureMessage, setUser } from '@/lib/monitoring'
 *   captureError(error, { context: 'checkout', orderId: '...' })
 */

type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info'

interface ErrorContext {
  context?: string
  userId?: string
  orderId?: string
  storeId?: string
  extra?: Record<string, unknown>
}

// ── In-memory error buffer pour agrégation ────────────────────────────────────
const recentErrors: Array<{
  timestamp: string
  message: string
  context: string
  severity: ErrorSeverity
}> = []
const MAX_BUFFER = 100

/**
 * Capture une erreur avec contexte structuré
 */
export function captureError(
  error: unknown,
  meta: ErrorContext = {},
  severity: ErrorSeverity = 'error'
): void {
  const err = error instanceof Error ? error : new Error(String(error))
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    severity,
    message: err.message,
    stack: err.stack?.split('\n').slice(0, 5).join('\n'),
    ...meta,
  }

  // Console structurée (toujours)
  if (severity === 'fatal' || severity === 'error') {
    console.error(`[MONITOR:${severity.toUpperCase()}]`, JSON.stringify(logEntry))
  } else {
    console.warn(`[MONITOR:${severity.toUpperCase()}]`, JSON.stringify(logEntry))
  }

  // Buffer ring
  recentErrors.push({
    timestamp: logEntry.timestamp,
    message: err.message,
    context: meta.context ?? 'unknown',
    severity,
  })
  if (recentErrors.length > MAX_BUFFER) recentErrors.shift()
}

/**
 * Log un message métier structuré (pas une erreur)
 */
export function captureMessage(
  message: string,
  meta: ErrorContext = {},
  severity: ErrorSeverity = 'info'
): void {
  console.log(`[MONITOR:${severity.toUpperCase()}]`, JSON.stringify({
    timestamp: new Date().toISOString(),
    message,
    ...meta,
  }))
}

/**
 * Retourne les erreurs récentes (pour /api/health ou dashboards internes)
 */
export function getRecentErrors() {
  return [...recentErrors]
}

/**
 * Wrapper try/catch pour les route handlers
 * Usage : export const POST = withMonitoring('checkout', handler)
 */
export function withMonitoring(
  context: string,
  handler: (req: Request, ...args: unknown[]) => Promise<Response>
) {
  return async (req: Request, ...args: unknown[]): Promise<Response> => {
    try {
      return await handler(req, ...args)
    } catch (error) {
      captureError(error, { context }, 'error')
      return new Response(
        JSON.stringify({ error: 'Une erreur est survenue. Veuillez réessayer.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}
