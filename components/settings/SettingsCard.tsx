import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: {
    text: string
    buttonText?: string
    loading?: boolean
    disabled?: boolean
  }
  onSubmit?: (e: React.FormEvent) => void
  id?: string
  warning?: boolean
}

export function SettingsCard({ title, description, children, footer, onSubmit, id, warning }: SettingsCardProps) {
  return (
    <motion.form 
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(e);
      }}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={`bg-white/60 backdrop-blur-3xl rounded-[2rem] border ${warning ? 'border-red-200 shadow-red-500/5' : 'border-white shadow-[0_8px_40px_rgb(0,0,0,0.04)]'} p-8 sm:p-12 relative overflow-hidden transition-all duration-500 group hover:shadow-[0_12px_50px_rgb(0,0,0,0.08)]`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/50 to-transparent pointer-events-none" />
      <div className="space-y-3 relative z-10 pb-8 border-b-2 border-white/50">
        <h3 className={`text-[1.5rem] font-black tracking-tight ${warning ? 'text-red-600' : 'text-gray-900 bg-clip-text'}`}>{title}</h3>
        {description && <p className="text-[15px] font-medium text-gray-500 leading-relaxed max-w-2xl">{description}</p>}
      </div>

      <div className="space-y-8 pt-8 relative z-10 w-full">
        {children}
      </div>

      {footer && (
        <div className="mt-12 pt-8 border-t-2 border-white/50 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center sm:text-left">{footer.text}</p>
          {footer.buttonText && (
            <button
              disabled={footer.disabled || footer.loading}
              type="submit"
              className={`shrink-0 w-full sm:w-auto px-10 py-3.5 rounded-[1.2rem] font-black text-sm transition-all focus:ring-4 focus:ring-offset-0 flex items-center justify-center gap-2
                ${warning 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500/20' 
                  : 'bg-[#0F7A60] hover:bg-[#0b5f4a] text-white focus:ring-[#0F7A60]/20 shadow-[0_8px_20px_rgb(15,122,96,0.25)] hover:shadow-[0_12px_25px_rgb(15,122,96,0.35)] hover:-translate-y-1'
                }
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-sm`}
            >
               {footer.loading && <Loader2 size={18} className="animate-spin" />}
               {footer.buttonText}
             </button>
           )}
         </div>
       )}
    </motion.form>
  )
}
