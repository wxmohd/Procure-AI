import { BarChart2 } from 'lucide-react'
import Chat from './components/Chat'

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-[#0f172a]">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-[#334155] bg-[#1e293b] flex-shrink-0">
        <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-lg">
          <BarChart2 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white leading-none">ProcureAI</h1>
          <p className="text-xs text-slate-400 mt-0.5">California State Procurement Analytics</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full" />
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </header>
      <Chat />
    </div>
  )
}
