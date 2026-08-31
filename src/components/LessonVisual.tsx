'use client'

import { useState } from 'react'
import type { LessonVisual as Visual, KnowledgeCheck } from '@/lib/academy-types'
import { ArrowDown, Check, ImageIcon, X } from 'lucide-react'

// Visual learning blocks for the WHC course standard. Every visual explains
// something; none is decoration. All render mobile-first.

export function LessonVisualBlock({ visual }: { visual: Visual }) {
  if (visual.kind === 'flow') {
    return (
      <div className="rounded-xl border border-[#e3e7eb] bg-white p-5 my-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#10283b] mb-3">{visual.title}</p>
        <div className="flex flex-col items-stretch gap-1">
          {visual.steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-full rounded-lg bg-[#e8eef4] border border-[#e3e7eb] px-4 py-2.5 text-center text-[13px] font-medium text-[#0b2f4d]">{step}</div>
              {index < visual.steps.length - 1 && <ArrowDown size={14} className="text-[#10283b] my-0.5" />}
            </div>
          ))}
        </div>
        {visual.caption && <p className="mt-3 text-[11.5px] text-secondary leading-5">{visual.caption}</p>}
      </div>
    )
  }

  if (visual.kind === 'table') {
    return (
      <div className="rounded-xl border border-[#e3e7eb] bg-white p-5 my-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#10283b] mb-3">{visual.title}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] border-collapse min-w-[420px]">
            <thead><tr>{visual.headers.map(header => <th key={header} className="border-b-2 border-[#0b2f4d]/20 bg-[#f5f6f8] px-3 py-2 text-left font-semibold text-ink">{header}</th>)}</tr></thead>
            <tbody>{visual.rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} className={`border-b border-[#e3e7eb] px-3 py-2 text-gray-700 ${ci > 0 ? 'tabular-nums' : ''}`}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {visual.caption && <p className="mt-3 text-[11.5px] text-secondary leading-5">{visual.caption}</p>}
      </div>
    )
  }

  if (visual.kind === 'matrix') {
    return (
      <div className="rounded-xl border border-[#e3e7eb] bg-white p-5 my-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#10283b] mb-3">{visual.title}</p>
        <div className="flex gap-2">
          <div className="flex items-center"><p className="text-[10px] font-semibold uppercase tracking-wide text-secondary [writing-mode:vertical-rl] rotate-180">{visual.yLabel} →</p></div>
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-1.5">
              {visual.quadrants.map((quadrant, index) => (
                <div key={index} className={`rounded-lg px-3 py-4 text-center text-[12px] font-medium leading-5 ${index === 0 ? 'bg-[#e7f2ec] text-[#2e5b45]' : index === 3 ? 'bg-[#f5f6f8] text-[#10283b]' : 'bg-[#f5f6f8] text-gray-700'}`}>{quadrant}</div>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-secondary">{visual.xLabel} →</p>
          </div>
        </div>
        {visual.caption && <p className="mt-3 text-[11.5px] text-secondary leading-5">{visual.caption}</p>}
      </div>
    )
  }

  // image_placeholder: an honest slot the admin fills through the Academy
  // Downloads/media flow - never a stock photo pasted for decoration.
  return (
    <div className="rounded-xl border border-dashed border-[#e3e7eb] bg-[#f5f6f8] p-5 my-4 text-center">
      <ImageIcon size={20} className="mx-auto text-[#8a949b] mb-2" />
      <p className="text-[12px] font-semibold text-[#10283b]">{visual.title}</p>
      <p className="text-[11.5px] text-secondary mt-1">{visual.description}</p>
    </div>
  )
}

// Formative knowledge check: answer, get told why, move on. Practice - not
// the final assessment.
export function KnowledgeCheckBlock({ checks }: { checks: KnowledgeCheck[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  if (!checks.length) return null
  return (
    <div className="rounded-xl border border-[#e3e7eb] bg-[#f5f6f8] p-5 my-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b2f4d] mb-3">Knowledge check</p>
      <div className="space-y-4">
        {checks.map((check, qi) => {
          const chosen = answers[qi]
          return (
            <div key={qi}>
              <p className="text-[13px] font-medium text-ink mb-2">{qi + 1}. {check.q}</p>
              <div className="space-y-1.5">
                {check.options.map((option, oi) => {
                  const isChosen = chosen === oi
                  const revealed = chosen !== undefined
                  const isRight = oi === check.answer
                  return (
                    <button key={oi} type="button" disabled={revealed}
                      onClick={() => setAnswers(current => ({ ...current, [qi]: oi }))}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-[12.5px] transition-colors ${revealed
                        ? isRight ? 'border-green-300 bg-green-50 text-green-800' : isChosen ? 'border-red-300 bg-red-50 text-red-700' : 'border-transparent bg-white/60 text-secondary'
                        : 'border-[#e3e7eb] bg-white hover:border-[#0b2f4d]/40 text-gray-700'}`}>
                      {revealed && isRight && <Check size={12} className="inline mr-1.5 -mt-0.5" />}
                      {revealed && isChosen && !isRight && <X size={12} className="inline mr-1.5 -mt-0.5" />}
                      {option}
                    </button>
                  )
                })}
              </div>
              {chosen !== undefined && <p className="mt-2 text-[12px] leading-5 text-gray-600 bg-white/70 rounded px-3 py-2">{check.why}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
