/**
 * EcoConnect — Auth Users Migration
 *
 * Strategy (safest approach):
 *   1. List all users from old project via Admin API
 *   2. Re-create each user in new project with the same UUID
 *      using createUser({ id, email, email_confirm: true })
 *   3. Trigger password-reset email for every user so they set a
 *      new password on the new instance
 *
 * NOTE: Passwords cannot be transferred (they are hashed with a
 * project-specific secret). Users MUST reset their passwords.
 *
 * Setup:
 *   cp scripts/.env.migrate.example scripts/.env.migrate
 *   node scripts/migrate-auth.mjs
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

// Admin clients (service-role only)
const oldAdmin = createClient(env.OLD_SUPABASE_URL, env.OLD_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const newAdmin = createClient(env.NEW_SUPABASE_URL, env.NEW_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEND_RESET_EMAILS = env.SEND_RESET_EMAILS === 'true'; // set to true when ready

async function listAllUsers() {
  let users = [];
  let page = 1;
  while (true) {
    const { data, error } = await oldAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers page ${page}: ${error.message}`);
    if (!data.users || data.users.length === 0) break;
    users = users.concat(data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  return users;
}

async function main() {
  console.log('EcoConnect auth migration starting...\n');

  const users = await listAllUsers();
  console.log(`Found ${users.length} users in old project\n`);

  const results = { created: 0, skipped: 0, failed: [] };

  for (const user of users) {
    // Check if already exists in new project
    const { data: existing } = await newAdmin.auth.admin.getUserById(user.id);
    if (existing?.user) {
      console.log(`  SKIP  ${user.email} (already exists)`);
      results.skipped++;
      continue;
    }

    // Re-create with same UUID so all foreign keys remain valid
    const { data: created, error: createErr } = await newAdmin.auth.admin.createUser({
      user_id: user.id,       // preserve UUID — critical for FK integrity
      email: user.email,
      email_confirm: true,    // skip confirmation email
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
    });

    if (createErr) {
      console.error(`  FAIL  ${user.email}: ${createErr.message}`);
      results.failed.push({ email: user.email, error: createErr.message });
      continue;
    }

    console.log(`  OK    ${user.email}`);
    results.created++;

    // Send password reset so user can access the new instance
    if (SEND_RESET_EMAILS) {
      const { error: resetErr } = await newAdmin.auth.resetPasswordForEmail(user.email);
      if (resetErr) {
        console.warn(`    → reset email failed: ${resetErr.message}`);
      } else {
        console.log(`    → reset email sent`);
      }
    }
  }

  console.log('\n──────────────────────────────');
  console.log(`Created : ${results.created}`);
  console.log(`Skipped : ${results.skipped}`);
  console.log(`Failed  : ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log('\nFailed users:');
    results.failed.forEach(f => console.log(`  ${f.email} — ${f.error}`));
  }

  if (!SEND_RESET_EMAILS) {
    console.log('\n⚠  SEND_RESET_EMAILS=false — users need to reset passwords manually.');
    console.log('   Set SEND_RESET_EMAILS=true in .env.migrate and re-run to send emails.');
  }
}

main().catch(err => {
  console.error('\nAuth migration failed:', err.message);
  process.exit(1);
});
