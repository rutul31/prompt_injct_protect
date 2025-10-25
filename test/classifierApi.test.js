import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { classifyChunks } from '../src/classifierApi.js';

let originalRandom;

beforeEach(() => {
  originalRandom = Math.random;
});

afterEach(() => {
  Math.random = originalRandom;
});

describe('classifierApi', () => {
  it('marks chunk as malicious when random value is high', async () => {
    Math.random = () => 0.9;

    const response = await classifyChunks({
      url: 'https://site',
      chunks: [{ id: '1', text: 'hello' }],
    });

    assert.equal(response.results.length, 1);
    assert.equal(response.results[0].id, '1');
    assert.equal(response.results[0].label, 'malicious');
    assert.ok(response.results[0].confidence <= 1);
    assert.ok(response.results[0].confidence >= 0);
    assert.match(response.results[0].reason, /Dummy classifier/);
  });

  it('marks chunk as safe when random value is low', async () => {
    Math.random = () => 0.1;

    const response = await classifyChunks({
      url: 'https://site',
      chunks: [{ id: 'abc', text: 'hello' }],
    });

    assert.equal(response.results[0].label, 'safe');
    assert.equal(response.results[0].confidence, 0.9);
    assert.equal(response.results[0].reason, undefined);
  });
});
