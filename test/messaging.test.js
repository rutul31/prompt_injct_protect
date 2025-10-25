import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

function setupChrome() {
  globalThis.chrome = {
    runtime: {
      lastError: null,
      sendMessage: (_msg, cb) => cb({ ok: true }),
      onMessage: {
        addListener: () => {},
      },
    },
  };
}

setupChrome();
const { askBg } = await import('../src/messaging.js');

beforeEach(() => {
  setupChrome();
});

describe('messaging askBg', () => {
  it('resolves with response when successful', async () => {
    const response = await askBg('ping', { data: 1 });
    assert.deepEqual(response, { ok: true });
  });

  it('resolves error when lastError is set', async () => {
    chrome.runtime.sendMessage = (_msg, cb) => {
      chrome.runtime.lastError = { message: 'failed' };
      cb(undefined);
    };
    const response = await askBg('ping', {});
    assert.deepEqual(response, { ok: false, error: 'failed' });
  });

  it('resolves error when sendMessage throws', async () => {
    chrome.runtime.sendMessage = () => {
      throw new Error('boom');
    };
    const response = await askBg('ping', {});
    assert.equal(response.ok, false);
    assert.equal(response.error, 'boom');
  });
});
