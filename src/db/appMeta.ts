import { getDb } from './database';
import type { AppMeta } from '../types';

export async function getAppMeta(key: string): Promise<AppMeta | null> {
  const db = await getDb();
  return db.getFirstAsync<AppMeta>('SELECT key, value FROM app_meta WHERE key = ?', key);
}

export async function setAppMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    key, value
  );
}

export async function deleteAppMeta(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM app_meta WHERE key = ?', key);
}

export async function getAllAppMeta(): Promise<AppMeta[]> {
  const db = await getDb();
  return db.getAllAsync<AppMeta>('SELECT key, value FROM app_meta');
}

export async function getAppMetaValue(key: string): Promise<string | null> {
  const row = await getAppMeta(key);
  return row?.value ?? null;
}
