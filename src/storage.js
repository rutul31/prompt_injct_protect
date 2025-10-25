// Persist moderation decisions & cached classifications
const NAMESPACE = 'llm_prompt_guard';

export async function getState() {
  const r = await chrome.storage.local.get([NAMESPACE]);
  return r[NAMESPACE] || { apiKey: "", endpoint: "", decisions: {}, cache: {} };
}
export async function setState(patch) {
  const cur = await getState();
  const next = { ...cur, ...patch };
  await chrome.storage.local.set({ [NAMESPACE]: next });
  return next;
}
export async function saveDecision(url, chunkHash, decision) {
  const s = await getState();
  const key = `${url}::${chunkHash}`;
  s.decisions[key] = { decision, ts: Date.now() };
  await setState({ decisions: s.decisions });
}
export async function getDecision(url, chunkHash) {
  const s = await getState();
  return s.decisions[`${url}::${chunkHash}`];
}
export async function cacheClassification(url, chunkHash, result) {
  const s = await getState();
  s.cache[`${url}::${chunkHash}`] = { result, ts: Date.now() };
  await setState({ cache: s.cache });
}
export async function getCachedClassification(url, chunkHash) {
  const s = await getState();
  return s.cache[`${url}::${chunkHash}`];
}
