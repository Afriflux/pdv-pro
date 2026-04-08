// Client Supabase côté serveur (Server Components, Route Handlers, Server Actions)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Mise en cache globale de la requête utilisateur pour éviter le N+1 (layout + page + api)
const getCachedUser = cache(async () => {
  const cookieStore = cookies()
  const tempClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignored
          }
        },
      },
    }
  )
  return await tempClient.auth.getUser()
})

export async function createClient() {
  const cookieStore = cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll appelé depuis un Server Component — ignoré
          }
        },
      },
    }
  )

  // Surcharge transparente de la méthode getUser pour utiliser le cache React
  const originalGetUser = client.auth.getUser.bind(client.auth)
  client.auth.getUser = async (jwt?: string) => {
    // Si un jeton explicite est fourni, on ne met pas en cache
    if (jwt) {
      return originalGetUser(jwt)
    }
    return getCachedUser()
  }

  return client
}
