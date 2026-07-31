import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

interface Props {
  results: Record<string, unknown>[]
}

const PALETTE = [
  '#3b82f6','#6366f1','#8b5cf6','#a78bfa',
  '#34d399','#06b6d4','#f59e0b','#f97316',
  '#ec4899','#0ea5e9','#84cc16','#14b8a6',
]

function toLabel(val: unknown): string {
  if (val === null || val === undefined) return 'N/A'
  if (typeof val === 'object') {
    const vals = Object.values(val as Record<string, unknown>)
    const joined = vals.join(' · ')
    return joined.length > 30 ? joined.slice(0, 28) + '...' : joined
  }
  const str = String(val)
  return str.length > 30 ? str.slice(0, 28) + '...' : str
}

function fmt(val: number, currency: boolean): string {
  if (!currency) return val.toLocaleString()
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`
  return `$${val.toLocaleString()}`
}

export default function ResultChart({ results }: Props) {
  if (!results || results.length < 2) return null

  const sample = results[0]
  const numericKey = Object.keys(sample).find((k) => k !== '_id' && typeof sample[k] === 'number')
  if (!numericKey) return null

  const isCurrency = ['spend', 'price', 'amount', 'cost', 'total'].some((k) =>
    numericKey.toLowerCase().includes(k),
  )

  const data = results.slice(0, 12).map((row) => ({
    label: toLabel(row['_id'] ?? Object.values(row).find((v) => typeof v === 'string')),
    value: row[numericKey] as number,
  }))

  const label = numericKey.replace(/_/g, ' ')

  const top = data.reduce((a, b) => (b.value > a.value ? b : a), data[0])

  return (
    <div
      className="pop-in rounded-2xl p-5"
      style={{ background: 'rgba(15,25,45,0.75)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider capitalize">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-[160px]" style={{ background: 'rgba(52,211,153,0.15)', color: '#6ee7b7' }}>
            top &middot; {top.label}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
            {data.length} results
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 52 }}>
          <defs>
            {PALETTE.map((color, i) => (
              <linearGradient key={color} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={color} stopOpacity={0.45} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
            axisLine={false}
            tickLine={false}
            height={60}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(v: number) => fmt(v, isCurrency)}
            width={70}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{
              background: 'rgba(6,13,26,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontSize: 13,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            labelStyle={{ color: '#e2e8f0', marginBottom: 4, fontWeight: 600 }}
            itemStyle={{ color: '#93c5fd' }}
            formatter={(val: number) => [fmt(val, isCurrency), label]}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} isAnimationActive animationDuration={700} animationEasing="ease-out">
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#barGrad${i % PALETTE.length})`} stroke={PALETTE[i % PALETTE.length]} strokeOpacity={0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
