import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getState, setState, saveDecision, getDecision, cacheClassification, getCachedClassification } from '../src/storage.js';

const namespace = 'llm_prompt_guard';
let memoryStore;

function setupChrome() {
  memoryStore = {};
  globalThis.chrome = {
    storage: {
      local: {
        async get() {
          if (Object.keys(memoryStore).length === 0) {
            return {};
          }
          return { [namespace]: memoryStore };
        },
        async set(values) {
          if (values && values[namespace]) {
            memoryStore = { ...values[namespace] };
          }
        },
      },
    },
  };
}

beforeEach(() => {
  setupChrome();
});

describe('storage', () => {
  it('returns default state when storage is empty', async () => {
    const state = await getState();
    assert.deepEqual(state, { apiKey: '', endpoint: '', decisions: {}, cache: {} });
  });

  it('merges patches when setting state', async () => {
    await setState({ apiKey: 'key', decisions: { foo: 'bar' } });
    const state = await getState();
    assert.equal(state.apiKey, 'key');
    assert.deepEqual(state.decisions, { foo: 'bar' });
  });

  it('persists decisions and cached results', async () => {
    await saveDecision('url', 'hash', 'block');
    const decision = await getDecision('url', 'hash');
    assert.equal(decision.decision, 'block');

    await cacheClassification('url', 'hash', { label: 'malicious' });
    const cached = await getCachedClassification('url', 'hash');
    assert.equal(cached.result.label, 'malicious');
  });
});
