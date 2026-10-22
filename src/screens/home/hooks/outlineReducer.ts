import { distanceMeters, type Coordinate } from '../components/measurement';

/** Each point gets a stable id, so markers keep their identity when other points change. */
export type Vertex = Coordinate & { readonly id: number };

export type OutlineState = {
  past: Vertex[][];
  present: Vertex[];
  future: Vertex[][];
  nextId: number;
  /** Selection lives here (not in history) so undo/redo can never leave a dangling selection. */
  selectedId: number | null;
};

export type OutlineAction =
  | { type: 'add'; coordinate: Coordinate }
  | { type: 'moveSelected'; coordinate: Coordinate }
  | { type: 'removeSelected' }
  | { type: 'clear' }
  | { type: 'undo' }
  | { type: 'redo' }
  /** Selects the point, or deselects it if it is already selected. */
  | { type: 'select'; id: number }
  | { type: 'deselect' };

export const MAX_HISTORY = 200;
/** Ignore an "add" that lands within 1 cm of the previous point (double taps on the button). */
export const MIN_VERTEX_SPACING_M = 0.01;

export const INITIAL_OUTLINE_STATE: OutlineState = {
  past: [],
  present: [],
  future: [],
  nextId: 1,
  selectedId: null,
};

function commit(
  state: OutlineState,
  present: Vertex[],
  selectedId: number | null = state.selectedId,
): OutlineState {
  return {
    ...state,
    past: [...state.past, state.present].slice(-MAX_HISTORY),
    present,
    future: [],
    selectedId,
  };
}

export function outlineReducer(state: OutlineState, action: OutlineAction): OutlineState {
  switch (action.type) {
    case 'add': {
      const last = state.present[state.present.length - 1];
      if (last && distanceMeters(last, action.coordinate) < MIN_VERTEX_SPACING_M) {
        return state;
      }
      const vertex: Vertex = {
        id: state.nextId,
        latitude: action.coordinate.latitude,
        longitude: action.coordinate.longitude,
      };
      return { ...commit(state, [...state.present, vertex], null), nextId: state.nextId + 1 };
    }

    case 'moveSelected': {
      const index = state.present.findIndex(vertex => vertex.id === state.selectedId);
      if (index < 0) {
        return state;
      }
      const current = state.present[index];
      if (
        current.latitude === action.coordinate.latitude &&
        current.longitude === action.coordinate.longitude
      ) {
        return state;
      }
      const next = state.present.slice();
      next[index] = {
        id: current.id,
        latitude: action.coordinate.latitude,
        longitude: action.coordinate.longitude,
      };
      return commit(state, next);
    }

    case 'removeSelected': {
      if (state.selectedId === null) {
        return state;
      }
      return commit(
        state,
        state.present.filter(vertex => vertex.id !== state.selectedId),
        null,
      );
    }

    case 'clear':
      // Recorded in history, so "Clear" can be undone and needs no confirmation dialog.
      return state.present.length === 0 ? state : commit(state, [], null);

    case 'undo': {
      if (state.past.length === 0) {
        return state;
      }
      return {
        ...state,
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
        selectedId: null,
      };
    }

    case 'redo': {
      if (state.future.length === 0) {
        return state;
      }
      return {
        ...state,
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
        selectedId: null,
      };
    }

    case 'select': {
      if (!state.present.some(vertex => vertex.id === action.id)) {
        return state;
      }
      return { ...state, selectedId: state.selectedId === action.id ? null : action.id };
    }

    case 'deselect':
      return state.selectedId === null ? state : { ...state, selectedId: null };
  }
}
