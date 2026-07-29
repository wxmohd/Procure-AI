import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ArrowUp, DollarSign, Building2, Package, BarChart3, Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { Message } from '../types/chat'
import { sendMessage } from '../services/chatService'

const SUGGESTIONS = [
  { icon: DollarSign,  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', query: 'What was the total spending in fiscal year 2013-2014?' },
  { icon: Building2,   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', query: 'Which 5 departments had the highest total spending?' },
  { icon: Package,     color: '#34d399', bg: 'rgba(52,211,153,0.12)',  query: 'What are the top 10 most frequently ordered items?' },
  { icon: BarChart3,   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  query: 'Which quarter had the highest spending overall?' },
]

function getSessionId(): string {
  const stored = localStorage.getItem('procure_session_id')
  if (stored) return stored
  const id = uuidv4()
  localStorage.setItem('procure_session_id', id)
  return id
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState<string>(getSessionId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = useCallback(
    async (query: string) => {
      const q = query.trim()
      if (!q || loading) return

      const userMsg: Message = { id: uuidv4(), role: 'user', content: q, timestamp: new Date() }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setLoading(true)

      try {
        const data = await sendMessage(q, sessionId)
        const assistantMsg: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: data.answer,
          pipeline: data.pipeline ?? undefined,
          results: data.results ?? undefined,
          followUps: data.follow_ups ?? undefined,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: uuidv4(), role: 'assistant', content: 'Something went wrong. Please try again.', timestamp: new Date() },
        ])
      } finally {
        setLoading(false)
        inputRef.current?.focus()
      }
    },
    [loading, sessionId],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input) }
  }

  const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-8 max-w-3xl mx-auto w-full">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 40px rgba(99,102,241,0.35)' }}
              >
                <Sparkles size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-2 tracking-tight">
                  Ask anything
                </h2>
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                  I have access to 346,018 California State purchase orders. What would you like to explore?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {SUGGESTIONS.map(({ icon: Icon, color, bg, query }) => (
                <button
                  key={query}
                  onClick={() => handleSend(query)}
                  className="card-hover text-left px-4 py-3.5 rounded-2xl flex items-start gap-3"
                  style={{ background: 'rgba(15,31,53,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: bg }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span className="text-sm text-slate-300 leading-snug">{query}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onFollowUp={handleSend} />
          ))}
        </div>

        {loading && (
          <div className="flex items-start gap-3 mt-5 msg-enter">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
            >
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(15,31,53,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex gap-1.5 items-center h-5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-5 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="flex gap-3 max-w-3xl mx-auto rounded-2xl px-4 py-3 input-glow transition-all"
          style={{ background: 'rgba(15,31,53,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask about procurement data..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none leading-relaxed"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="btn-glow flex items-center justify-center w-9 h-9 self-end rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
          >
            <ArrowUp size={16} className="text-white" strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-600 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
