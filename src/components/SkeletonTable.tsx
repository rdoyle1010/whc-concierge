export default function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border">
        <div className="h-3 w-32 bg-surface rounded" />
        <div className="h-3 w-24 bg-surface rounded" />
        <div className="h-3 w-20 bg-surface rounded ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 ${i % 2 === 1 ? 'opacity-70' : ''}`}>
          <div className="w-8 h-8 bg-surface rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-2/5 bg-surface rounded" />
            <div className="h-2.5 w-3/5 bg-surface rounded" />
          </div>
          <div className="h-5 w-16 bg-surface rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}
