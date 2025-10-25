import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toLanguageOnly, preprocessExtracts } from '../src/preprocess.js';

describe('preprocess', () => {
  it('toLanguageOnly strips scripts, tags, and code fences', () => {
    const raw = "Hello<script>alert('x')</script>World <b>bold</b> \n\n```code```";
    const normalized = toLanguageOnly(raw);
    assert.equal(normalized, 'Hello World bold');
  });

  it('preprocessExtracts normalizes text and filters empties', () => {
    const extracts = [
      { kind: 'p', visibility: 'visible', node: null, text: '<p>Hello</p>' },
      { kind: 'code', visibility: 'hidden', node: null, text: '```' },
    ];
    const result = preprocessExtracts(extracts);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, 'Hello');
    assert.equal(result[0].idx, 0);
  });
});
