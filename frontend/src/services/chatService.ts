export interface ChatApiResponse {
  answer: string
  pipeline: Record<string, unknown>[] | null
  results: Record<string, unknown>[] | null
  follow_ups: string[] | null
  session_id: string
}

export interface StreamHandlers {
  onToken: (text: string) => void
  onPipeline: (pipeline: Record<string, unknown>[]) => void
  onResults: (results: Record<string, unknown>[]) => void
  onFollowUps: (followUps: string[]) => void
  onError: (message: string) => void
}

export async function streamMessage(
  query: string,
  sessionId: string,
  handlers: StreamHandlers,
): Promise<void> {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, session_id: sessionId }),
  })

  if (!res.ok || !res.body) {
    throw new Error(await res.text())
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''

    for (const frame of frames) {
      const eventLine = frame.split('\n').find((l) => l.startsWith('event: '))
      const dataLine = frame.split('\n').find((l) => l.startsWith('data: '))
      if (!eventLine || !dataLine) continue

      const event = eventLine.slice(7).trim()
      let data: unknown
      try {
        data = JSON.parse(dataLine.slice(6))
      } catch {
        continue
      }

      switch (event) {
        case 'token':
          handlers.onToken(data as string)
          break
        case 'pipeline':
          handlers.onPipeline(data as Record<string, unknown>[])
          break
        case 'results':
          handlers.onResults(data as Record<string, unknown>[])
          break
        case 'follow_ups':
          handlers.onFollowUps(data as string[])
          break
        case 'error':
          handlers.onError(data as string)
          break
      }
    }
  }
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
