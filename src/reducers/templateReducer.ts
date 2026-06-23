import type { Template, TemplateStep, TemplateBlock, BlockType } from '../types';

export interface TemplateState {
  templates: Template[];
  currentTemplate: {
    template: Template | null;
    steps: TemplateStep[];
  } | null;
  loading: boolean;
  error: string | null;
}

export type TemplateAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TEMPLATES'; payload: Template[] }
  | { type: 'SET_CURRENT_TEMPLATE'; payload: { template: Template; steps: TemplateStep[] } | null }
  | { type: 'ADD_TEMPLATE'; payload: Template }
  | { type: 'UPDATE_TEMPLATE'; payload: Template }
  | { type: 'REMOVE_TEMPLATE'; payload: number }
  | { type: 'ADD_STEP'; payload: TemplateStep }
  | { type: 'UPDATE_STEP'; payload: { id: number; title: string } }
  | { type: 'REMOVE_STEP'; payload: number }
  | { type: 'REORDER_STEPS'; payload: TemplateStep[] }
  | { type: 'ADD_BLOCK'; payload: { stepId: number; block: TemplateBlock } }
  | { type: 'UPDATE_BLOCK'; payload: { id: number; textContent: string | null; label: string | null } }
  | { type: 'REMOVE_BLOCK'; payload: { stepId: number; blockId: number } }
  | { type: 'REORDER_BLOCKS'; payload: { stepId: number; blocks: TemplateBlock[] } };

export const initialTemplateState: TemplateState = {
  templates: [],
  currentTemplate: null,
  loading: false,
  error: null,
};

export function templateReducer(
  state: TemplateState,
  action: TemplateAction
): TemplateState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'SET_CURRENT_TEMPLATE':
      return { ...state, currentTemplate: action.payload };
    case 'ADD_TEMPLATE':
      return { ...state, templates: [action.payload, ...state.templates] };
    case 'UPDATE_TEMPLATE': {
      const ct = state.currentTemplate;
      const isCurrent = ct != null && ct.template?.id === action.payload.id;
      return {
        ...state,
        templates: state.templates.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
        currentTemplate: isCurrent && ct
          ? { ...ct, template: action.payload }
          : state.currentTemplate,
      };
    }
    case 'REMOVE_TEMPLATE': {
      const ct = state.currentTemplate;
      const isCurrent = ct != null && ct.template?.id === action.payload;
      return {
        ...state,
        templates: state.templates.filter(t => t.id !== action.payload),
        currentTemplate: isCurrent
          ? null
          : state.currentTemplate,
      };
    }
    case 'ADD_STEP':
      return state.currentTemplate?.template
        ? {
            ...state,
            currentTemplate: {
              ...state.currentTemplate,
              steps: [...state.currentTemplate.steps, action.payload],
            },
          }
        : state;
    case 'UPDATE_STEP':
      return state.currentTemplate?.template
        ? {
            ...state,
            currentTemplate: {
              ...state.currentTemplate,
              steps: state.currentTemplate.steps.map(s =>
                s.id === action.payload.id
                  ? { ...s, title: action.payload.title }
                  : s
              ),
            },
          }
        : state;
    case 'REMOVE_STEP':
      return state.currentTemplate?.template
        ? {
            ...state,
            currentTemplate: {
              ...state.currentTemplate,
              steps: state.currentTemplate.steps.filter(
                s => s.id !== action.payload
              ),
            },
          }
        : state;
    case 'REORDER_STEPS':
      return state.currentTemplate?.template
        ? {
            ...state,
            currentTemplate: {
              ...state.currentTemplate,
              steps: action.payload,
            },
          }
        : state;
    case 'ADD_BLOCK':
      return state.currentTemplate
        ? {
            ...state,
            currentTemplate: {
              ...state.currentTemplate,
              steps: state.currentTemplate.steps.map(s =>
                s.id === action.payload.stepId
                  ? { ...s, blocks: [...s.blocks, action.payload.block] }
                  : s
              ),
            },
          }
        : state;
    case 'UPDATE_BLOCK':
      return state.currentTemplate
        ? {
            ...state,
            currentTemplate: {
              ...state.currentTemplate,
              steps: state.currentTemplate.steps.map(s => ({
                ...s,
                blocks: s.blocks.map(b =>
                  b.id === action.payload.id
                    ? {
                        ...b,
                        text_content: action.payload.textContent,
                        label: action.payload.label,
                      }
                    : b
                ),
              })),
            },
          }
        : state;
    case 'REMOVE_BLOCK':
      return state.currentTemplate
        ? {
            ...state,
            currentTemplate: {
              ...state.currentTemplate,
              steps: state.currentTemplate.steps.map(s =>
                s.id === action.payload.stepId
                  ? {
                      ...s,
                      blocks: s.blocks.filter(
                        b => b.id !== action.payload.blockId
                      ),
                    }
                  : s
              ),
            },
          }
        : state;
    case 'REORDER_BLOCKS':
      return state.currentTemplate
        ? {
            ...state,
            currentTemplate: {
              ...state.currentTemplate,
              steps: state.currentTemplate.steps.map(s =>
                s.id === action.payload.stepId
                  ? { ...s, blocks: action.payload.blocks }
                  : s
              ),
            },
          }
        : state;
    default:
      return state;
  }
}
