export default function OrdersLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-36 bg-gray-200 rounded" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
