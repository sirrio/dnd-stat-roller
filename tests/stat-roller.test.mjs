import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

assert.ok(scriptMatch, 'index.html must contain its application script');
const script = scriptMatch[1];

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing function ${name}`);

  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }

  throw new Error(`unterminated function ${name}`);
}

function loadFunction(name, globals = {}) {
  const context = vm.createContext({ ...globals });
  vm.runInContext(
    `${extractFunction(script, name)}; globalThis.result = ${name};`,
    context,
  );
  return { context, fn: context.result };
}

test('application script is valid JavaScript', () => {
  assert.doesNotThrow(() => new Function(script));
});

test('version and static product contracts stay explicit', () => {
  assert.equal(packageJson.version, '1.0.0');
  assert.match(html, /const TARGET_DEFAULT = 72;/);
  assert.match(html, /const TARGET_MIN = 36, TARGET_MAX = 108;/);
  assert.match(html, /const HISTORY_MAX = 20;/);
  assert.match(html, /const MODE_KEY = 'dnd-stat-roller-mode-v1';/);
  assert.match(html, /const TARGET_KEY = 'dnd-stat-roller-target-v1';/);
  assert.match(html, /const HISTORY_KEY = 'dnd-stat-roller-history-v1';/);
  assert.doesNotMatch(script, /\b(?:fetch|WebSocket|XMLHttpRequest)\s*\(/);
});

test('both dice methods produce values in their natural range', () => {
  const rolls = [6, 1, 4, 3, 2, 5, 2];
  const { fn: rollStat } = loadFunction('rollStat', {
    MODE: '4d6k3',
    d6: () => rolls.shift(),
  });

  const dropLowest = rollStat('4d6k3');
  assert.deepEqual([...dropLowest.rolls], [6, 1, 4, 3]);
  assert.equal(dropLowest.droppedIndex, 1);
  assert.equal(dropLowest.value, 13);

  const straight = rollStat('3d6');
  assert.deepEqual([...straight.rolls], [2, 5, 2]);
  assert.equal(straight.droppedIndex, -1);
  assert.equal(straight.value, 9);
});

test('balancing honors bounds, target totals, and raw rank order', () => {
  const { context, fn: balance } = loadFunction('balance', {
    TARGET: 72,
    MIN: 3,
    MAX: 18,
  });
  const samples = [
    [3, 3, 3, 3, 3, 3],
    [18, 18, 18, 18, 18, 18],
    [18, 16, 14, 12, 10, 8],
    [3, 6, 9, 12, 15, 18],
    [7, 7, 11, 11, 15, 15],
  ];

  let state = 0x5eed1234;
  for (let sample = 0; sample < 500; sample += 1) {
    samples.push(Array.from({ length: 6 }, () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return 3 + (state % 16);
    }));
  }

  for (const target of [36, 60, 72, 84, 108]) {
    context.TARGET = target;
    for (const raw of samples) {
      const result = [...balance(raw)];
      assert.equal(result.reduce((sum, value) => sum + value, 0), target);
      assert.ok(result.every(Number.isInteger));
      assert.ok(result.every((value) => value >= 3 && value <= 18));

      for (let left = 0; left < raw.length; left += 1) {
        for (let right = 0; right < raw.length; right += 1) {
          if (raw[left] > raw[right]) {
            assert.ok(result[left] >= result[right]);
          }
        }
      }
    }
  }
});

test('all supported languages and legal footer links remain present', () => {
  const dictionaryMatch = script.match(
    /const I18N = (\{[\s\S]*?\});\s*let currentLang/,
  );
  assert.ok(dictionaryMatch, 'I18N dictionaries must remain readable');
  const dictionaries = vm.runInNewContext(`(${dictionaryMatch[1]})`);
  const englishKeys = Object.keys(dictionaries.en).sort();

  for (const language of ['en', 'de', 'es', 'fr', 'zh']) {
    assert.match(html, new RegExp(`data-lang="${language}"`));
    assert.deepEqual(Object.keys(dictionaries[language]).sort(), englishKeys);
  }

  assert.match(html, /https:\/\/sirrio\.de\//);
  assert.match(html, /https:\/\/sirrio\.de\/impressum\//);
  assert.match(html, /https:\/\/sirrio\.de\/datenschutz\//);
});
