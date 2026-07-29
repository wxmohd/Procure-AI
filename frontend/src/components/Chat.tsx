import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Send, Loader2 } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { Message } from '../types/chat'
import { sendMessage } from '../services/chatService'

const SUGGESTED_QUERIES = [
  'What was the total spending in fiscal year 2013-2014?',
  'Which department had the highest spending?',
  'What are the top 10 most frequently ordered items?',
  'Which quarter had the highest spending?',
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

      const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        content: q,
        timestamp: new Date(),
      }

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
          {
            id: uuidv4(),
            role: 'assistant',
            content: 'Something went wrong. Please try again.',
            timestamp: new Date(),
          },
        ])
      } finally {
        setLoading(false)
        inputRef.current?.focus()
      }
    },
    [loading, sessionId],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                What would you like to know?
              </h2>
              <p className="text-slate-400 text-sm">
                Ask anything about California State procurement data
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-left px-4 py-3 rounded-xl border border-[#334155] bg-[#1e293b] text-sm text-slate-300 hover:border-blue-500 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onFollowUp={handleSend} />
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Loader2 size={16} className="text-white animate-spin" />
            </div>
            <div className="bg-[#1e293b] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-6 pt-3 border-t border-[#334155] flex-shrink-0">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask about procurement data..."
            rows={1}
            className="flex-1 resize-none bg-[#1e293b] border border-[#334155] text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-12 h-12 self-end rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
