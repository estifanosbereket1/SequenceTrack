import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Instance, InstanceStep, InstanceBlock, BlockType } from '../types';
import { instanceReducer, InstanceState, initialInstanceState, InstanceAction } from '../reducers/instanceReducer';
import * as InstanceDb from '../db/instances';

interface InstanceContextType extends InstanceState {
  loadInstances: () => Promise<void>;
  loadInstance: (id: number) => Promise<void>;
  createInstanceFromTemplate: (templateId: number, name: string) => Promise<number>;
  updateInstanceStatus: (id: number, status: Instance['status']) => Promise<void>;
  deleteInstance: (id: number) => Promise<void>;
  updateStepStatus: (id: number, status: InstanceStep['status']) => Promise<void>;
  toggleChecklistBlock: (stepId: number, blockId: number, completed: boolean) => Promise<void>;
  addInstanceBlock: (stepId: number, type: BlockType, textContent: string | null, uri: string | null, label: string | null) => Promise<void>;
  removeInstanceBlock: (stepId: number, blockId: number) => Promise<void>;
  dispatch: React.Dispatch<InstanceAction>;
}

const InstanceContext = createContext<InstanceContextType | null>(null);

export function InstanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(instanceReducer, initialInstanceState);

  const loadInstances = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const instances = await InstanceDb.getAllInstances();
      dispatch({ type: 'SET_INSTANCES', payload: instances });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadInstance = useCallback(async (id: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const instance = await InstanceDb.getInstance(id);
      if (!instance) throw new Error('Instance not found');
      const steps = await InstanceDb.getInstanceSteps(id);
      dispatch({ type: 'SET_CURRENT_INSTANCE', payload: { instance, steps } });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createInstanceFromTemplate = useCallback(async (templateId: number, name: string) => {
    const id = await InstanceDb.deepCopyTemplateToInstance(templateId, name);
    await loadInstances();
    return id;
  }, [loadInstances]);

  const updateInstanceStatus = useCallback(async (id: number, status: Instance['status']) => {
    await InstanceDb.updateInstanceStatus(id, status);
    dispatch({ type: 'UPDATE_INSTANCE_STATUS', payload: { id, status } });
  }, []);

  const deleteInstance = useCallback(async (id: number) => {
    await InstanceDb.deleteInstance(id);
    dispatch({ type: 'REMOVE_INSTANCE', payload: id });
  }, []);

  const updateStepStatus = useCallback(async (id: number, status: InstanceStep['status']) => {
    await InstanceDb.updateInstanceStepStatus(id, status);
    dispatch({ type: 'UPDATE_STEP_STATUS', payload: { id, status } });
  }, []);

  const toggleChecklistBlock = useCallback(async (stepId: number, blockId: number, completed: boolean) => {
    await InstanceDb.updateInstanceBlockChecklist(blockId, completed);
    dispatch({ type: 'TOGGLE_BLOCK', payload: { stepId, blockId, completed } });
  }, []);

  const addInstanceBlock = useCallback(async (stepId: number, type: BlockType, textContent: string | null, uri: string | null, label: string | null) => {
    const id = await InstanceDb.createInstanceBlock(stepId, type, textContent, uri, label, type === 'checklist_item' ? null : null);
    const block: InstanceBlock = {
      id,
      instance_step_id: stepId,
      order_index: 0,
      type,
      text_content: textContent,
      uri,
      label,
      completed: null,
      completed_at: null,
    };
    dispatch({ type: 'ADD_INSTANCE_BLOCK', payload: { stepId, block } });
  }, []);

  const removeInstanceBlock = useCallback(async (stepId: number, blockId: number) => {
    await InstanceDb.deleteInstanceBlock(blockId);
    dispatch({ type: 'REMOVE_INSTANCE_BLOCK', payload: { stepId, blockId } });
  }, []);

  useEffect(() => { loadInstances(); }, [loadInstances]);

  return (
    <InstanceContext.Provider value={{
      ...state,
      loadInstances,
      loadInstance,
      createInstanceFromTemplate,
      updateInstanceStatus,
      deleteInstance,
      updateStepStatus,
      toggleChecklistBlock,
      addInstanceBlock,
      removeInstanceBlock,
      dispatch,
    }}>
      {children}
    </InstanceContext.Provider>
  );
}

export function useInstances() {
  const ctx = useContext(InstanceContext);
  if (!ctx) throw new Error('useInstances must be used within InstanceProvider');
  return ctx;
}
