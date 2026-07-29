import { ArrowRight } from 'lucide-react'

interface Props {
  suggestions: string[]
  onSelect: (query: string) => void
}

export default function FollowUpChips({ suggestions, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
        Follow-up questions
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="card-hover flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200"
            style={{ background: 'rgba(15,31,53,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span>{s}</span>
            <ArrowRight size={11} className="flex-shrink-0 opacity-60" />
          </button>
        ))}
      </div>
    </div>
  )
}
