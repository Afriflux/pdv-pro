'use client'

import { useEffect, useState } from 'react'

function useCountUp(end: number, start: number = 0, duration: number = 2000) {
  const [count, setCount] = useState(start)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = timestamp - startTime
      const percentage = Math.min(progress / duration, 1)
      
      const ease = 1 - Math.pow(1 - percentage, 4)
      setCount(Math.floor(start + (end - start) * ease))

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(step)
      } else {
        setCount(end)
      }
    }

    animationFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, start, duration])

  return count
}

export function HeroStats() {
  const stat1 = useCountUp(1, 10, 2000)
  const stat2 = useCountUp(0, 50000, 2500)
  const stat3Start = useCountUp(8, 0, 1500)
  const stat3End = useCountUp(5, 0, 1500)

  return (
    <div className="pt-16 max-w-4xl mx-auto border-t border-line mt-16 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
      <div className="flex flex-col items-center text-center gap-2 min-w-[140px]">
        <div className="font-display font-black text-4xl text-dust">J-{stat1}</div>
        <div className="text-sm font-bold text-slate uppercase tracking-wider">Votre boutique<br/>est en ligne</div>
      </div>
      <div className="h-10 w-px bg-line hidden md:block"></div>
      <div className="flex flex-col items-center text-center gap-2 min-w-[200px]">
        <div className="font-display font-black text-4xl text-dust">{stat2} F</div>
        <div className="text-sm font-bold text-slate uppercase tracking-wider">d&apos;abonnement<br/>pour démarrer</div>
      </div>
      <div className="h-10 w-px bg-line hidden md:block"></div>
      <div className="flex flex-col items-center text-center gap-2 min-w-[200px]">
        <div className="font-display font-black text-4xl text-dust">{stat3Start}% &rarr; {stat3End}%</div>
        <div className="text-sm font-bold text-slate uppercase tracking-wider">commission<br/>selon votre CA</div>
      </div>
    </div>
  )
}
