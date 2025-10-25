export async function classifyChunks({ endpoint, apiKey, url, chunks }) {
  // Expected API: POST /classify {url, chunks:[{id,text,meta}]}
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({ url, chunks })
  });
  if (!res.ok) throw new Error(`Classifier HTTP ${res.status}`);
  // Response format:
  // { results: [{id, label: 'safe'|'malicious', confidence: 0..1, reason?:string}] }
  return res.json();
}
