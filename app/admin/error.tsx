'use client'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Une erreur est survenue</h2>
      <p className="text-sm text-gray-500 text-center max-w-md">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 text-sm font-medium text-white bg-[#0F7A60] rounded-lg hover:bg-emerald-700 transition-colors min-h-[44px]"
      >
        Réessayer
      </button>
    </div>
  )
}
