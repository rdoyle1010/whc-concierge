export default function SkeletonProfile() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-surface rounded-full shrink-0" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-surface rounded" />
          <div className="h-3 w-56 bg-surface rounded" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-border rounded-xl p-4">
            <div className="h-3 w-6 bg-surface rounded mb-2" />
            <div className="h-6 w-10 bg-surface rounded mb-1" />
            <div className="h-2.5 w-14 bg-surface rounded" />
          </div>
        ))}
      </div>

      {/* Bio paragraph */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-2">
        <div className="h-4 w-24 bg-surface rounded mb-3" />
        <div className="h-3 w-full bg-surface rounded" />
        <div className="h-3 w-full bg-surface rounded" />
        <div className="h-3 w-4/5 bg-surface rounded" />
        <div className="h-3 w-2/3 bg-surface rounded" />
      </div>

      {/* Badges row */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-6 w-20 bg-surface rounded-full" />
        ))}
      </div>
    </div>
  )
}
