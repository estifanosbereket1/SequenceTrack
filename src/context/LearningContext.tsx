import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Learning, LearningAttachmentType } from '../types';
import { learningReducer, LearningState, initialLearningState, LearningAction } from '../reducers/learningReducer';
import * as LearningDb from '../db/learnings';

interface LearningContextType extends LearningState {
  loadEntries: () => Promise<void>;
  loadEntry: (id: number) => Promise<void>;
  createEntry: (title: string | null, bodyMarkdown: string) => Promise<number>;
  updateEntry: (id: number, title: string | null, bodyMarkdown: string) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  addAttachment: (
    learningId: number,
    type: LearningAttachmentType,
    uri: string,
    label: string | null,
    caption: string | null,
    durationSeconds: number | null,
  ) => Promise<void>;
  removeAttachment: (id: number) => Promise<void>;
  dispatch: React.Dispatch<LearningAction>;
}

const LearningContext = createContext<LearningContextType | null>(null);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(learningReducer, initialLearningState);

  const loadEntries = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const entries = await LearningDb.getAllLearnings();
      dispatch({ type: 'SET_ENTRIES', payload: entries });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadEntry = useCallback(async (id: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const entry = await LearningDb.getLearning(id);
      dispatch({ type: 'SET_CURRENT_ENTRY', payload: entry });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createEntry = useCallback(async (title: string | null, bodyMarkdown: string) => {
    const id = await LearningDb.createLearning(title, bodyMarkdown);
    const entry = await LearningDb.getLearning(id);
    if (entry) dispatch({ type: 'ADD_ENTRY', payload: entry });
    return id;
  }, []);

  const updateEntry = useCallback(async (id: number, title: string | null, bodyMarkdown: string) => {
    await LearningDb.updateLearning(id, title, bodyMarkdown);
    const entry = await LearningDb.getLearning(id);
    if (entry) dispatch({ type: 'UPDATE_ENTRY', payload: entry });
  }, []);

  const deleteEntry = useCallback(async (id: number) => {
    await LearningDb.deleteLearning(id);
    dispatch({ type: 'REMOVE_ENTRY', payload: id });
  }, []);

  const addAttachment = useCallback(async (
    learningId: number,
    type: LearningAttachmentType,
    uri: string,
    label: string | null,
    caption: string | null,
    durationSeconds: number | null,
  ) => {
    await LearningDb.createLearningAttachment(learningId, type, uri, label, caption, durationSeconds);
    const entry = await LearningDb.getLearning(learningId);
    if (entry) dispatch({ type: 'UPDATE_ENTRY', payload: entry });
  }, []);

  const removeAttachment = useCallback(async (id: number) => {
    await LearningDb.deleteLearningAttachment(id);
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  return (
    <LearningContext.Provider value={{
      ...state,
      loadEntries,
      loadEntry,
      createEntry,
      updateEntry,
      deleteEntry,
      addAttachment,
      removeAttachment,
      dispatch,
    }}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearnings() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearnings must be used within LearningProvider');
  return ctx;
}
