import type { Instance, InstanceStep, BlockType } from '../types';

export interface InstanceState {
  instances: Instance[];
  currentInstance: {
    instance: Instance;
    steps: InstanceStep[];
  } | null;
  loading: boolean;
  error: string | null;
}

export type InstanceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INSTANCES'; payload: Instance[] }
  | { type: 'SET_CURRENT_INSTANCE'; payload: { instance: Instance; steps: InstanceStep[] } | null }
  | { type: 'ADD_INSTANCE'; payload: Instance }
  | { type: 'UPDATE_INSTANCE_STATUS'; payload: { id: number; status: Instance['status'] } }
  | { type: 'REMOVE_INSTANCE'; payload: number }
  | { type: 'UPDATE_STEP_STATUS'; payload: { id: number; status: InstanceStep['status'] } }
  | { type: 'TOGGLE_BLOCK'; payload: { stepId: number; blockId: number; completed: boolean } }
  | { type: 'ADD_INSTANCE_BLOCK'; payload: { stepId: number; block: InstanceStep['blocks'][0] } }
  | { type: 'REMOVE_INSTANCE_BLOCK'; payload: { stepId: number; blockId: number } };

export const initialInstanceState: InstanceState = {
  instances: [],
  currentInstance: null,
  loading: false,
  error: null,
};

export function instanceReducer(
  state: InstanceState,
  action: InstanceAction
): InstanceState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INSTANCES':
      return { ...state, instances: action.payload };
    case 'SET_CURRENT_INSTANCE':
      return { ...state, currentInstance: action.payload };
    case 'ADD_INSTANCE':
      return { ...state, instances: [action.payload, ...state.instances] };
    case 'UPDATE_INSTANCE_STATUS':
      return {
        ...state,
        instances: state.instances.map(i =>
          i.id === action.payload.id
            ? { ...i, status: action.payload.status }
            : i
        ),
        currentInstance: state.currentInstance?.instance.id === action.payload.id
          ? {
              ...state.currentInstance,
              instance: { ...state.currentInstance.instance, status: action.payload.status },
            }
          : state.currentInstance,
      };
    case 'REMOVE_INSTANCE':
      return {
        ...state,
        instances: state.instances.filter(i => i.id !== action.payload),
        currentInstance: state.currentInstance?.instance.id === action.payload
          ? null
          : state.currentInstance,
      };
    case 'UPDATE_STEP_STATUS':
      return state.currentInstance
        ? {
            ...state,
            currentInstance: {
              ...state.currentInstance,
              steps: state.currentInstance.steps.map(s =>
                s.id === action.payload.id
                  ? { ...s, status: action.payload.status }
                  : s
              ),
            },
          }
        : state;
    case 'TOGGLE_BLOCK':
      return state.currentInstance
        ? {
            ...state,
            currentInstance: {
              ...state.currentInstance,
              steps: state.currentInstance.steps.map(s =>
                s.id === action.payload.stepId
                  ? {
                      ...s,
                      blocks: s.blocks.map(b =>
                        b.id === action.payload.blockId
                          ? {
                              ...b,
                              completed: action.payload.completed,
                              completed_at: action.payload.completed
                                ? new Date().toISOString()
                                : null,
                            }
                          : b
                      ),
                    }
                  : s
              ),
            },
          }
        : state;
    case 'ADD_INSTANCE_BLOCK':
      return state.currentInstance
        ? {
            ...state,
            currentInstance: {
              ...state.currentInstance,
              steps: state.currentInstance.steps.map(s =>
                s.id === action.payload.stepId
                  ? { ...s, blocks: [...s.blocks, action.payload.block] }
                  : s
              ),
            },
          }
        : state;
    case 'REMOVE_INSTANCE_BLOCK':
      return state.currentInstance
        ? {
            ...state,
            currentInstance: {
              ...state.currentInstance,
              steps: state.currentInstance.steps.map(s =>
                s.id === action.payload.stepId
                  ? {
                      ...s,
                      blocks: s.blocks.filter(b => b.id !== action.payload.blockId),
                    }
                  : s
              ),
            },
          }
        : state;
    default:
      return state;
  }
}
