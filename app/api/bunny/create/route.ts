import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const title = body.title || 'Nouvelle vidéo'

    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID
    const apiKey = process.env.BUNNY_API_KEY // MUST be server-side only!

    if (!libraryId || !apiKey) {
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    // 1. Créer la vidéo vide sur Bunny Stream
    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ title }),
      cache: 'no-store'
    })

    if (!createRes.ok) {
      const errorText = await createRes.text()
      console.error('[Bunny API Error]', errorText)
      return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
    }

    const videoData = await createRes.json()
    const videoId = videoData.guid

    // 2. Générer la signature TUS (Authentication by Signature)
    // Format: sha256(library_id + api_key + expiration_time + video_id)
    const expirationTime = Math.floor(Date.now() / 1000) + 3600 // Expire dans 1 heure
    
    const stringToSign = `${libraryId}${apiKey}${expirationTime}${videoId}`
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex')

    // 3. Retourner les informations au client
    return NextResponse.json({
      libraryId,
      videoId,
      signature,
      expirationTime,
      uploadEndpoint: 'https://video.bunnycdn.com/tusupload'
    })

  } catch (error) {
    console.error('[Bunny Create Upload Error]', error)
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 500 })
  }
}
