'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LiveNotificationListener() {
  const [userId, setUserId] = useState<string | null>(null)
  
  useEffect(() => {
    const supabase = createClient()
    
    // Obtenir l'utilisateur connecté initialement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null)
    })

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    
    // On écoute les INSERTions sur la table Notification pour cet utilisateur précis
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notification',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotif = payload.new as any
          
          // Jouer le fameux "Cha-Ching"
          // URL publique libre de droits utilisée comme default (Cash register sound)
          const audio = new Audio('https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3') // ou un standard coin sound.  Utilisé "Cash register"
          audio.volume = 0.5
          // Navigateur peut bloquer l'autoplay si l'utilisateur n'a pas interagi avec la page. On gère silencieusement l'erreur.
          audio.play().catch(e => console.warn("L'audio a été bloqué par le navigateur, l'utilisateur doit interagir avec la page en premier.", e))
          
          // Afficher la notification toast magnifique
          toast.success(newNotif.title || 'Nouvelle Notification !', {
            description: newNotif.message || '',
            duration: 8000,
            icon: newNotif.type === 'order' ? '💰' : '🔔',
            style: {
              background: '#0F7A60',
              color: 'white',
              border: 'none',
              fontWeight: '500'
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return null
}
