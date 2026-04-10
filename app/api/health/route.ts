import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRecentErrors } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health — Health-check endpoint
 * 
 * Vérifie la connectivité DB et retourne le statut de la plateforme.
 * Utile pour le monitoring externe (UptimeRobot, Vercel, etc.)
 */
export async function GET() {
  const start = Date.now()
  
  try {
    // Test de connectivité DB via une requête ultra-légère
    await prisma.$queryRaw`SELECT 1`
    
    const latency = Date.now() - start
    const errors = getRecentErrors()
    
    return NextResponse.json({
      status: 'ok',
      version: '1.0.0',
      platform: 'Yayyam ERP',
      db: 'connected',
      latency_ms: latency,
      recent_errors: errors.length,
      last_errors: errors.slice(-5),
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error: unknown) {
    const latency = Date.now() - start
    console.error('[Health Check] DB connection failed:', error)
    
    return NextResponse.json({
      status: 'degraded',
      version: '1.0.0',
      platform: 'Yayyam ERP',
      db: 'disconnected',
      latency_ms: latency,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
