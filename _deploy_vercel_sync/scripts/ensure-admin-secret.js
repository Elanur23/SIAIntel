/**
 * ADMIN_SECRET yoksa .env.local içine rastgele bir tane yazar.
 * Çalıştırma: node scripts/ensure-admin-secret.js
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const envPath = path.join(process.cwd(), '.env.local')
const secret = crypto.randomBytes(32).toString('base64')
const line = `ADMIN_SECRET=${secret}`

let content = ''
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, 'utf-8')
  if (/\bADMIN_SECRET\s*=/.test(content)) {
    content = content.replace(/\bADMIN_SECRET\s*=.*/g, line)
  } else {
    content = content.trimEnd() + (content.endsWith('\n') ? '' : '\n') + '\n# Admin panel (ensure-admin-secret.js)\n' + line + '\n'
  }
} else {
  content = '# Auto-generated admin secret\n' + line + '\n'
}

fs.writeFileSync(envPath, content, 'utf-8')
console.log('ADMIN_SECRET has been set in .env.local')
