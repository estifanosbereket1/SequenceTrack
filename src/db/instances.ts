import { getDb } from './database';
import type {
  Instance, InstanceStep, InstanceBlock,
  InstanceStatus, StepStatus, BlockType,
} from '../types';

export async function getAllInstances(): Promise<Instance[]> {
  const db = await getDb();
  return await db.getAllAsync<Instance>(
    `SELECT i.*, t.title as template_title
     FROM instances i
     JOIN templates t ON t.id = i.template_id
     ORDER BY i.started_at DESC`
  );
}

export async function getInstance(id: number): Promise<Instance | null> {
  const db = await getDb();
  return (await db.getFirstAsync<Instance>(
    `SELECT i.*, t.title as template_title
     FROM instances i
     JOIN templates t ON t.id = i.template_id
     WHERE i.id = ?`, id
  )) ?? null;
}

export async function createInstance(
  templateId: number,
  name: string,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO instances (template_id, name, status, started_at) VALUES (?, ?, 'in_progress', datetime('now'))",
    templateId, name
  );
  return result.lastInsertRowId;
}

export async function updateInstanceStatus(
  id: number,
  status: InstanceStatus,
): Promise<void> {
  const db = await getDb();
  if (status === 'done') {
    await db.runAsync(
      "UPDATE instances SET status = ?, completed_at = datetime('now') WHERE id = ?",
      status, id
    );
  } else {
    await db.runAsync(
      'UPDATE instances SET status = ? WHERE id = ?',
      status, id
    );
  }
}

export async function deleteInstance(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM instances WHERE id = ?', id);
}

export async function getInstanceSteps(instanceId: number): Promise<InstanceStep[]> {
  const db = await getDb();
  const steps = await db.getAllAsync<InstanceStep>(
    'SELECT * FROM instance_steps WHERE instance_id = ? ORDER BY order_index',
    instanceId
  );
  const stepsWithBlocks = await Promise.all(
    steps.map(async (step) => ({
      ...step,
      blocks: await db.getAllAsync<InstanceBlock>(
        'SELECT * FROM instance_blocks WHERE instance_step_id = ? ORDER BY order_index',
        step.id
      ),
    }))
  );
  return stepsWithBlocks;
}

export async function createInstanceStep(
  instanceId: number,
  templateStepId: number | null,
  orderIndex: number,
  title: string,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO instance_steps (instance_id, template_step_id, order_index, title) VALUES (?, ?, ?, ?)",
    instanceId, templateStepId, orderIndex, title
  );
  return result.lastInsertRowId;
}

export async function updateInstanceStepStatus(
  id: number,
  status: StepStatus,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE instance_steps SET status = ? WHERE id = ?',
    status, id
  );
}

export async function createInstanceBlock(
  instanceStepId: number,
  type: BlockType,
  textContent: string | null,
  uri: string | null,
  label: string | null,
  completed: boolean | null,
): Promise<number> {
  const db = await getDb();
  const maxOrder = await db.getFirstAsync<{ max: number }>(
    'SELECT COALESCE(MAX(order_index), -1) as max FROM instance_blocks WHERE instance_step_id = ?',
    instanceStepId
  );
  const result = await db.runAsync(
    'INSERT INTO instance_blocks (instance_step_id, order_index, type, text_content, uri, label, completed) VALUES (?, ?, ?, ?, ?, ?, ?)',
    instanceStepId, (maxOrder?.max ?? -1) + 1, type, textContent, uri, label, completed ? 1 : null
  );
  return result.lastInsertRowId;
}

export async function updateInstanceBlockChecklist(
  id: number,
  completed: boolean,
): Promise<void> {
  const db = await getDb();
  if (completed) {
    await db.runAsync(
      "UPDATE instance_blocks SET completed = 1, completed_at = datetime('now') WHERE id = ?",
      id
    );
  } else {
    await db.runAsync(
      'UPDATE instance_blocks SET completed = NULL, completed_at = NULL WHERE id = ?',
      id
    );
  }
}

export async function deleteInstanceBlock(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM instance_blocks WHERE id = ?', id);
}

export async function deepCopyTemplateToInstance(
  templateId: number,
  instanceName: string,
): Promise<number> {
  const db = await getDb();

  const instanceId = await createInstance(templateId, instanceName);
  const { getTemplateSteps } = await import('./templates');
  const templateSteps = await getTemplateSteps(templateId);

  for (const step of templateSteps) {
    const stepId = await createInstanceStep(
      instanceId, step.id, step.order_index, step.title
    );
    for (const block of step.blocks) {
      await db.runAsync(
        'INSERT INTO instance_blocks (instance_step_id, order_index, type, text_content, uri, label, completed) VALUES (?, ?, ?, ?, ?, ?, ?)',
        stepId, block.order_index, block.type, block.text_content, block.uri, block.label, null
      );
    }
  }

  return instanceId;
}
