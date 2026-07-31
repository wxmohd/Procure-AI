import { ArrowRight, Sparkles } from 'lucide-react'

interface Props {
  suggestions: string[]
  onSelect: (query: string) => void
}

export default function FollowUpChips({ suggestions, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2 pop-in">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
        <Sparkles size={10} className="text-indigo-400" />
        Follow-up questions
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="card-hover flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-100"
            style={{ background: 'rgba(15,25,45,0.6)', border: '1px solid rgba(255,255,255,0.08)', animationDelay: `${i * 50}ms` }}
          >
            <span>{s}</span>
            <ArrowRight size={11} className="flex-shrink-0 opacity-60" />
          </button>
        ))}
      </div>
    </div>
  )
}
