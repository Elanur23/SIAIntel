/**
 * Routing Conflict Checker
 * Scans the app/ directory for known conflicting route patterns.
 * Usage: node scripts/check-routing-conflicts.js
 */

const fs = require('fs')
const path = require('path')

const APP_DIR = path.join(process.cwd(), 'app')

// Known conflicting routes (from .gitignore)
const CONFLICTING_ROUTES = [
  'app/news/[slug]',
  'app/[lang]/news/[id]'
]

function checkConflicts() {
  console.log('🔍 Checking for routing conflicts...\n')

  let conflicts = 0

  for (const route of CONFLICTING_ROUTES) {
    const fullPath = path.join(process.cwd(), route)
    if (fs.existsSync(fullPath)) {
      console.error(`❌ CONFLICT: ${route} exists and may cause routing issues`)
      conflicts++
    }
  }

  // Check for duplicate page files in same segment
  const langDir = path.join(APP_DIR, '[lang]')
  if (fs.existsSync(langDir)) {
    const subDirs = fs.readdirSync(langDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    for (const sub of subDirs) {
      // Check if same route exists at root level too
      const rootEquivalent = path.join(APP_DIR, sub)
      if (fs.existsSync(rootEquivalent)) {
        const hasLangPage = fs.existsSync(path.join(langDir, sub, 'page.tsx')) ||
                           fs.existsSync(path.join(langDir, sub, 'page.ts'))
        const hasRootPage = fs.existsSync(path.join(rootEquivalent, 'page.tsx')) ||
                           fs.existsSync(path.join(rootEquivalent, 'page.ts'))

        if (hasLangPage && hasRootPage) {
          console.warn(`⚠️  POSSIBLE CONFLICT: app/${sub}/ and app/[lang]/${sub}/ both have page files`)
          conflicts++
        }
      }
    }
  }

  console.log('')

  if (conflicts > 0) {
    console.error(`❌ Found ${conflicts} routing conflict(s). Run "npm run fix:routes" to resolve.`)
    process.exit(1)
  } else {
    console.log('✅ No routing conflicts found.')
  }
}

checkConflicts()
