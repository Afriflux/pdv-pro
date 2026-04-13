export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
      <div className="flex flex-col items-center gap-3 animate-[fade-in_0.3s_ease-out]">
        {/* Logo Yayyam pulsing */}
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white text-xl font-black">Y</span>
        </div>
        <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Chargement…</p>
      </div>
    </main>
  )
}
