import { test } from 'node:test';
import assert from 'node:assert/strict';
import { historyReducer, History } from '../src/lib/history';
const start = (): History<number> => ({ present: 0, past: [], future: [] });
test('undo/redo traverses all five changes and respects the limit', () => {
  let state = start();
  for (let i = 1; i <= 7; i++) state = historyReducer(state, { type: 'change', next: i });
  assert.equal(state.past.length, 5);
  for (let i = 6; i >= 2; i--) {
    state = historyReducer(state, { type: 'undo' });
    assert.equal(state.present, i);
  }
  assert.equal(historyReducer(state, { type: 'undo' }), state);
  for (let i = 3; i <= 7; i++) {
    state = historyReducer(state, { type: 'redo' });
    assert.equal(state.present, i);
  }
  assert.equal(historyReducer(state, { type: 'redo' }), state);
});
test('a new change after undo discards the obsolete redo branch', () => {
  let state = historyReducer(start(), { type: 'change', next: 1 });
  state = historyReducer(state, { type: 'undo' });
  state = historyReducer(state, { type: 'change', next: 2 });
  assert.deepEqual(state.future, []);
  assert.equal(historyReducer(state, { type: 'redo' }).present, 2);
});
test('replaying each action is pure and cannot duplicate history', () => {
  const state: History<number> = { present: 2, past: [0, 1], future: [3] };
  const original = structuredClone(state);
  for (const action of [{ type: 'undo' }, { type: 'redo' }, { type: 'change', next: 4 }] as const) {
    assert.deepEqual(historyReducer(state, action), historyReducer(state, action));
    assert.deepEqual(state, original);
  }
});

test('reload resets both undo and redo history', () => {
  assert.deepEqual(historyReducer({ present: 2, past: [1], future: [3] }, { type: 'reset', next: 9 }), { present: 9, past: [], future: [] });
});
