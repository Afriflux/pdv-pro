'use client'

import { useEffect, useState, useRef } from 'react'

interface AnimatedCounterProps {
  value: number
  label: string
}

function AnimatedCounter({ value, label }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return

    let start = 0
    const duration = 2000 // 2 seconds
    const increment = Math.max(1, Math.ceil(value / (duration / 16))) // 60fps

    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <div ref={ref} className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-line shadow-sm hover:shadow-lg hover:border-emerald/30 transition-all">
      <div className="text-4xl md:text-5xl font-display font-black text-ink mb-2">
        {count.toLocaleString('fr-FR')}
      </div>
      <div className="text-sm font-bold text-slate uppercase tracking-widest">
        {label}
      </div>
    </div>
  )
}

export function LiveCounters({ vendorsCount, productsCount, ordersCount }: { vendorsCount: number, productsCount: number, ordersCount: number }) {
  return (
    <section className="py-24 bg-pearl border-t border-line relative overflow-hidden">
      {/* Glow decorative background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-emerald/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
           <span className="text-emerald font-mono tracking-widest uppercase text-sm mb-4 block font-bold">Le Mouvement est lancé</span>
           <h2 className="text-3xl md:text-5xl font-display font-black text-ink">L'écosystème Yayyam en Temps Réel</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedCounter value={vendorsCount} label="Vendeurs Inscrits" />
          <AnimatedCounter value={productsCount} label="Produits en Ligne" />
          <AnimatedCounter value={ordersCount} label="Commandes Traitées" />
        </div>
      </div>
    </section>
  )
}
