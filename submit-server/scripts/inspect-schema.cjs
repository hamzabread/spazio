const path = require('path');
const sqlite3Path = path.resolve(__dirname, '..', '..', 'ghost-local', 'versions', '6.37.1', 'node_modules', '.pnpm', 'sqlite3@5.1.7', 'node_modules', 'sqlite3');
const sqlite3 = require(sqlite3Path).verbose();
const DB_PATH = path.resolve(__dirname, '..', '..', 'ghost-local', 'content', 'data', 'ghost-local.db');
const db = new sqlite3.Database(DB_PATH);

function all(sql) {
  return new Promise((res, rej) => db.all(sql, (e, r) => e ? rej(e) : res(r)));
}

(async () => {
  for (const t of ['integrations', 'api_keys', 'roles']) {
    console.log('===', t, '===');
    const cols = await all(`PRAGMA table_info(${t})`);
    cols.forEach(c => console.log(`  ${c.name}\t${c.type}\tnotnull=${c.notnull}\tdflt=${c.dflt_value}`));
  }
  console.log('=== existing integrations ===');
  console.log(await all('SELECT id, name, slug, type FROM integrations'));
  console.log('=== existing admin keys ===');
  console.log(await all("SELECT id, integration_id, type FROM api_keys WHERE type='admin'"));
  console.log('=== roles ===');
  console.log(await all("SELECT id, name FROM roles WHERE name LIKE '%Integration%' OR name = 'Owner' OR name = 'Administrator'"));
  db.close();
})();
