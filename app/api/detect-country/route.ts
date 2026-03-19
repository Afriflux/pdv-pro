import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Fonction utilitaire pour convertir le code ISO (ex: 'SN') en emoji drapeau
function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return '🏳️'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(c => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export async function GET(req: Request) {
  try {
    const forwarded = req.headers.get('x-forwarded-for')
    // Prendre la première IP si y'en a plusieurs, ou fallback sur 127.0.0.1
    const ip = forwarded?.split(',')[0] ?? '127.0.0.1'

    // En local (dev), on retourne le Sénégal par défaut
    if (ip === '127.0.0.1' || ip === '::1') {
      return NextResponse.json({
        country_code: 'SN',
        calling_code: '221',
        flag: '🇸🇳'
      })
    }

    // Appel à l'API publique (effectué côté serveur, donc pas de blocage CORS)
    const res = await fetch(`https://ipapi.co/${ip}/json/`)
    
    if (!res.ok) {
        throw new Error(`API failed with status ${res.status}`)
    }

    const data = await res.json()

    // Si on a bien récupéré le pays
    if (data && data.country_code) {
      return NextResponse.json({
        country_code: data.country_code,
        // On récupère le code (ex: "+221") et on enlève le '+' pour retourner juste "221" 
        // ou on le laisse, on adapte selon ce que PhoneInput attend. PhoneInput s'attend
        // déjà au préfixe "+", mais on renvoie comme demandé par l'exercice "221".
        calling_code: data.country_calling_code?.replace('+', ''),
        flag: getFlagEmoji(data.country_code)
      })
    }

    throw new Error('No country code in response')
  } catch (error) {
    console.error('[API/detect-country] Error fetching IP:', error)
    
    // Fallback par défaut sur le Sénégal en cas de crash
    return NextResponse.json({
      country_code: 'SN',
      calling_code: '221',
      flag: '🇸🇳'
    })
  }
}
