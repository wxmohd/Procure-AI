import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  results: Record<string, unknown>[]
}

const COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f59e0b', '#10b981', '#14b8a6', '#0ea5e9', '#84cc16',
  '#ef4444', '#f97316',
]

function toLabel(val: unknown): string {
  if (val === null || val === undefined) return 'N/A'
  if (typeof val === 'object') {
    return Object.values(val as Record<string, unknown>).join(' · ')
  }
  return String(val)
}

function formatCurrency(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toLocaleString()}`
}

export default function ResultChart({ results }: Props) {
  if (!results || results.length < 2) return null

  const sample = results[0]
  const numericKey = Object.keys(sample).find(
    (k) => k !== '_id' && typeof sample[k] === 'number',
  )
  if (!numericKey) return null

  const isCurrency = ['spend', 'price', 'amount', 'cost', 'total'].some((k) =>
    numericKey.toLowerCase().includes(k),
  )

  const data = results.slice(0, 12).map((row) => ({
    label: toLabel(row['_id'] ?? Object.values(row).find((v) => typeof v === 'string')),
    value: row[numericKey] as number,
  }))

  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
      <p className="text-xs text-slate-400 mb-4 capitalize font-medium">
        {numericKey.replace(/_/g, ' ')}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 52 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={
              isCurrency
                ? (v: number) => `$${(v / 1_000_000).toFixed(0)}M`
                : (v: number) => v.toLocaleString()
            }
            width={58}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#e2e8f0', marginBottom: 4 }}
            formatter={(val: number) => [
              isCurrency ? formatCurrency(val) : val.toLocaleString(),
              numericKey.replace(/_/g, ' '),
            ]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
