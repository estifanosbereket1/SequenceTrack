import { getDb } from './database';
import type { Profile } from '../types';

export async function getProfile(): Promise<Profile | null> {
  const db = await getDb();
  return db.getFirstAsync<Profile>('SELECT * FROM profile WHERE id = 1');
}

export async function upsertProfile(name: string, photoUri: string | null): Promise<void> {
  const db = await getDb();
  const existing = await getProfile();
  if (existing) {
    await db.runAsync(
      'UPDATE profile SET name = ?, photo_uri = ?, updated_at = datetime(\'now\') WHERE id = 1',
      name, photoUri
    );
  } else {
    await db.runAsync(
      'INSERT INTO profile (id, name, photo_uri) VALUES (1, ?, ?)',
      name, photoUri
    );
  }
}
