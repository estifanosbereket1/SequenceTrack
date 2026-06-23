import type { Reminder } from '../types';

export interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
}

export type ReminderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REMINDERS'; payload: Reminder[] }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'REMOVE_REMINDER'; payload: number };

export const initialReminderState: ReminderState = {
  reminders: [],
  loading: false,
  error: null,
};

export function reminderReducer(
  state: ReminderState,
  action: ReminderAction
): ReminderState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_REMINDERS':
      return { ...state, reminders: action.payload };
    case 'ADD_REMINDER':
      return {
        ...state,
        reminders: [...state.reminders, action.payload],
      };
    case 'REMOVE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.filter(r => r.id !== action.payload),
      };
    default:
      return state;
  }
}
