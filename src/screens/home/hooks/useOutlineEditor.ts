import { useMemo, useReducer } from 'react';
import type { Coordinate } from '../components/measurement';
import { INITIAL_OUTLINE_STATE, outlineReducer } from './outlineReducer';

/**
 * Owns the outline being drawn: its points, undo/redo history and the selected point.
 * Every action is referentially stable, so it can be passed to memoized children freely.
 */
export function useOutlineEditor() {
  const [state, dispatch] = useReducer(outlineReducer, INITIAL_OUTLINE_STATE);

  const actions = useMemo(
    () => ({
      add: (coordinate: Coordinate) => dispatch({ type: 'add', coordinate }),
      moveSelected: (coordinate: Coordinate) => dispatch({ type: 'moveSelected', coordinate }),
      removeSelected: () => dispatch({ type: 'removeSelected' }),
      clear: () => dispatch({ type: 'clear' }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      select: (id: number) => dispatch({ type: 'select', id }),
      deselect: () => dispatch({ type: 'deselect' }),
    }),
    [],
  );

  const { present: vertices, selectedId } = state;
  const selectedIndex = selectedId === null ? -1 : vertices.findIndex(vertex => vertex.id === selectedId);

  return {
    vertices,
    selectedId,
    selectedIndex,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    ...actions,
  };
}
