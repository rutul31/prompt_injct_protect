import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {
  addEventListener: () => {},
  postMessage: () => {},
  __LLM_LAST_APPROVED_TEXT__: '',
};

const { getApprovedForLLM } = await import('../src/integration.js');

describe('integration', () => {
  it('combines approved chunk text while skipping blocked ones', () => {
    const chunks = [
      { id: '1', text: 'safe text' },
      { id: '2', text: 'blocked text' },
    ];
    const url = 'https://example.com';
    const decisions = {
      [`${url}::1`]: { decision: 'safe' },
      [`${url}::2`]: { decision: 'block' },
    };
    const result = getApprovedForLLM(chunks, url, decisions);
    assert.equal(result.trim(), 'safe text');
  });
});
