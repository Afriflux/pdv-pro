import { NextResponse } from 'next/server'

/**
 * Vérifie si la requête contient le secret CRON_SECRET valide 
 * dans le header Authorization: Bearer <secret>
 */
export function verifyCronSecret(req: Request): boolean {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.split(' ')[1]
  const secret = process.env.CRON_SECRET

  // Si le secret n'est pas configuré, on bloque par sécurité
  if (!secret) {
    console.error('[CRON] CRON_SECRET is not defined in environment variables')
    return false
  }

  return token === secret
}

/**
 * Retourne une réponse JSON standard pour les crons
 */
export function cronResponse(data: Record<string, number | string | boolean>, status = 200) {
  return NextResponse.json(
    { 
      success: status === 200,
      timestamp: new Date().toISOString(),
      ...data 
    }, 
    { status }
  )
}

/**
 * Calcule si une date est plus ancienne qu'un certain nombre d'heures
 */
export function isOlderThan(date: string | Date, hours: number): boolean {
  const targetDate = new Date(date).getTime()
  const now = new Date().getTime()
  const threshold = hours * 60 * 60 * 1000
  
  return (now - targetDate) > threshold
}
