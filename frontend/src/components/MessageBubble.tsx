import { BarChart2, User } from 'lucide-react'
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
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[75%] leading-relaxed">
          {message.content}
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <BarChart2 size={16} className="text-white" />
      </div>
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div className="bg-[#1e293b] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
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
