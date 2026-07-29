export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  pipeline?: Record<string, unknown>[]
  results?: Record<string, unknown>[]
  followUps?: string[]
  timestamp: Date
}
