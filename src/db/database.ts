import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('processtracker.db');

  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  );

  const currentRow = await database.getFirstAsync<{ version: number }>(
    'SELECT COALESCE(MAX(version), 0) as version FROM _migrations'
  );
  const currentVersion = currentRow?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      for (const stmt of migration.statements) {
        await database.execAsync(stmt);
      }
      await database.runAsync(
        'INSERT INTO _migrations (version) VALUES (?)',
        migration.version
      );
    }
  }
}
