import { useState } from 'react'
import { ChevronDown, ChevronRight, Terminal } from 'lucide-react'

interface Props {
  pipeline: Record<string, unknown>[]
}

export default function QueryInspector({ pipeline }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl overflow-hidden text-xs" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3.5 py-2.5 transition-colors hover:bg-white/5"
        style={{ background: 'rgba(15,31,53,0.6)' }}
      >
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
          <Terminal size={11} style={{ color: '#a78bfa' }} />
        </div>
        <span className="text-slate-400 font-medium">MongoDB Pipeline</span>
        <span
          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full mr-1"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa' }}
        >
          {pipeline.length} stage{pipeline.length !== 1 ? 's' : ''}
        </span>
        {open
          ? <ChevronDown size={13} className="text-slate-500" />
          : <ChevronRight size={13} className="text-slate-500" />}
      </button>
      {open && (
        <pre
          className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono"
          style={{ background: 'rgba(6,13,26,0.9)', color: '#93c5fd', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {JSON.stringify(pipeline, null, 2)}
        </pre>
      )}
    </div>
  )
}
