import { TrendingUp } from 'lucide-react'
import Chat from './components/Chat'

export default function App() {
  return (
    <div className="flex flex-col h-screen" style={{ background: '#060d1a' }}>
      <header
        className="flex items-center gap-4 px-6 py-3.5 flex-shrink-0"
        style={{
          background: 'rgba(8,18,38,0.9)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
        >
          <TrendingUp size={17} className="text-white" strokeWidth={2.5} />
        </div>

        <div className="leading-none">
          <span className="text-[17px] font-bold gradient-text tracking-tight">ProcureAI</span>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium tracking-wide uppercase">
            California State · Procurement Intelligence
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <div className="live-ring absolute w-2 h-2 rounded-full" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 relative z-10" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Connected</span>
        </div>
      </header>

      <Chat />
    </div>
  )
}
