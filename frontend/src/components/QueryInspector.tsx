import { useState } from 'react'
import { ChevronDown, ChevronRight, Code2 } from 'lucide-react'

interface Props {
  pipeline: Record<string, unknown>[]
}

export default function QueryInspector({ pipeline }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-[#334155] overflow-hidden text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-[#1e293b] text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Code2 size={13} />
        <span>MongoDB Pipeline</span>
        <span className="ml-auto text-slate-500 mr-1">
          {pipeline.length} stage{pipeline.length !== 1 ? 's' : ''}
        </span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <pre className="p-3 bg-[#0f172a] text-slate-300 overflow-x-auto text-xs leading-relaxed">
          {JSON.stringify(pipeline, null, 2)}
        </pre>
      )}
    </div>
  )
}
