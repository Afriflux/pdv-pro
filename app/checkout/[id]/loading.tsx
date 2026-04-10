export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald border-t-transparent rounded-full animate-spin" />
        <p className="text-slate text-sm font-medium">Chargement du checkout…</p>
      </div>
    </main>
  )
}
