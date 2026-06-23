import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Template, TemplateStep, TemplateBlock, BlockType } from '../types';
import { templateReducer, TemplateState, initialTemplateState, TemplateAction } from '../reducers/templateReducer';
import * as TemplateDb from '../db/templates';

interface TemplateContextType extends TemplateState {
  loadTemplates: () => Promise<void>;
  loadTemplate: (id: number) => Promise<void>;
  createTemplate: (title: string, description: string) => Promise<number>;
  updateTemplate: (id: number, title: string, description: string) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
  addStep: (templateId: number, title: string) => Promise<void>;
  updateStep: (id: number, title: string) => Promise<void>;
  removeStep: (id: number) => Promise<void>;
  moveStepUp: (templateId: number, steps: TemplateStep[], index: number) => Promise<void>;
  moveStepDown: (templateId: number, steps: TemplateStep[], index: number) => Promise<void>;
  addBlock: (stepId: number, type: BlockType, textContent: string | null, uri: string | null, label: string | null) => Promise<void>;
  updateBlock: (id: number, textContent: string | null, label: string | null) => Promise<void>;
  removeBlock: (stepId: number, blockId: number) => Promise<void>;
  moveBlockUp: (blocks: TemplateBlock[], index: number) => Promise<void>;
  moveBlockDown: (blocks: TemplateBlock[], index: number) => Promise<void>;
  dispatch: React.Dispatch<TemplateAction>;
}

const TemplateContext = createContext<TemplateContextType | null>(null);

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(templateReducer, initialTemplateState);

  const loadTemplates = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const templates = await TemplateDb.getAllTemplates();
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadTemplate = useCallback(async (id: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const template = await TemplateDb.getTemplate(id);
      if (!template) throw new Error('Template not found');
      const steps = await TemplateDb.getTemplateSteps(id);
      dispatch({ type: 'SET_CURRENT_TEMPLATE', payload: { template, steps } });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createTemplate = useCallback(async (title: string, description: string) => {
    const id = await TemplateDb.createTemplate(title, description);
    const template = await TemplateDb.getTemplate(id);
    if (template) dispatch({ type: 'ADD_TEMPLATE', payload: template });
    return id;
  }, []);

  const updateTemplate = useCallback(async (id: number, title: string, description: string) => {
    await TemplateDb.updateTemplate(id, title, description);
    dispatch({ type: 'UPDATE_TEMPLATE', payload: { id, title, description, updated_at: new Date().toISOString(), created_at: '' } });
    await loadTemplate(id);
  }, [loadTemplate]);

  const deleteTemplate = useCallback(async (id: number) => {
    await TemplateDb.deleteTemplate(id);
    dispatch({ type: 'REMOVE_TEMPLATE', payload: id });
  }, []);

  const addStep = useCallback(async (templateId: number, title: string) => {
    const id = await TemplateDb.createTemplateStep(templateId, title);
    const step: TemplateStep = {
      id,
      template_id: templateId,
      order_index: 0,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      blocks: [],
    };
    dispatch({ type: 'ADD_STEP', payload: step });
    await loadTemplate(templateId);
  }, [loadTemplate]);

  const updateStep = useCallback(async (id: number, title: string) => {
    await TemplateDb.updateTemplateStep(id, title);
    dispatch({ type: 'UPDATE_STEP', payload: { id, title } });
  }, []);

  const removeStep = useCallback(async (id: number) => {
    await TemplateDb.deleteTemplateStep(id);
    dispatch({ type: 'REMOVE_STEP', payload: id });
  }, []);

  const moveStepUp = useCallback(async (templateId: number, steps: TemplateStep[], index: number) => {
    if (index <= 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    newSteps.forEach((s, i) => { s.order_index = i; });
    for (const s of newSteps) {
      await TemplateDb.reorderTemplateStep(s.id, s.order_index);
    }
    dispatch({ type: 'REORDER_STEPS', payload: newSteps });
  }, []);

  const moveStepDown = useCallback(async (templateId: number, steps: TemplateStep[], index: number) => {
    if (index >= steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    newSteps.forEach((s, i) => { s.order_index = i; });
    for (const s of newSteps) {
      await TemplateDb.reorderTemplateStep(s.id, s.order_index);
    }
    dispatch({ type: 'REORDER_STEPS', payload: newSteps });
  }, []);

  const addBlock = useCallback(async (stepId: number, type: BlockType, textContent: string | null, uri: string | null, label: string | null) => {
    const id = await TemplateDb.createTemplateBlock(stepId, type, textContent, uri, label);
    const block: TemplateBlock = {
      id,
      step_id: stepId,
      order_index: 0,
      type,
      text_content: textContent,
      uri,
      label,
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_BLOCK', payload: { stepId, block } });
  }, []);

  const updateBlock = useCallback(async (id: number, textContent: string | null, label: string | null) => {
    await TemplateDb.updateTemplateBlock(id, textContent, label);
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, textContent, label } });
  }, []);

  const removeBlock = useCallback(async (stepId: number, blockId: number) => {
    await TemplateDb.deleteTemplateBlock(blockId);
    dispatch({ type: 'REMOVE_BLOCK', payload: { stepId, blockId } });
  }, []);

  const moveBlockUp = useCallback(async (blocks: TemplateBlock[], index: number) => {
    if (index <= 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    newBlocks.forEach((b, i) => { b.order_index = i; });
    for (const b of newBlocks) {
      await TemplateDb.reorderTemplateBlock(b.id, b.order_index);
    }
    dispatch({ type: 'REORDER_BLOCKS', payload: { stepId: blocks[index].step_id, blocks: newBlocks } });
  }, []);

  const moveBlockDown = useCallback(async (blocks: TemplateBlock[], index: number) => {
    if (index >= blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    newBlocks.forEach((b, i) => { b.order_index = i; });
    for (const b of newBlocks) {
      await TemplateDb.reorderTemplateBlock(b.id, b.order_index);
    }
    dispatch({ type: 'REORDER_BLOCKS', payload: { stepId: blocks[index].step_id, blocks: newBlocks } });
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  return (
    <TemplateContext.Provider value={{
      ...state,
      loadTemplates,
      loadTemplate,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      addStep,
      updateStep,
      removeStep,
      moveStepUp,
      moveStepDown,
      addBlock,
      updateBlock,
      removeBlock,
      moveBlockUp,
      moveBlockDown,
      dispatch,
    }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplates must be used within TemplateProvider');
  return ctx;
}
