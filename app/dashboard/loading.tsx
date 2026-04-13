export default function DashboardLoading() {
  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 bg-gray-200 rounded-lg" />
        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
      </div>

      {/* KPI cards — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 lg:h-24 bg-gray-200 rounded-2xl" />
        ))}
      </div>

      {/* Banner skeleton */}
      <div className="h-32 lg:h-44 bg-gray-200 rounded-2xl" />

      {/* Chart skeleton */}
      <div className="h-48 lg:h-64 bg-gray-200 rounded-2xl" />

      {/* Bottom nav placeholder (mobile) */}
      <div className="h-16 bg-gray-100 rounded-2xl lg:hidden" />
    </div>
  )
}
