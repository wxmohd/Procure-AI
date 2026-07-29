import { Sparkles } from 'lucide-react'
import { Message } from '../types/chat'
import QueryInspector from './QueryInspector'
import ResultChart from './ResultChart'
import FollowUpChips from './FollowUpChips'

interface Props {
  message: Message
  onFollowUp: (query: string) => void
}

export default function MessageBubble({ message, onFollowUp }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end msg-enter">
        <div
          className="text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[78%] leading-relaxed"
          style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 4px 24px rgba(99,102,241,0.2)' }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 msg-enter">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', flexShrink: 0 }}
      >
        <Sparkles size={14} className="text-white" />
      </div>

      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3.5 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap"
          style={{ background: 'rgba(15,31,53,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {message.content}
        </div>

        {message.results && message.results.length > 0 && (
          <ResultChart results={message.results} />
        )}
        {message.pipeline && message.pipeline.length > 0 && (
          <QueryInspector pipeline={message.pipeline} />
        )}
        {message.followUps && message.followUps.length > 0 && (
          <FollowUpChips suggestions={message.followUps} onSelect={onFollowUp} />
        )}
      </div>
    </div>
  )
}
