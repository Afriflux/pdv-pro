export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#02120C]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm font-medium tracking-wide">Chargement…</p>
      </div>
    </main>
  )
}
