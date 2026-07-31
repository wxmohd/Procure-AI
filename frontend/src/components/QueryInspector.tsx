import { useState, type MouseEvent } from 'react'
import { ChevronDown, ChevronRight, Terminal, Copy, Check } from 'lucide-react'

interface Props {
  pipeline: Record<string, unknown>[]
}

function highlightJson(json: string): string {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber-300'
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'text-indigo-300' : 'text-emerald-300'
      } else if (/true|false/.test(match)) {
        cls = 'text-sky-300'
      } else if (/null/.test(match)) {
        cls = 'text-slate-500'
      }
      return `<span class="${cls}">${match}</span>`
    },
  )
}

export default function QueryInspector({ pipeline }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const json = JSON.stringify(pipeline, null, 2)

  const handleCopy = async (e: MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-2xl overflow-hidden text-xs" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3.5 py-2.5 transition-colors hover:bg-white/5"
        style={{ background: 'rgba(15,25,45,0.65)' }}
      >
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
          <Terminal size={11} style={{ color: '#a78bfa' }} />
        </div>
        <span className="text-slate-400 font-medium">MongoDB Pipeline</span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa' }}
        >
          {pipeline.length} stage{pipeline.length !== 1 ? 's' : ''}
        </span>

        <span className="ml-auto flex items-center gap-1">
          {open && (
            <span
              onClick={handleCopy}
              role="button"
              className="flex items-center gap-1 text-[10px] px-1.5 py-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </span>
          )}
          {open
            ? <ChevronDown size={13} className="text-slate-500" />
            : <ChevronRight size={13} className="text-slate-500" />}
        </span>
      </button>
      {open && (
        <pre
          className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono"
          style={{ background: 'rgba(4,9,18,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          dangerouslySetInnerHTML={{ __html: highlightJson(json) }}
        />
      )}
    </div>
  )
}
