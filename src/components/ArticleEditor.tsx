'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Quote, Link2, Palette, Undo2, Redo2, Eraser,
} from 'lucide-react'
import { ARTICLE_COLOURS } from '@/lib/article-html'

// The Journal editor. It writes HTML, and everything it writes is put through
// the allowlist in article-html.ts before it is stored and again before it is
// rendered - so the toolbar decides what a writer can reach for, and the
// sanitiser decides what a reader can receive. The two are deliberately
// separate: pasting from Word, a website or an email lands in the same small
// set of tags as typing does.
//
// contentEditable with execCommand rather than a rich text framework. It is a
// deprecated API and every browser still implements it, and the alternative is
// a hundred kilobytes of dependency for bold, italic and bullets.

type Props = { value: string; onChange: (html: string) => void }

const BUTTON = 'inline-flex h-8 w-8 items-center justify-center border border-border bg-white text-ink transition-colors hover:bg-[#f1f1f1] disabled:opacity-40'

export default function ArticleEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [colourOpen, setColourOpen] = useState(false)

  // Only write into the element when the incoming value genuinely differs from
  // what is already there. Assigning innerHTML on every render would move the
  // caret to the start on every keystroke.
  useEffect(() => {
    const el = ref.current
    if (el && value !== el.innerHTML) el.innerHTML = value || ''
  }, [value])

  const run = (command: string, argument?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, argument)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const addLink = () => {
    const url = window.prompt('Link address (https://...)')
    if (!url) return
    // Anything that is not http, https or mailto is refused here as well as in
    // the sanitiser: better to tell the writer than to drop it silently later.
    if (!/^(https?:|mailto:)/i.test(url)) { window.alert('Links must start with https:// or mailto:'); return }
    run('createLink', url)
  }

  return (
    <div className="border border-border bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-[#f1f1f1] p-2">
        <button type="button" className={BUTTON} onClick={() => run('bold')} aria-label="Bold" title="Bold"><Bold size={14} /></button>
        <button type="button" className={BUTTON} onClick={() => run('italic')} aria-label="Italic" title="Italic"><Italic size={14} /></button>
        <button type="button" className={BUTTON} onClick={() => run('underline')} aria-label="Underline" title="Underline"><Underline size={14} /></button>
        <button type="button" className={BUTTON} onClick={() => run('strikeThrough')} aria-label="Strikethrough" title="Strikethrough"><Strikethrough size={14} /></button>

        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={BUTTON} onClick={() => run('formatBlock', '<h2>')} aria-label="Heading" title="Heading"><Heading2 size={14} /></button>
        <button type="button" className={BUTTON} onClick={() => run('formatBlock', '<h3>')} aria-label="Sub-heading" title="Sub-heading"><Heading3 size={14} /></button>
        <button type="button" className={BUTTON} onClick={() => run('formatBlock', '<p>')} aria-label="Normal text" title="Normal text"><span className="text-[11px] font-semibold">P</span></button>

        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={BUTTON} onClick={() => run('insertUnorderedList')} aria-label="Bullet list" title="Bullet list"><List size={14} /></button>
        <button type="button" className={BUTTON} onClick={() => run('insertOrderedList')} aria-label="Numbered list" title="Numbered list"><ListOrdered size={14} /></button>
        <button type="button" className={BUTTON} onClick={() => run('formatBlock', '<blockquote>')} aria-label="Quote" title="Quote"><Quote size={14} /></button>
        <button type="button" className={BUTTON} onClick={addLink} aria-label="Add link" title="Add link"><Link2 size={14} /></button>

        <span className="mx-1 h-5 w-px bg-border" />
        <div className="relative">
          <button type="button" className={BUTTON} onClick={() => setColourOpen(open => !open)} aria-label="Text colour" aria-expanded={colourOpen} title="Text colour"><Palette size={14} /></button>
          {colourOpen && (
            <div className="absolute left-0 top-9 z-20 w-44 border border-border bg-white p-1 shadow-lg">
              {ARTICLE_COLOURS.map(colour => (
                <button
                  key={colour.label} type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[12px] hover:bg-[#f1f1f1]"
                  onClick={() => { run('foreColor', colour.value || '#1c1c1c'); setColourOpen(false) }}
                >
                  <span className="h-3 w-3 border border-border" style={{ background: colour.value || '#1c1c1c' }} />
                  {colour.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={BUTTON} onClick={() => run('undo')} aria-label="Undo" title="Undo"><Undo2 size={14} /></button>
        <button type="button" className={BUTTON} onClick={() => run('redo')} aria-label="Redo" title="Redo"><Redo2 size={14} /></button>
        <button type="button" className={BUTTON} onClick={() => run('removeFormat')} aria-label="Clear formatting" title="Clear formatting"><Eraser size={14} /></button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article"
        className="article-body min-h-[420px] px-5 py-4 focus:outline-none"
        onInput={event => onChange((event.target as HTMLDivElement).innerHTML)}
        onBlur={event => onChange((event.target as HTMLDivElement).innerHTML)}
        // Paste as plain text. A paste from Word carries a payload of markup
        // and inline styles that the sanitiser would strip anyway; taking the
        // text means the writer sees the result they will get.
        onPaste={event => {
          event.preventDefault()
          const text = event.clipboardData.getData('text/plain')
          document.execCommand('insertText', false, text)
        }}
      />
    </div>
  )
}
