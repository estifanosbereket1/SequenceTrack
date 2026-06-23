import { getDb } from './database';
import type { Reminder } from '../types';

export async function getAllReminders(): Promise<Reminder[]> {
  const db = await getDb();
  return await db.getAllAsync<Reminder>(
    'SELECT * FROM reminders ORDER BY scheduled_at'
  );
}

export async function getRemindersForInstance(
  instanceId: number
): Promise<Reminder[]> {
  const db = await getDb();
  return await db.getAllAsync<Reminder>(
    'SELECT * FROM reminders WHERE instance_id = ? ORDER BY scheduled_at',
    instanceId
  );
}

export async function createReminder(
  instanceId: number,
  instanceStepId: number | null,
  title: string,
  scheduledAt: string,
  repeatRule: string | null,
  notificationId: string,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO reminders (instance_id, instance_step_id, title, scheduled_at, repeat_rule, notification_id) VALUES (?, ?, ?, ?, ?, ?)',
    instanceId, instanceStepId, title, scheduledAt, repeatRule, notificationId
  );
  return result.lastInsertRowId;
}

export async function deleteReminder(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM reminders WHERE id = ?', id);
}

export async function deleteReminderByNotificationId(
  notificationId: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM reminders WHERE notification_id = ?',
    notificationId
  );
}
