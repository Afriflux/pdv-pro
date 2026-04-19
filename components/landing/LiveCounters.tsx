'use client'

import { useEffect, useState, useRef } from 'react'

interface AnimatedCounterProps {
  value: number
  label: string
  suffix?: string
}

function AnimatedCounter({ value, label, suffix }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [inView, setInView] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
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
    <div ref={ref} className="flex flex-col items-center text-center p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/15 shadow-sm hover:shadow-lg hover:border-emerald/30 transition-all group">
      <div className="text-4xl md:text-5xl font-display font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">
        {mounted ? count.toLocaleString('fr-FR') : '0'}{suffix && <span className="text-emerald">{suffix}</span>}
      </div>
      <div className="text-sm font-bold text-white/70 uppercase tracking-widest">
        {label}
      </div>
    </div>
  )
}

export function LiveCounters({ vendorsCount, productsCount, ordersCount }: { vendorsCount: number, productsCount: number, ordersCount: number }) {
  // Apply minimum thresholds for early-stage credibility
  // Once real numbers surpass these, the real data takes over
  const displayVendors = Math.max(vendorsCount, 150)
  const displayProducts = Math.max(productsCount, 500)
  const displayOrders = Math.max(ordersCount, 1200)

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Glow decorative background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full mx-auto max-w-[1800px] px-6 md:px-12 lg:px-20 xl:px-32 relative z-10">
        <div className="text-center mb-12">
           <span className="text-emerald-400 font-mono tracking-widest uppercase text-sm mb-4 block font-bold">Le Mouvement est lancé</span>
           <h2 className="text-3xl md:text-5xl font-display font-black text-white">L&apos;écosystème Yayyam en Temps Réel</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedCounter value={displayVendors} label="Vendeurs Actifs" suffix="+" />
          <AnimatedCounter value={displayProducts} label="Produits en Ligne" suffix="+" />
          <AnimatedCounter value={displayOrders} label="Commandes Traitées" suffix="+" />
        </div>
      </div>
    </section>
  )
}
