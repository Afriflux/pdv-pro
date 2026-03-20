'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    const supabase = createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('success')
      setMessage("Un email contenant un lien de réinitialisation vous a été envoyé.")
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center font-body bg-cream p-4">
      {/* Bouton retour */}
      <Link href="/login" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-slate hover:text-emerald transition-colors group">
        <span className="w-8 h-8 rounded-full border border-line bg-white flex items-center justify-center group-hover:border-emerald/30 group-hover:bg-emerald/5 transition-colors shadow-sm">
          <ArrowLeft size={16} />
        </span>
        <span className="font-medium hidden sm:inline">Retour à la connexion</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-ink/5 p-8 md:p-10 border border-line">
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-3xl text-ink mb-2">Mot de passe oublié</h1>
          <p className="text-slate text-sm font-light">Entrez votre email pour recevoir un lien de réinitialisation.</p>
        </div>

        {status === 'success' ? (
          <div className="bg-emerald/10 border border-emerald/20 text-emerald-rich rounded-2xl p-6 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald" />
            <p className="font-medium text-sm leading-relaxed">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {message}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">Adresse Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dust">
                   <Mail size={18} />
                </div>
                <input
                  id="email" type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-cream border border-line text-ink placeholder:text-dust focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/15 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-emerald hover:bg-emerald-rich text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center shadow-md shadow-emerald/20 mt-6 disabled:opacity-50"
            >
              {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
