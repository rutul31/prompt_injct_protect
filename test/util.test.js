import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashString, contrastRatio, parseRgb, estimateTokens } from '../src/util.js';

describe('util', () => {
  it('hashString produces deterministic hex output', () => {
    assert.equal(hashString('a'), 'e40c292c');
    assert.equal(hashString('prompt'), hashString('prompt'));
    assert.notEqual(hashString('prompt'), hashString('Prompt'));
  });

  it('contrastRatio calculates WCAG ratio', () => {
    assert.equal(contrastRatio([0, 0, 0], [255, 255, 255]).toFixed(2), '21.00');
    const ratio = contrastRatio([255, 0, 0], [0, 0, 255]);
    assert.ok(ratio > 2 && ratio < 6);
  });

  it('parseRgb handles rgb, rgba, and hex strings', () => {
    assert.deepEqual(parseRgb('rgb(10, 20, 30)'), [10, 20, 30]);
    assert.deepEqual(parseRgb('rgba(1,2,3,0.5)'), [1, 2, 3]);
    assert.deepEqual(parseRgb('#fff'), [255, 255, 255]);
    assert.deepEqual(parseRgb('#336699'), [51, 102, 153]);
    assert.deepEqual(parseRgb('invalid'), [0, 0, 0]);
  });

  it('estimateTokens uses 4 char heuristic with minimum of 1', () => {
    assert.equal(estimateTokens(''), 1);
    assert.equal(estimateTokens('abcd'), 1);
    assert.equal(estimateTokens('hello world'), 3);
  });
});
