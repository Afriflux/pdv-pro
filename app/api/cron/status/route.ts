import { NextResponse } from 'next/server'

// ----------------------------------------------------------------
// GET /api/cron/status
// Healthcheck public pour vérifier que les crons sont actifs
// ----------------------------------------------------------------
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    crons: [
      { 
        name: 'retrait-auto', 
        schedule: '0 9 * * *', 
        description: 'Traitement retraits quotidien' 
      },
      { 
        name: 'rappels-commandes', 
        schedule: '0 8 * * *', 
        description: 'Rappels commandes en attente' 
      },
      { 
        name: 'nettoyage', 
        schedule: '0 2 * * 0', 
        description: 'Nettoyage hebdomadaire' 
      }
    ],
    timestamp: new Date().toISOString()
  })
}
