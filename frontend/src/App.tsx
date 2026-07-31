import { Sparkles } from 'lucide-react'
import Chat from './components/Chat'
import AuroraBackground from './components/AuroraBackground'

export default function App() {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden" style={{ background: '#05090f' }}>
      <AuroraBackground />

      <header
        className="relative z-10 flex items-center gap-4 px-6 py-3.5 flex-shrink-0"
        style={{
          background: 'rgba(7,14,28,0.72)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        }}
      >
        <div className="relative flex items-center justify-center w-9 h-9 flex-shrink-0">
          <div
            className="absolute inset-0 rounded-xl opacity-70 blur-md"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}
          />
          <div
            className="relative flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 2px 12px rgba(59,130,246,0.4)' }}
          >
            <Sparkles size={16} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div className="leading-none">
          <span className="text-[17px] font-extrabold gradient-text-animated tracking-tight">ProcureAI</span>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium tracking-wide uppercase">
            California State &middot; Procurement Intelligence
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2.5 pl-3 py-1.5 pr-3.5 rounded-full" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)' }}>
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <div className="live-ring absolute w-2 h-2 rounded-full" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 relative z-10" />
          </div>
          <span className="text-xs text-emerald-300 font-medium">Live</span>
        </div>
      </header>

      <div className="hairline relative z-10" />

      <Chat />
    </div>
  )
}
