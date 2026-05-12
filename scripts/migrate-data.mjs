/**
 * EcoConnect — Data Migration Script
 *
 * Copies all table rows from the OLD Supabase project to the NEW one.
 * Both service-role keys are required. Never commit them.
 *
 * Setup:
 *   cp scripts/.env.migrate.example scripts/.env.migrate
 *   # fill in keys, then:
 *   node scripts/migrate-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load migration env (never committed)
const envPath = resolve(__dirname, '.env.migrate');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
);

const OLD = createClient(env.OLD_SUPABASE_URL, env.OLD_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const NEW = createClient(env.NEW_SUPABASE_URL, env.NEW_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BATCH = 500; // rows per insert batch

async function fetchAll(client, table, select = '*') {
  let rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .range(from, from + BATCH - 1)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`fetch ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows = rows.concat(data);
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return rows;
}

async function insertBatched(table, rows) {
  if (rows.length === 0) {
    console.log(`  ${table}: nothing to insert`);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await NEW.from(table).upsert(batch, { onConflict: 'id' });
    if (error) throw new Error(`insert ${table} batch ${i}: ${error.message}`);
  }
  console.log(`  ${table}: ${rows.length} rows migrated`);
}

// Tables in FK-safe order
const TABLES = [
  'profiles',
  'communities',
  'community_members',
  'posts',
  'post_likes',
  'post_comments',
  'conversations',
  'messages',
  'friendships',
  'community_events',
  'marketplace_listings',
  'reports',
];

async function main() {
  console.log('EcoConnect data migration starting...\n');

  // Disable triggers on new project to avoid member_count double-counting
  console.log('Disabling triggers temporarily...');
  await NEW.rpc('exec_sql', {
    sql: `
      ALTER TABLE community_members DISABLE TRIGGER trg_community_member_count;
      ALTER TABLE messages DISABLE TRIGGER trg_conversation_last_message;
    `,
  }).catch(() => {
    // rpc may not exist — that is OK, triggers will just fire twice
    console.log('  (could not disable triggers via rpc, continuing)');
  });

  for (const table of TABLES) {
    process.stdout.write(`Fetching ${table}...`);
    const rows = await fetchAll(OLD, table);
    process.stdout.write(` ${rows.length} rows → inserting...`);
    await insertBatched(table, rows);
  }

  // Re-sync member_count after bulk insert
  console.log('\nRe-syncing community member counts...');
  const { error: syncErr } = await NEW.rpc('exec_sql', {
    sql: `
      UPDATE communities c
      SET member_count = (
        SELECT COUNT(*) FROM community_members cm
        WHERE cm.community_id = c.id AND cm.status = 'approved'
      );
    `,
  });
  if (syncErr) {
    console.warn('  member_count sync skipped (run manually if needed)');
  }

  console.log('\nDone. Verify row counts in Supabase dashboard.');
}

main().catch(err => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
