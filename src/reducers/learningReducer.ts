import type { Learning } from '../types';

export interface LearningState {
  entries: Learning[];
  currentEntry: Learning | null;
  loading: boolean;
  error: string | null;
}

export type LearningAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ENTRIES'; payload: Learning[] }
  | { type: 'SET_CURRENT_ENTRY'; payload: Learning | null }
  | { type: 'ADD_ENTRY'; payload: Learning }
  | { type: 'UPDATE_ENTRY'; payload: Learning }
  | { type: 'REMOVE_ENTRY'; payload: number };

export const initialLearningState: LearningState = {
  entries: [],
  currentEntry: null,
  loading: false,
  error: null,
};

export function learningReducer(
  state: LearningState,
  action: LearningAction
): LearningState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ENTRIES':
      return { ...state, entries: action.payload };
    case 'SET_CURRENT_ENTRY':
      return { ...state, currentEntry: action.payload };
    case 'ADD_ENTRY':
      return { ...state, entries: [action.payload, ...state.entries] };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map(e =>
          e.id === action.payload.id ? action.payload : e
        ),
        currentEntry: state.currentEntry?.id === action.payload.id
          ? action.payload
          : state.currentEntry,
      };
    case 'REMOVE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter(e => e.id !== action.payload),
        currentEntry: state.currentEntry?.id === action.payload
          ? null
          : state.currentEntry,
      };
    default:
      return state;
  }
}
