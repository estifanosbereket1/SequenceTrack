import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Reminder } from '../types';
import { reminderReducer, ReminderState, initialReminderState, ReminderAction } from '../reducers/reminderReducer';
import * as ReminderDb from '../db/reminders';
import * as Notifications from '../utils/notifications';

interface ReminderContextType extends ReminderState {
  loadReminders: () => Promise<void>;
  scheduleReminder: (
    instanceId: number,
    instanceStepId: number | null,
    title: string,
    scheduledAt: Date,
    repeatRule: string | null,
  ) => Promise<void>;
  cancelReminder: (reminderId: number, notificationId: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  dispatch: React.Dispatch<ReminderAction>;
}

const ReminderContext = createContext<ReminderContextType | null>(null);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reminderReducer, initialReminderState);

  const loadReminders = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const reminders = await ReminderDb.getAllReminders();
      dispatch({ type: 'SET_REMINDERS', payload: reminders });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    return await Notifications.requestPermissionsAsync();
  }, []);

  const scheduleReminder = useCallback(async (
    instanceId: number,
    instanceStepId: number | null,
    title: string,
    scheduledAt: Date,
    repeatRule: string | null,
  ) => {
    const granted = await requestPermissions();
    if (!granted) return;

    const notificationId = await Notifications.scheduleNotificationAsync(
      'ProcessTracker',
      title,
      scheduledAt,
      { instanceId, instanceStepId },
    );

    if (notificationId) {
      const reminderId = await ReminderDb.createReminder(
        instanceId,
        instanceStepId,
        title,
        scheduledAt.toISOString(),
        repeatRule,
        notificationId,
      );

      const reminder: Reminder = {
        id: reminderId,
        instance_id: instanceId,
        instance_step_id: instanceStepId,
        title,
        scheduled_at: scheduledAt.toISOString(),
        repeat_rule: repeatRule,
        notification_id: notificationId,
        created_at: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_REMINDER', payload: reminder });
    }
  }, [requestPermissions]);

  const cancelReminder = useCallback(async (reminderId: number, notificationId: string) => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    await ReminderDb.deleteReminder(reminderId);
    dispatch({ type: 'REMOVE_REMINDER', payload: reminderId });
  }, []);

  useEffect(() => { loadReminders(); }, [loadReminders]);

  return (
    <ReminderContext.Provider value={{
      ...state,
      loadReminders,
      scheduleReminder,
      cancelReminder,
      requestPermissions,
      dispatch,
    }}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminders must be used within ReminderProvider');
  return ctx;
}
