import { Sparkles } from 'lucide-react'
import type { RefObject } from 'react'
import { Message } from '../types/chat'
import QueryInspector from './QueryInspector'
import ResultChart from './ResultChart'
import FollowUpChips from './FollowUpChips'

interface Props {
  message: Message
  onFollowUp: (query: string) => void
  isStreaming?: boolean
  textEndRef?: RefObject<HTMLDivElement>
}

function parseBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

function parseEmojis(text: string): string {
  return text.replace(/([\u{1F300}-\u{1F9FF}])/gu, '<span class="text-lg">$1</span>')
}

function parseHeaders(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-slate-300 mt-3 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-200 mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-slate-100 mt-4 mb-2.5">$1</h1>')
}

function parseLists(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let items: string[] = []
  let ordered = false

  const flush = () => {
    if (items.length === 0) return
    const tag = ordered ? 'ol' : 'ul'
    const cls = ordered
      ? 'list-decimal list-outside ml-5 my-2 space-y-1 marker:text-slate-500'
      : 'list-disc list-outside ml-5 my-2 space-y-1 marker:text-slate-500'
    result.push(`<${tag} class="${cls}">${items.map((i) => `<li>${i}</li>`).join('')}</${tag}>`)
    items = []
  }

  for (const line of lines) {
    const ulMatch = line.match(/^\s*[-*+]\s+(.+)$/)
    const olMatch = line.match(/^\s*\d+[.)]\s+(.+)$/)

    if (ulMatch) {
      if (items.length && ordered) flush()
      ordered = false
      items.push(ulMatch[1])
      continue
    }
    if (olMatch) {
      if (items.length && !ordered) flush()
      ordered = true
      items.push(olMatch[1])
      continue
    }

    flush()
    result.push(line)
  }
  flush()

  return result.join('\n')
}

function parseTables(text: string): string {
  const lines = text.split('\n')
  let result = []
  let inTable = false
  let tableRows: string[][] = []

  for (const line of lines) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c !== '')
      if (cells.length > 1) {
        if (!inTable) {
          inTable = true
          tableRows = []
        }
        tableRows.push(cells)
        continue
      }
    }

    if (inTable) {
      if (tableRows.length >= 2) {
        const headerRow = tableRows[0]
        const dataRows = tableRows.slice(2)

        let tableHtml = '<table class="w-full text-sm border-collapse my-3"><thead><tr>'
        headerRow.forEach(cell => {
          tableHtml += `<th class="px-3 py-2 text-left font-semibold text-slate-300 border-b border-slate-700">${parseBold(cell)}</th>`
        })
        tableHtml += '</tr></thead><tbody>'

        dataRows.forEach(row => {
          tableHtml += '<tr>'
          row.forEach(cell => {
            tableHtml += `<td class="px-3 py-2 text-slate-400 border-b border-slate-800">${parseBold(cell)}</td>`
          })
          tableHtml += '</tr>'
        })
        tableHtml += '</tbody></table>'
        result.push(tableHtml)
      }
      inTable = false
      tableRows = []
    }

    result.push(line)
  }

  if (inTable && tableRows.length >= 2) {
    const headerRow = tableRows[0]
    const dataRows = tableRows.slice(2)

    let tableHtml = '<table class="w-full text-sm border-collapse my-3"><thead><tr>'
    headerRow.forEach(cell => {
      tableHtml += `<th class="px-3 py-2 text-left font-semibold text-slate-300 border-b border-slate-700">${parseBold(cell)}</th>`
    })
    tableHtml += '</tr></thead><tbody>'

    dataRows.forEach(row => {
      tableHtml += '<tr>'
      row.forEach(cell => {
        tableHtml += `<td class="px-3 py-2 text-slate-400 border-b border-slate-800">${parseBold(cell)}</td>`
      })
      tableHtml += '</tr>'
    })
    tableHtml += '</tbody></table>'
    result.push(tableHtml)
  }

  return result.join('\n')
}

export default function MessageBubble({ message, onFollowUp, isStreaming, textEndRef }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end items-start gap-3 msg-enter">
        <div
          className="text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-[78%] leading-relaxed"
          style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 4px 24px rgba(99,102,241,0.22)' }}
        >
          {message.content}
        </div>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold text-slate-300"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          You
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 msg-enter">
      <div className="relative w-8 h-8 flex-shrink-0 mt-0.5">
        {isStreaming && (
          <div className="absolute inset-0 rounded-xl opacity-70 blur-sm animate-pulse" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }} />
        )}
        <div
          className="relative w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
        >
          <Sparkles size={14} className="text-white" />
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div
          ref={textEndRef}
          className={`rounded-2xl rounded-tl-sm px-4 py-3.5 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap ${isStreaming ? 'stream-cursor' : ''}`}
          style={{ background: 'rgba(15,25,45,0.75)', border: '1px solid rgba(255,255,255,0.08)' }}
          dangerouslySetInnerHTML={{ __html: parseHeaders(parseLists(parseTables(parseEmojis(parseBold(message.content))))) }}
        />

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
