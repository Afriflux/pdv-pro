export default function ClientLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald/20 border-t-emerald rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate animate-pulse">Chargement de votre espace…</p>
      </div>
    </div>
  )
}
