import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import { Download, PlayCircle, ArrowRight, BookOpen, Lock } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Ma Bibliothèque | Yayyam Client',
}

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer les accès digitaux liés aux commandes de l'utilisateur
  const dbDigitalAccesses = await prisma.digitalAccess.findMany({ take: 50, 
    where: {
      order: {
        buyer_id: user.id
      },
      revoked: false
    },
    include: {
      product: {
        include: {
          Course: true
        }
      },
      order: true
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  const digitalAccesses = dbDigitalAccesses || []

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)] pb-12">
      {/* 🌟 MESH BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAFAFA]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#0F7A60]/10 blur-[130px] pointer-events-none mix-blend-multiply" />
      </div>

      <div className="p-6 md:p-10 w-full max-w-[1600px] mx-auto z-10 relative animate-in fade-in duration-700">
        
        {/* === HEADER === */}
        <header className="bg-gradient-to-br from-[#0F7A60] via-[#0b5341] to-[#1A1A1A] border border-[#0F7A60]/50 rounded-[2.5rem] px-8 py-10 shadow-[0_10px_40px_rgba(15,122,96,0.3)] mb-10 w-full relative z-10 overflow-hidden text-white flex flex-col md:flex-row md:items-end justify-between gap-6 group">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#0F7A60]/20 blur-3xl rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.2rem] text-[#0F7A60] border border-white/10 shadow-lg">
               <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">Ma Bibliothèque</h1>
              <p className="text-gray-400 mt-1 font-medium">Continuez votre apprentissage. Formations vidéo et e-books.</p>
            </div>
          </div>
        </header>

        {/* === GRID LIBRARY === */}
        {digitalAccesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/60 mt-8">
             <div className="w-24 h-24 bg-gradient-to-br from-[#0F7A60]/10 to-transparent rounded-full flex items-center justify-center mb-6 relative">
               <div className="absolute inset-0 bg-[#0F7A60]/20 blur-xl rounded-full animate-pulse" />
               <BookOpen className="text-[#0F7A60] relative z-10 drop-shadow-md w-10 h-10" />
             </div>
            <h2 className="text-2xl font-black text-[#1A1A1A] mb-3 tracking-tight">Votre bibliothèque est vide</h2>
            <p className="text-gray-500 font-medium max-w-md">Vous n'avez pas encore acheté de produits numériques (formations, e-books) sur nos boutiques partenaires.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
            {(digitalAccesses || []).map((access) => {
              const product = access.product
              const image = product.images?.[0] || '/images/placeholder.webp'
              const course = product.Course;
              const isLMS = !!course; // La méthode LMS Yayyam Academy V2
              const isVideo = product.digital_link !== null || isLMS;
              const isExpired = access.expires_at && new Date(access.expires_at) < new Date()

              return (
                 <div key={access.id} className="group flex flex-col bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-[#0F7A60]/30 hover:shadow-xl hover:shadow-[#0F7A60]/10 hover:-translate-y-1 transition-all duration-300">
                   {/* COVER */}
                   <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                     <Image sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                       src={image} 
                       alt={product.name} 
                       fill 
                       className={`object-cover transition-transform duration-700 ${!isExpired && 'group-hover:scale-105'}`}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
                     
                     <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                       <span className={`px-3 py-1 backdrop-blur-md rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm flex items-center gap-1.5 ${isVideo ? 'bg-[#0F7A60]/80 border-[#0F7A60]/50 text-white' : 'bg-white/80 border-white/60 text-[#1A1A1A]'}`}>
                         {isVideo ? <PlayCircle size={14} /> : <Download size={14} />}
                         {isVideo ? 'Formation' : 'E-book'}
                       </span>
                     </div>

                     {isExpired && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                           <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-red-200 shadow-lg">
                             <Lock size={16} /> Expiré
                           </div>
                        </div>
                     )}
                   </div>
                   
                   {/* INFOS */}
                   <div className="p-6 flex flex-col flex-1">
                     <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] mb-2 line-clamp-2 leading-snug group-hover:text-[#0F7A60] transition-colors">{product.name}</h3>
                     <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
                       Acheté le {new Date(access.created_at).toLocaleDateString('fr-FR')}
                     </p>
  
                     <div className="mt-auto">
                       {isExpired ? (
                         <div className="w-full py-3.5 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-gray-100">
                           <Lock size={16} /> Accès verrouillé
                         </div>
                       ) : (
                          isLMS ? (
                            <Link href={`/client/library/${course.id}`} className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#0F7A60] text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm hover:shadow-[#0F7A60]/20 group/btn">
                              <PlayCircle size={18} />
                              Accéder au LMS
                              <ArrowRight size={16} className="opacity-0 -ml-4 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                            </Link>
                          ) : (
                            <a 
                              href={product.digital_link || product.digital_file_url || '#'}
                              target={product.digital_link ? "_blank" : "_self"}
                              className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#0F7A60] text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm hover:shadow-[#0F7A60]/20 group/btn"
                            >
                              {isVideo ? <PlayCircle size={18} /> : <Download size={18} />}
                              {isVideo ? 'Lire la vidéo' : 'Télécharger'}
                              <ArrowRight size={16} className="opacity-0 -ml-4 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                            </a>
                          )
                       )}
                     </div>
                   </div>
                 </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
