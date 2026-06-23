import { getDb } from './database';
import type { Learning, LearningAttachment, LearningAttachmentType } from '../types';

export async function getAllLearnings(): Promise<Learning[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Learning>(
    'SELECT * FROM learnings ORDER BY created_at DESC'
  );
  const withAttachments = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      attachments: await db.getAllAsync<LearningAttachment>(
        'SELECT * FROM learning_attachments WHERE learning_id = ? ORDER BY order_index',
        row.id
      ),
    }))
  );
  return withAttachments;
}

export async function getLearning(id: number): Promise<Learning | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Learning>(
    'SELECT * FROM learnings WHERE id = ?', id
  );
  if (!row) return null;
  row.attachments = await db.getAllAsync<LearningAttachment>(
    'SELECT * FROM learning_attachments WHERE learning_id = ? ORDER BY order_index',
    row.id
  );
  return row;
}

export async function createLearning(
  title: string | null,
  bodyMarkdown: string,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO learnings (title, body_markdown) VALUES (?, ?)',
    title, bodyMarkdown
  );
  return result.lastInsertRowId;
}

export async function updateLearning(
  id: number,
  title: string | null,
  bodyMarkdown: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE learnings SET title = ?, body_markdown = ?, updated_at = datetime('now') WHERE id = ?",
    title, bodyMarkdown, id
  );
}

export async function deleteLearning(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM learnings WHERE id = ?', id);
}

export async function createLearningAttachment(
  learningId: number,
  type: LearningAttachmentType,
  uri: string,
  label: string | null,
  caption: string | null,
  durationSeconds: number | null,
): Promise<number> {
  const db = await getDb();
  const maxOrder = await db.getFirstAsync<{ max: number }>(
    'SELECT COALESCE(MAX(order_index), -1) as max FROM learning_attachments WHERE learning_id = ?',
    learningId
  );
  const result = await db.runAsync(
    'INSERT INTO learning_attachments (learning_id, order_index, type, uri, label, caption, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)',
    learningId, (maxOrder?.max ?? -1) + 1, type, uri, label, caption, durationSeconds
  );
  return result.lastInsertRowId;
}

export async function deleteLearningAttachment(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM learning_attachments WHERE id = ?', id);
}

export async function getLearningAttachments(learningId: number): Promise<LearningAttachment[]> {
  const db = await getDb();
  return await db.getAllAsync<LearningAttachment>(
    'SELECT * FROM learning_attachments WHERE learning_id = ? ORDER BY order_index',
    learningId
  );
}
