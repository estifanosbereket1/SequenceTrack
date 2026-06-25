export const MIGRATIONS = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS template_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS template_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        step_id INTEGER NOT NULL REFERENCES template_steps(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL DEFAULT 0,
        type TEXT NOT NULL CHECK(type IN ('text','checklist_item','photo','link','file')),
        text_content TEXT,
        uri TEXT,
        label TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS instances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
        name TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started','in_progress','done')),
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS instance_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id INTEGER NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
        template_step_id INTEGER,
        order_index INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started','in_progress','done')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS instance_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_step_id INTEGER NOT NULL REFERENCES instance_steps(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL DEFAULT 0,
        type TEXT NOT NULL CHECK(type IN ('text','checklist_item','photo','link','file')),
        text_content TEXT,
        uri TEXT,
        label TEXT,
        completed INTEGER,
        completed_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id INTEGER NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
        instance_step_id INTEGER REFERENCES instance_steps(id) ON DELETE SET NULL,
        title TEXT NOT NULL DEFAULT '',
        scheduled_at TEXT NOT NULL,
        repeat_rule TEXT,
        notification_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ],
  },
  {
    version: 2,
    statements: [
      `CREATE TABLE IF NOT EXISTS learnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        body_markdown TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS learning_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_id INTEGER NOT NULL REFERENCES learnings(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL DEFAULT 0,
        type TEXT NOT NULL CHECK(type IN ('photo','file','voice')),
        uri TEXT NOT NULL,
        label TEXT,
        caption TEXT,
        duration_seconds REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ],
  },
];
