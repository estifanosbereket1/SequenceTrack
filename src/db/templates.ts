import { getDb } from './database';
import type { Template, TemplateStep, TemplateBlock, BlockType } from '../types';

export async function getAllTemplates(): Promise<Template[]> {
  const db = await getDb();
  return await db.getAllAsync<Template>(
    'SELECT * FROM templates ORDER BY updated_at DESC'
  );
}

export async function getTemplate(id: number): Promise<Template | null> {
  const db = await getDb();
  return (await db.getFirstAsync<Template>(
    'SELECT * FROM templates WHERE id = ?', id
  )) ?? null;
}

export async function createTemplate(
  title: string,
  description: string
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO templates (title, description) VALUES (?, ?)',
    title, description
  );
  return result.lastInsertRowId;
}

export async function updateTemplate(
  id: number,
  title: string,
  description: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE templates SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ?",
    title, description, id
  );
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM templates WHERE id = ?', id);
}

export async function getTemplateSteps(templateId: number): Promise<TemplateStep[]> {
  const db = await getDb();
  const steps = await db.getAllAsync<TemplateStep>(
    'SELECT * FROM template_steps WHERE template_id = ? ORDER BY order_index',
    templateId
  );
  const stepsWithBlocks = await Promise.all(
    steps.map(async (step) => ({
      ...step,
      blocks: await db.getAllAsync<TemplateBlock>(
        'SELECT * FROM template_blocks WHERE step_id = ? ORDER BY order_index',
        step.id
      ),
    }))
  );
  return stepsWithBlocks;
}

export async function createTemplateStep(
  templateId: number,
  title: string
): Promise<number> {
  const db = await getDb();
  const maxOrder = await db.getFirstAsync<{ max: number }>(
    'SELECT COALESCE(MAX(order_index), -1) as max FROM template_steps WHERE template_id = ?',
    templateId
  );
  const result = await db.runAsync(
    'INSERT INTO template_steps (template_id, order_index, title) VALUES (?, ?, ?)',
    templateId, (maxOrder?.max ?? -1) + 1, title
  );
  return result.lastInsertRowId;
}

export async function updateTemplateStep(
  id: number,
  title: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE template_steps SET title = ?, updated_at = datetime('now') WHERE id = ?",
    title, id
  );
}

export async function deleteTemplateStep(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM template_steps WHERE id = ?', id);
}

export async function reorderTemplateStep(
  id: number,
  newOrderIndex: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE template_steps SET order_index = ? WHERE id = ?',
    newOrderIndex, id
  );
}

export async function createTemplateBlock(
  stepId: number,
  type: BlockType,
  textContent: string | null,
  uri: string | null,
  label: string | null,
): Promise<number> {
  const db = await getDb();
  const maxOrder = await db.getFirstAsync<{ max: number }>(
    'SELECT COALESCE(MAX(order_index), -1) as max FROM template_blocks WHERE step_id = ?',
    stepId
  );
  const result = await db.runAsync(
    'INSERT INTO template_blocks (step_id, order_index, type, text_content, uri, label) VALUES (?, ?, ?, ?, ?, ?)',
    stepId, (maxOrder?.max ?? -1) + 1, type, textContent, uri, label
  );
  return result.lastInsertRowId;
}

export async function updateTemplateBlock(
  id: number,
  textContent: string | null,
  label: string | null,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE template_blocks SET text_content = ?, label = ? WHERE id = ?',
    textContent, label, id
  );
}

export async function deleteTemplateBlock(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM template_blocks WHERE id = ?', id);
}

export async function reorderTemplateBlock(
  id: number,
  newOrderIndex: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE template_blocks SET order_index = ? WHERE id = ?',
    newOrderIndex, id
  );
}
