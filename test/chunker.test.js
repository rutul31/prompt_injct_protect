import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunkText, buildSourceMap } from '../src/chunker.js';

describe('chunker', () => {
  it('splits text into chunks respecting token thresholds', () => {
    const items = [
      { idx: 0, text: 'Sentence one. Sentence two. Sentence three.' },
      { idx: 1, text: 'Another sentence. Final sentence.' },
    ];
    const chunks = chunkText(items, { maxTokens: 10, minTokens: 1 });
    assert.equal(chunks.length, 3);
    chunks.forEach((chunk) => {
      assert.ok(chunk.text.length > 0);
      assert.ok(Array.isArray(chunk.meta.origin));
      assert.ok(chunk.meta.origin.length > 0);
    });
  });

  it('buildSourceMap maps chunk ids back to source items', () => {
    const items = [
      { idx: 0, text: 'Sentence one. Sentence two.' },
      { idx: 1, text: 'Another sentence.' },
    ];
    const chunks = chunkText(items, { maxTokens: 20, minTokens: 1 });
    const map = buildSourceMap(items, chunks);
    chunks.forEach((chunk) => {
      const mapped = map[chunk.id];
      assert.ok(mapped.every((item) => typeof item.text === 'string'));
    });
  });
});
