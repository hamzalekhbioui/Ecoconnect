/**
 * EcoConnect — Storage Migration
 *
 * Downloads every file from old project's buckets and re-uploads
 * to the new project, preserving paths.
 *
 * Setup:
 *   cp scripts/.env.migrate.example scripts/.env.migrate
 *   node scripts/migrate-storage.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const BUCKETS = ['avatars', 'community-covers', 'post-media', 'chat-attachments'];

async function listAllFiles(bucket, prefix = '') {
  const { data, error } = await OLD.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
  if (!data) return [];

  let files = [];
  for (const item of data) {
    if (item.id == null) {
      // It's a folder
      const sub = await listAllFiles(bucket, prefix ? `${prefix}/${item.name}` : item.name);
      files = files.concat(sub);
    } else {
      files.push(prefix ? `${prefix}/${item.name}` : item.name);
    }
  }
  return files;
}

async function downloadFile(bucket, path) {
  const { data, error } = await OLD.storage.from(bucket).download(path);
  if (error) throw new Error(`download ${bucket}/${path}: ${error.message}`);
  return data; // Blob
}

async function uploadFile(bucket, path, blob) {
  const contentType = blob.type || 'application/octet-stream';
  const { error } = await NEW.storage.from(bucket).upload(path, blob, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`upload ${bucket}/${path}: ${error.message}`);
}

async function migrateBucket(bucket) {
  console.log(`\nBucket: ${bucket}`);
  const files = await listAllFiles(bucket);
  console.log(`  ${files.length} files found`);

  const results = { ok: 0, failed: [] };

  for (const path of files) {
    try {
      process.stdout.write(`  → ${path} ... `);
      const blob = await downloadFile(bucket, path);
      await uploadFile(bucket, path, blob);
      process.stdout.write('OK\n');
      results.ok++;
    } catch (err) {
      process.stdout.write(`FAIL: ${err.message}\n`);
      results.failed.push({ path, error: err.message });
    }
  }

  console.log(`  Migrated: ${results.ok}/${files.length}`);
  if (results.failed.length > 0) {
    console.log('  Failed files:');
    results.failed.forEach(f => console.log(`    ${f.path} — ${f.error}`));
  }
  return results;
}

async function main() {
  console.log('EcoConnect storage migration starting...\n');

  let totalOk = 0;
  let totalFailed = 0;

  for (const bucket of BUCKETS) {
    const { ok, failed } = await migrateBucket(bucket);
    totalOk += ok;
    totalFailed += failed.length;
  }

  console.log('\n──────────────────────────────');
  console.log(`Total migrated : ${totalOk}`);
  console.log(`Total failed   : ${totalFailed}`);

  if (totalFailed > 0) {
    console.log('\nRe-run the script to retry failed files (upsert is safe).');
  } else {
    console.log('\nAll files migrated successfully.');
  }
}

main().catch(err => {
  console.error('\nStorage migration failed:', err.message);
  process.exit(1);
});
