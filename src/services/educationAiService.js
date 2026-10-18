/** Education tutor transport. Demo works without any backend. */
export async function streamTutorText({ message, onChunk, signal }) {
  const endpoint = process.env.REACT_APP_EDUCATION_STREAM_URL;
  if (!endpoint) {
    for (const word of message.split(/(\s+)/)) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      await new Promise(resolve => setTimeout(resolve, 33));
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      onChunk(word);
    }
    return;
  }
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ message }), signal });
  if (!response.ok || !response.body) throw new Error(`Tutor stream failed (${response.status})`);
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let separator;
      while ((separator = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, separator); buffer = buffer.slice(separator + 2);
        const data = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!data || data === '[DONE]') continue;
        // Accept SSE JSON { text | delta | content } or raw SSE text.
        let text = data;
        try { const parsed = JSON.parse(data); text = parsed.text ?? parsed.delta ?? parsed.content ?? ''; } catch (_) { /* raw text chunk */ }
        if (typeof text === 'string') onChunk(text);
      }
    }
  } finally { reader.releaseLock(); }
}
