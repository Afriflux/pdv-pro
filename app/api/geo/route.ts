import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = headers()
  
  // Detection via les headers standards CDN (Vercel, Cloudflare, Netlify)
  const country = 
    headersList.get('x-vercel-ip-country') || 
    headersList.get('cf-ipcountry') || 
    headersList.get('x-nf-client-connection-ip') || // Parfois Netlify met l'IP, mais un flag geo peut exister
    'ALL' // Fallback si local ou non détecté

  return NextResponse.json({ country })
}
