'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, Star, Image as ImageIcon } from 'lucide-react'

export default function UgcStudio({ storeName }: { storeName: string }) {
  const [customerName, setCustomerName] = useState('Aminata S.')
  const [review, setReview] = useState("Le service est impeccable, la livraison a été très rapide et le produit est exactement comme sur la photo ! Je recommande vivement cette boutique à 100%.")
  const [rating, setRating] = useState(5)
  const [themeColor, setThemeColor] = useState('#0F7A60') // Default Emerald
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Dimensions for Instagram Post (1080x1080)
    canvas.width = 1080
    canvas.height = 1080

    // 1. Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080)
    gradient.addColorStop(0, themeColor)
    
    // Create a lighter/darker version of the theme color for the gradient
    const hex = themeColor.replace('#', '')
    const r = parseInt(hex.substring(0,2), 16)
    const g = parseInt(hex.substring(2,4), 16)
    const b = parseInt(hex.substring(4,6), 16)
    gradient.addColorStop(1, `rgba(${Math.max(0, r-40)}, ${Math.max(0, g-40)}, ${Math.max(0, b-40)}, 1)`)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1080, 1080)

    // Add subtle grain/pattern (optional, simulate with light noise)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    for (let i = 0; i < 1000; i++) {
        ctx.beginPath()
        ctx.arc(Math.random() * 1080, Math.random() * 1080, Math.random() * 2, 0, Math.PI * 2)
        ctx.fill()
    }

    // 2. Draw Central Card (Glassmorphism effect)
    const cardWidth = 880
    const cardHeight = 600
    const cardX = 100
    const cardY = 240
    const cornerRadius = 40

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cornerRadius)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 50
    ctx.shadowOffsetY = 20
    ctx.fill()
    ctx.restore()

    // 3. Draw Stars
    ctx.fillStyle = '#FFB800' // Gold stars
    const starSize = 40
    const startX = cardX + 80
    let currentX = startX
    const starY = cardY + 100

    // Helper to draw a star
    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = Math.PI / 2 * 3
      let x = cx
      let y = cy
      const step = Math.PI / spikes

      ctx.beginPath()
      ctx.moveTo(cx, cy - outerRadius)
      for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius
          y = cy + Math.sin(rot) * outerRadius
          ctx.lineTo(x, y)
          rot += step
          x = cx + Math.cos(rot) * innerRadius
          y = cy + Math.sin(rot) * innerRadius
          ctx.lineTo(x, y)
          rot += step
      }
      ctx.lineTo(cx, cy - outerRadius)
      ctx.closePath()
      ctx.fill()
    }

    for(let i=0; i<5; i++) {
        if (i < rating) {
            ctx.fillStyle = '#FFB800'
        } else {
            ctx.fillStyle = '#E5E7EB'
        }
        drawStar(currentX, starY, 5, 20, 10)
        currentX += starSize + 15
    }

    // 4. Draw Quote
    ctx.fillStyle = '#1A1A1A'
    ctx.font = 'bold 50px Inter, sans-serif'
    
    // Text wrap function
    const wrapText = (context: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        context.fillText(line, x, currentY);
    }

    // Add quotes styling
    ctx.font = 'bold 120px Georgia, serif'
    ctx.fillStyle = `${themeColor}20` // 20% opacity of theme color
    ctx.fillText('"', startX - 20, starY + 120)

    ctx.fillStyle = '#1A1A1A'
    ctx.font = 'bold 44px Inter, sans-serif'
    wrapText(ctx, review, startX, starY + 140, cardWidth - 160, 65)

    // 5. Draw Customer Name
    ctx.fillStyle = '#6B7280'
    ctx.font = '500 36px Inter, sans-serif'
    ctx.fillText(`— ${customerName}`, startX, cardY + cardHeight - 80)

    // 6. Draw Store Name at the bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = 'bold 40px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(storeName, 540, 980)

    // Verified Badge logic (optional)
    ctx.fillStyle = '#E5F6EB'
    ctx.beginPath()
    ctx.roundRect(startX + 300, cardY + cardHeight - 110, 240, 45, 20)
    ctx.fill()
    ctx.fillStyle = '#0F7A60'
    ctx.font = 'bold 20px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('✓ Achat vérifié', startX + 330, cardY + cardHeight - 80)
    
    // Reset align
    ctx.textAlign = 'left'
  }

  // Redraw when inputs change
  useEffect(() => {
    // Small delay to ensure fonts load (if using custom web fonts)
    setTimeout(drawCanvas, 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerName, review, rating, themeColor, storeName])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `Membre_Avis_${customerName.replace(/\s+/g, '_')}.png`
    link.href = url
    link.click()
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
       <div className="flex items-center gap-3 mb-8">
          <span className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">📸</span>
          <div>
            <h3 className="text-lg font-black text-[#1A1A1A]">Studio Visuel UGC</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Transformez vos avis clients en images Instagram</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Controls */}
          <div className="space-y-6">
             <div>
               <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Prénom du client</label>
               <input 
                 value={customerName}
                 onChange={(e) => setCustomerName(e.target.value)}
                 className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-pink-500 outline-none"
                 placeholder="Ex: Fatou D."
               />
             </div>

             <div>
               <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Note sur 5</label>
               <div className="flex gap-2">
                 {[1,2,3,4,5].map(star => (
                    <button 
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-xl transition-colors ${rating >= star ? 'text-[#FFB800] bg-[#FFB800]/10' : 'text-gray-300'}`}
                    >
                      <Star fill={rating >= star ? 'currentColor' : 'none'} size={24} />
                    </button>
                 ))}
               </div>
             </div>

             <div>
               <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Message d'avis</label>
               <textarea 
                 value={review}
                 onChange={(e) => setReview(e.target.value)}
                 className="w-full bg-[#FAFAF7] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-pink-500 outline-none resize-none h-32"
               />
             </div>

             <div>
               <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Couleur de fond</label>
               <div className="flex flex-wrap gap-3">
                 {[
                   { code: '#0F7A60', name: 'Émeraude' },
                   { code: '#E63946', name: 'Rouge' },
                   { code: '#1D3557', name: 'Bleu Nuit' },
                   { code: '#D4AF37', name: 'Or' },
                   { code: '#000000', name: 'Noir' }
                 ].map(color => (
                   <button
                     key={color.code}
                     onClick={() => setThemeColor(color.code)}
                     className={`w-10 h-10 rounded-full border-4 transition-transform ${themeColor === color.code ? 'border-gray-200 scale-110' : 'border-transparent'}`}
                     style={{ backgroundColor: color.code }}
                   />
                 ))}
                 <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-10 h-10 rounded-full p-0 border-0 cursor-pointer overflow-hidden opacity-80 hover:opacity-100" />
               </div>
             </div>

             <button 
               onClick={handleDownload}
               className="w-full py-4 mt-4 bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all"
             >
               <Download size={18} />
               Télécharger pour Instagram
             </button>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-gray-100 p-6 overflow-hidden">
             <div className="relative w-full max-w-[360px] aspect-square rounded-2xl shadow-xl overflow-hidden ring-4 ring-white">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-cover"
                />
             </div>
             <p className="text-xs font-bold text-gray-400 mt-6 flex items-center gap-2">
               <ImageIcon size={14} /> Aperçu HD 1080x1080px
             </p>
          </div>
       </div>
    </div>
  )
}
