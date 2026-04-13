export default function OrdersLoading() {
  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-5 pt-8 px-6 lg:px-10">
        <div className="w-14 h-14 bg-gray-200 rounded-[1.2rem]" />
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-72 bg-gray-200 rounded" />
        </div>
      </div>

      {/* KPI cards — 2 cols mobile, 4 cols desktop */}
      <div className="px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 lg:h-28 bg-gray-200 rounded-[32px]" />
          ))}
        </div>
      </div>

      {/* Filters bar */}
      <div className="px-6 lg:px-10 flex gap-3">
        <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
        <div className="h-12 w-28 bg-gray-200 rounded-xl" />
        <div className="h-12 w-32 bg-gray-200 rounded-xl" />
      </div>

      {/* Table rows */}
      <div className="px-6 lg:px-10">
        <div className="bg-white rounded-[32px] border border-gray-100 p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div className="w-20 h-5 bg-gray-200 rounded-lg" />
              <div className="flex-1 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-5 bg-gray-200 rounded-lg" />
              <div className="w-20 h-6 bg-gray-200 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
