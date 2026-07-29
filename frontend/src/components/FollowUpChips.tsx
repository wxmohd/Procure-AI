interface Props {
  suggestions: string[]
  onSelect: (query: string) => void
}

export default function FollowUpChips({ suggestions, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="text-xs px-3 py-1.5 rounded-full border border-[#334155] text-slate-400 hover:border-blue-500 hover:text-blue-400 bg-[#1e293b] transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
