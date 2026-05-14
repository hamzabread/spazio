#!/usr/bin/env node
/*
 * Reads the Ghost SQLite DB and prints an Admin API key for the "Press Release
 * Submissions" custom integration. If the integration doesn't exist yet, it
 * creates one. Output is a single line: <id>:<secret> (the format Ghost
 * Admin API consumers expect).
 *
 * Run from D:\officework\spazio\submit-server:
 *   node scripts/extract-or-create-key.cjs
 */
const path = require('path');
const crypto = require('crypto');

const sqlite3Path = path.resolve(
  __dirname,
  '..',
  '..',
  'ghost-local',
  'versions',
  '6.37.1',
  'node_modules',
  '.pnpm',
  'sqlite3@5.1.7',
  'node_modules',
  'sqlite3'
);

const sqlite3 = require(sqlite3Path).verbose();

const DB_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'ghost-local',
  'content',
  'data',
  'ghost-local.db'
);

const INTEGRATION_NAME = 'Press Release Submissions';
const INTEGRATION_SLUG = 'press-release-submissions';

const db = new sqlite3.Database(DB_PATH);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

function makeObjectId() {
  // 24 hex chars, matches Ghost ObjectID format
  return crypto.randomBytes(12).toString('hex');
}

function makeSecret() {
  // 64 hex chars — Ghost stores admin key secrets as 64-char hex
  return crypto.randomBytes(32).toString('hex');
}

(async () => {
  try {
    let integration = await get(
      'SELECT id FROM integrations WHERE slug = ? OR name = ? LIMIT 1',
      [INTEGRATION_SLUG, INTEGRATION_NAME]
    );

    if (!integration) {
      const ownerUser = await get(
        "SELECT id FROM users WHERE id IN (SELECT user_id FROM roles_users WHERE role_id IN (SELECT id FROM roles WHERE name = 'Owner')) LIMIT 1"
      );
      const ownerId = ownerUser ? ownerUser.id : '1';
      const integrationId = makeObjectId();
      const now = new Date().toISOString().replace('T', ' ').replace(/\..+$/, '');
      await run(
        `INSERT INTO integrations (id, type, name, slug, icon_image, description, created_at, updated_at)
         VALUES (?, 'custom', ?, ?, NULL, NULL, ?, ?)`,
        [integrationId, INTEGRATION_NAME, INTEGRATION_SLUG, now, now]
      );
      integration = { id: integrationId };
      process.stderr.write(`[key-setup] created integration "${INTEGRATION_NAME}" (id=${integrationId})\n`);
    } else {
      process.stderr.write(`[key-setup] reusing existing integration (id=${integration.id})\n`);
    }

    let adminKey = await get(
      "SELECT id, secret FROM api_keys WHERE integration_id = ? AND type = 'admin' LIMIT 1",
      [integration.id]
    );

    if (!adminKey) {
      const adminRole = await get("SELECT id FROM roles WHERE name = 'Admin Integration' LIMIT 1");
      const roleId = adminRole ? adminRole.id : null;
      const keyId = makeObjectId();
      const secret = makeSecret();
      const now = new Date().toISOString().replace('T', ' ').replace(/\..+$/, '');
      await run(
        `INSERT INTO api_keys (id, type, secret, role_id, integration_id, user_id, last_seen_at, last_seen_version, created_at, updated_at)
         VALUES (?, 'admin', ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
        [keyId, secret, roleId, integration.id, now, now]
      );
      adminKey = { id: keyId, secret };
      process.stderr.write(`[key-setup] created new admin api_key (id=${keyId})\n`);
    } else {
      process.stderr.write(`[key-setup] reusing existing admin api_key (id=${adminKey.id})\n`);
    }

    // The Ghost Admin API consumes "<keyId>:<secret>"
    process.stdout.write(`${adminKey.id}:${adminKey.secret}\n`);
    db.close();
  } catch (err) {
    process.stderr.write(`[key-setup] ERROR: ${err.message}\n`);
    process.exit(1);
  }
})();
