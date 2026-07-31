import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ArrowUp, DollarSign, Building2, Package, BarChart3, Sparkles, Database } from 'lucide-react'
import MessageBubble from './MessageBubble'
import FollowUpChips from './FollowUpChips'
import CountUp from './CountUp'
import { Message } from '../types/chat'
import { streamMessage } from '../services/chatService'

const SUGGESTIONS = [
  { icon: DollarSign,  color: '#60a5fa', bg: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.04))', ring: 'rgba(59,130,246,0.35)', query: 'What was the total spending in fiscal year 2013-2014?' },
  { icon: Building2,   color: '#c4b5fd', bg: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.04))', ring: 'rgba(167,139,250,0.35)', query: 'Which 5 departments had the highest total spending?' },
  { icon: Package,     color: '#6ee7b7', bg: 'linear-gradient(135deg, rgba(52,211,153,0.18), rgba(52,211,153,0.04))', ring: 'rgba(52,211,153,0.35)', query: 'What are the top 10 most frequently ordered items?' },
  { icon: BarChart3,   color: '#fcd34d', bg: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.04))', ring: 'rgba(245,158,11,0.35)', query: 'Which quarter had the highest spending overall?' },
]

const STATS = [
  { label: 'Purchase orders', value: 346018, icon: Database },
  { label: 'Fiscal years', value: 6, icon: BarChart3 },
  { label: 'State departments', value: 300, suffix: '+', icon: Building2 },
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
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [sessionId] = useState<string>(getSessionId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamAnchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (streamingId) {
      // Follow the growing answer text instead of snapping to the very
      // bottom of the message, which would jump past it the moment the
      // chart/pipeline attach below and hide the text still being typed.
      streamAnchorRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
    } else {
      // Not streaming: either a brand-new message just landed, or the
      // stream just finished — both cases scroll smoothly to reveal
      // whatever settled in below (chart, pipeline, follow-ups).
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, streamingId])

  const handleSend = useCallback(
    async (query: string) => {
      const q = query.trim()
      if (!q || loading) return

      const userMsg: Message = { id: uuidv4(), role: 'user', content: q, timestamp: new Date() }
      const assistantId = uuidv4()

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setLoading(true)

      let streamed = ''
      let started = false
      let pending: Partial<Message> = {}

      const patch = (fields: Partial<Message>) => {
        if (!started) {
          pending = { ...pending, ...fields }
          return
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, ...fields } : m)),
        )
      }

      const ensureBubble = () => {
        if (started) return
        const initial = pending
        started = true
        pending = {}
        setLoading(false)
        setStreamingId(assistantId)
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), ...initial },
        ])
      }

      try {
        await streamMessage(q, sessionId, {
          onToken: (text) => {
            ensureBubble()
            streamed += text
            patch({ content: streamed })
          },
          onPipeline: (pipeline) => patch({ pipeline }),
          onResults: (results) => patch({ results }),
          onFollowUps: (followUps) => patch({ followUps }),
          onError: (message) => {
            ensureBubble()
            streamed = message
            patch({ content: message })
          },
        })
        ensureBubble()
      } catch {
        if (started) {
          patch({ content: 'Something went wrong. Please try again.' })
        } else {
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: 'assistant', content: 'Something went wrong. Please try again.', timestamp: new Date() },
          ])
        }
      } finally {
        setLoading(false)
        setStreamingId(null)
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
    <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-8 max-w-3xl mx-auto w-full">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[68vh] gap-9 text-center">
              <div className="flex flex-col items-center gap-5">
                <div className="relative w-20 h-20 flex items-center justify-center float-y">
                  <div
                    className="absolute inset-0 rounded-3xl blur-xl opacity-60"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)' }}
                  />
                  <div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 40px rgba(99,102,241,0.45)' }}
                  >
                    <Sparkles size={28} className="text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold gradient-text-animated mb-2.5 tracking-tight">
                    Ask anything
                  </h1>
                  <p className="text-slate-400 text-sm max-w-sm leading-relaxed mx-auto">
                    Your AI copilot for California State procurement &mdash; ask in plain English,
                    get instant answers backed by real MongoDB queries.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {STATS.map(({ label, value, suffix, icon: Icon }) => (
                  <div
                    key={label}
                    className="stat-chip pop-in flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                    style={{ background: 'rgba(15,25,45,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Icon size={14} className="text-indigo-300" />
                    <span className="text-sm font-bold text-slate-100 tabular-nums">
                      <CountUp value={value} suffix={suffix} />
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTIONS.map(({ icon: Icon, color, bg, ring, query }, i) => (
                  <button
                    key={query}
                    onClick={() => handleSend(query)}
                    className="card-hover pop-in text-left px-4 py-3.5 rounded-2xl flex items-start gap-3"
                    style={{ background: 'rgba(15,25,45,0.6)', border: '1px solid rgba(255,255,255,0.08)', animationDelay: `${i * 60}ms` }}
                  >
                    <div
                      className="suggestion-icon-wrap w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: bg, boxShadow: `inset 0 0 0 1px ${ring}` }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                    <span className="text-sm text-slate-300 leading-snug pt-1">{query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {messages.map((msg, index) => (
              <div key={msg.id}>
                <MessageBubble
                  message={msg}
                  onFollowUp={handleSend}
                  isStreaming={msg.id === streamingId}
                  textEndRef={msg.id === streamingId ? streamAnchorRef : undefined}
                />
                {index === messages.length - 1 && msg.role === 'assistant' && !loading && !msg.followUps?.length && (
                  <div className="mt-4">
                    <FollowUpChips
                      suggestions={SUGGESTIONS.map(s => s.query)}
                      onSelect={handleSend}
                    />
                  </div>
                )}
              </div>
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
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(15,25,45,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="thinking-orb w-3 h-3 rounded-full" />
                <span className="text-xs text-slate-400 font-medium">Querying procurement data&hellip;</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 pb-5 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="flex gap-3 max-w-3xl mx-auto rounded-2xl px-4 py-3 input-glow transition-all"
          style={{ background: 'rgba(15,25,45,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
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
          Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
