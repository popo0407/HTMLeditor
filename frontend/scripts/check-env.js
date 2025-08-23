// Simple env checker for build diagnostics
const fs = require('fs');
const path = require('path');

const envFile = path.resolve(__dirname, '..', '.env.production');
console.log('[env-check] Checking for', envFile);
if (!fs.existsSync(envFile)) {
  console.error('[env-check] ERROR: .env.production not found at', envFile);
  process.exit(2);
}
const content = fs.readFileSync(envFile, 'utf8');
console.log('[env-check] .env.production content:\n' + content.replace(/\r\n/g, '\n'));
const m = content.match(/^REACT_APP_API_URL=(.*)$/m);
if (!m || !m[1] || m[1].trim() === '') {
  console.error('[env-check] ERROR: REACT_APP_API_URL is missing or empty in .env.production');
  process.exit(3);
}
console.log('[env-check] REACT_APP_API_URL=', m[1]);
console.log('[env-check] OK: environment looks good.');
process.exit(0);
