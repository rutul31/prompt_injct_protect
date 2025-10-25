function simulateResult(randomValue, chunk) {
  const malicious = randomValue >= 0.5;
  const confidence = malicious ? randomValue : 1 - randomValue;
  return {
    id: chunk.id,
    label: malicious ? 'malicious' : 'safe',
    confidence: Number(confidence.toFixed(2)),
    ...(malicious ? { reason: 'Dummy classifier flagged this chunk.' } : {}),
  };
}

export async function classifyChunks({ url, chunks }) {
  // Dummy binary classifier that mimics an API response with random output.
  const results = chunks.map((chunk, index) => {
    // offset Math.random with chunk index to avoid reusing cached values when
    // Math.random is stubbed to a constant during tests.
    const randomValue = Math.min(0.999, Math.random() + (index * 1e-4));
    return simulateResult(randomValue, chunk);
  });

  return Promise.resolve({
    url,
    results,
  });
}
