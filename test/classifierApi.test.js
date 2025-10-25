import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { classifyChunks } from '../src/classifierApi.js';

let requests;

beforeEach(() => {
  requests = [];
});

describe('classifierApi', () => {
  it('posts classification payload to endpoint', async () => {
    globalThis.fetch = async (endpoint, options) => {
      requests.push({ endpoint, options });
      assert.equal(endpoint, 'https://api.example.com/classify');
      assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.equal(body.url, 'https://site');
      assert.equal(body.chunks.length, 1);
      return {
        ok: true,
        json: async () => ({ results: [{ id: '1', label: 'safe' }] }),
      };
    };

    const response = await classifyChunks({
      endpoint: 'https://api.example.com/classify',
      apiKey: 'secret',
      url: 'https://site',
      chunks: [{ id: '1', text: 'hello' }],
    });

    assert.equal(response.results[0].label, 'safe');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].options.headers.Authorization, 'Bearer secret');
  });

  it('throws when classifier response is not ok', async () => {
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    await assert.rejects(() =>
      classifyChunks({ endpoint: 'x', apiKey: '', url: 'y', chunks: [] }),
      /Classifier HTTP 500/
    );
  });
});
