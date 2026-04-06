export default function SkeletonCard({ variant = 'default' }: { variant?: 'role' | 'talent' | 'blog' | 'default' }) {
  if (variant === 'role') {
    return (
      <div className="bg-white border border-border rounded-xl p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-16 bg-surface rounded-full" />
          <div className="h-5 w-10 bg-surface rounded-full" />
        </div>
        <div className="h-3 w-24 bg-surface rounded mb-2" />
        <div className="h-5 w-3/4 bg-surface rounded mb-3" />
        <div className="flex gap-3 mb-3">
          <div className="h-3 w-20 bg-surface rounded" />
          <div className="h-3 w-16 bg-surface rounded" />
          <div className="h-3 w-24 bg-surface rounded" />
        </div>
        <div className="flex gap-1.5 mb-3">
          <div className="h-5 w-14 bg-surface rounded-full" />
          <div className="h-5 w-16 bg-surface rounded-full" />
          <div className="h-5 w-12 bg-surface rounded-full" />
        </div>
        <div className="h-3 w-full bg-surface rounded mb-1.5" />
        <div className="h-3 w-2/3 bg-surface rounded" />
      </div>
    )
  }

  if (variant === 'blog') {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden animate-pulse">
        <div className="h-48 bg-surface" />
        <div className="p-5">
          <div className="h-4 w-16 bg-surface rounded-full mb-3" />
          <div className="h-5 w-3/4 bg-surface rounded mb-2" />
          <div className="h-3 w-full bg-surface rounded mb-1.5" />
          <div className="h-3 w-2/3 bg-surface rounded mb-4" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-20 bg-surface rounded" />
            <div className="h-3 w-24 bg-surface rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'talent') {
    return (
      <div className="bg-white border border-border rounded-xl p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-surface rounded-full" />
          <div>
            <div className="h-4 w-28 bg-surface rounded mb-1.5" />
            <div className="h-3 w-36 bg-surface rounded" />
          </div>
        </div>
        <div className="flex gap-1.5 mb-3">
          <div className="h-5 w-16 bg-surface rounded-full" />
          <div className="h-5 w-14 bg-surface rounded-full" />
          <div className="h-5 w-18 bg-surface rounded-full" />
        </div>
        <div className="h-3 w-20 bg-surface rounded mb-3" />
        <div className="flex gap-2 pt-3 border-t border-border">
          <div className="h-8 flex-1 bg-surface rounded-lg" />
          <div className="h-8 flex-1 bg-surface rounded-lg" />
        </div>
      </div>
    )
  }

  // default
  return (
    <div className="bg-white border border-border rounded-xl p-5 animate-pulse">
      <div className="h-5 w-3/4 bg-surface rounded mb-3" />
      <div className="h-3 w-full bg-surface rounded mb-1.5" />
      <div className="h-3 w-2/3 bg-surface rounded mb-3" />
      <div className="h-3 w-1/2 bg-surface rounded" />
    </div>
  )
}
