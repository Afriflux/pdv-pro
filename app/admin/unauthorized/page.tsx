import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF7] items-center justify-center p-6 w-full animate-in fade-in zoom-in-95 duration-500">
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 lg:p-10 text-center border border-gray-100 flex flex-col items-center relative overflow-hidden">
        
        {/* Glow red effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-[50px] pointer-events-none"></div>

        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-red-100 relative z-10">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2 relative z-10">Accès Restreint</h1>
        <p className="text-sm font-bold text-gray-500 mb-8 relative z-10">
          Désolé, votre rôle actuel ne vous donne pas les permissions nécessaires pour accéder à ce module de l'ERP Yayyam.
        </p>

        <div className="w-full bg-gray-50 rounded-2xl p-4 text-left border border-gray-100 mb-8 relative z-10">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Que faire ?</p>
          <p className="text-sm font-medium text-gray-600">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un <span className="font-bold text-gray-900">Super Admin</span> pour qu'il modifie vos droits dans la matrice de sécurité.
          </p>
        </div>

        <Link 
          href="/admin"
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-gray-900/20 active:scale-95 relative z-10"
        >
          <ArrowLeft size={18} />
          Retour au Dashboard
        </Link>
      </div>

    </div>
  )
}
