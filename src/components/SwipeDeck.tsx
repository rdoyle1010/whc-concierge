'use client'

import { useEffect, useRef, useState } from 'react'

export default function SwipeDeck<T extends { id: string }>({
  items,
  renderItem,
  onLeft,
  onRight,
  empty,
}: {
  items: T[]
  renderItem: (item: T, active: boolean) => React.ReactNode
  onLeft: (item: T) => void | Promise<void>
  onRight: (item: T) => void | Promise<void>
  empty?: React.ReactNode
}) {
  const [index, setIndex] = useState(0)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const startX = useRef(0)
  const pointerId = useRef<number | null>(null)

  useEffect(() => {
    setIndex(0)
    setX(0)
  }, [items.map(item => item.id).join('|')])

  const current = items[index]
  const next = items[index + 1]
  const threshold = 95

  async function commit(direction: 'left' | 'right') {
    if (!current || busy) return
    setBusy(true)
    setX(direction === 'right' ? 520 : -520)
    window.setTimeout(async () => {
      try {
        if (direction === 'right') await onRight(current)
        else await onLeft(current)
      } finally {
        setIndex(i => i + 1)
        setX(0)
        setBusy(false)
      }
    }, 180)
  }

  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (!current || busy) return
    pointerId.current = e.pointerId
    startX.current = e.clientX
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || pointerId.current !== e.pointerId || busy) return
    setX(Math.max(-260, Math.min(260, e.clientX - startX.current)))
  }

  function up(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerId.current !== e.pointerId) return
    setDragging(false)
    pointerId.current = null
    if (x > threshold) commit('right')
    else if (x < -threshold) commit('left')
    else setX(0)
  }

  if (!current) return <>{empty || <div className="rounded-2xl border border-border bg-white p-10 text-center"><p className="text-[20px] font-semibold text-ink">You’re all caught up.</p><p className="mt-2 text-[13px] text-muted">There are no more cards in this view.</p><button type="button" onClick={() => setIndex(0)} className="btn-secondary mt-5">Review again</button></div>}</>

  const rotate = x / 32
  const rightOpacity = Math.max(0, Math.min(1, x / threshold))
  const leftOpacity = Math.max(0, Math.min(1, -x / threshold))

  return <div className="mx-auto w-full max-w-[690px]">
    <div className="relative min-h-[520px]">
      {next && <div className="absolute inset-x-4 top-3 scale-[.985] opacity-55 pointer-events-none">{renderItem(next, false)}</div>}
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className={`absolute inset-x-0 top-0 z-10 touch-pan-y select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'} transition-[transform] ${dragging ? 'duration-0' : 'duration-200'}`}
        style={{ transform: `translateX(${x}px) rotate(${rotate}deg)` }}
      >
        <div className="relative">
          <div className="pointer-events-none absolute left-6 top-6 z-20 rotate-[-8deg] rounded-lg border-2 border-emerald-700 bg-white/95 px-4 py-2 text-[15px] font-bold tracking-[.14em] text-emerald-700" style={{ opacity: rightOpacity }}>INTERESTED</div>
          <div className="pointer-events-none absolute right-6 top-6 z-20 rotate-[8deg] rounded-lg border-2 border-red-700 bg-white/95 px-4 py-2 text-[15px] font-bold tracking-[.14em] text-red-700" style={{ opacity: leftOpacity }}>PASS</div>
          {renderItem(current, true)}
        </div>
      </div>
    </div>

    <div className="mt-4 flex items-center justify-center gap-5">
      <button type="button" disabled={busy} onClick={() => commit('left')} className="h-14 min-w-32 rounded-full border border-red-200 bg-white px-5 text-[12px] font-semibold text-red-700 shadow-sm disabled:opacity-40">← Pass</button>
      <span className="text-[11px] text-muted">{index + 1} of {items.length}</span>
      <button type="button" disabled={busy} onClick={() => commit('right')} className="h-14 min-w-32 rounded-full border border-emerald-200 bg-white px-5 text-[12px] font-semibold text-emerald-700 shadow-sm disabled:opacity-40">Interested →</button>
    </div>
    <p className="mt-3 text-center text-[10px] uppercase tracking-[.13em] text-muted">Drag the card or use the buttons</p>
  </div>
}
