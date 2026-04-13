export default function ProductsLoading() {
  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-3 lg:px-6">
        <div className="h-5 w-48 bg-gray-200 rounded-lg" />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-9 h-9 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Product grid — 2 cols mobile, 3 cols desktop */}
      <div className="px-3 lg:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
                <div className="h-5 w-20 bg-gray-200 rounded-lg mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
