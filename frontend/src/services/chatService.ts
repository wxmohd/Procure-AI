export interface ChatApiResponse {
  answer: string
  pipeline: Record<string, unknown>[] | null
  results: Record<string, unknown>[] | null
  follow_ups: string[] | null
  session_id: string
}

export async function sendMessage(query: string, sessionId: string): Promise<ChatApiResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, session_id: sessionId }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  return res.json()
}
