/** Immutable workspace history; safe to replay under React StrictMode. */
export type History<T> = { present: T; past: T[]; future: T[] };
export type HistoryAction<T> = { type: 'change'; next: T } | { type: 'undo' } | { type: 'redo' };
const LIMIT = 5;
export function historyReducer<T>(state: History<T>, action: HistoryAction<T>): History<T> {
  if (action.type === 'change')
    return {
      present: action.next,
      past: [...state.past.slice(-(LIMIT - 1)), state.present],
      future: [],
    };
  if (action.type === 'undo') {
    if (!state.past.length) return state;
    return {
      present: state.past[state.past.length - 1],
      past: state.past.slice(0, -1),
      future: [...state.future.slice(-(LIMIT - 1)), state.present],
    };
  }
  if (!state.future.length) return state;
  return {
    present: state.future[state.future.length - 1],
    past: [...state.past.slice(-(LIMIT - 1)), state.present],
    future: state.future.slice(0, -1),
  };
}
