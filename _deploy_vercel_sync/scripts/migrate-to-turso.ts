/**
 * SQLite to Turso Migration Script
 * 
 * Migrates data from local SQLite database to Turso production database.
 * 
 * Usage:
 *   1. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.production
 *   2. Run: npx tsx scripts/migrate-to-turso.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

// Source: Local SQLite
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
})

// Target: Turso
const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

if (!tursoUrl || !tursoToken) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN')
  console.error('Set these in .env.production or environment variables')
  process.exit(1)
}

const libsql = createClient({
  url: tursoUrl,
  authToken: tursoToken,
})

const adapter = new PrismaLibSQL(libsql)
const targetPrisma = new PrismaClient({ adapter })

interface MigrationStats {
  table: string
  count: number
  success: boolean
  error?: string
}

async function migrateTable<T extends Record<string, any>>(
  tableName: string,
  sourceData: T[],
  targetModel: any
): Promise<MigrationStats> {
  try {
    console.log(`\n📦 Migrating ${tableName}...`)
    console.log(`   Found ${sourceData.length} records`)

    if (sourceData.length === 0) {
      return { table: tableName, count: 0, success: true }
    }

    // Insert in batches of 100
    const batchSize = 100
    let migrated = 0

    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize)
      
      await targetModel.createMany({
        data: batch,
        skipDuplicates: true,
      })

      migrated += batch.length
      console.log(`   ✓ Migrated ${migrated}/${sourceData.length}`)
    }

    return { table: tableName, count: migrated, success: true }
  } catch (error) {
    console.error(`   ❌ Error migrating ${tableName}:`, error)
    return {
      table: tableName,
      count: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function main() {
  console.log('🚀 Starting SQLite → Turso Migration\n')
  console.log(`Source: file:./prisma/dev.db`)
  console.log(`Target: ${tursoUrl}\n`)

  // Check if source database exists
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Source database not found:', dbPath)
    console.error('Run: npx prisma db push')
    process.exit(1)
  }

  const stats: MigrationStats[] = []

  try {
    // Test connections
    console.log('🔍 Testing connections...')
    await sourcePrisma.$queryRaw`SELECT 1`
    console.log('✓ Source SQLite connected')
    
    await targetPrisma.$queryRaw`SELECT 1`
    console.log('✓ Target Turso connected\n')

    // Migrate tables in order (respecting foreign keys)
    
    // 1. Users (no dependencies)
    const users = await sourcePrisma.user.findMany()
    stats.push(await migrateTable('User', users, targetPrisma.user))

    // 2. Sessions (depends on User)
    const sessions = await sourcePrisma.session.findMany()
    stats.push(await migrateTable('Session', sessions, targetPrisma.session))

    // 3. BackupCodes (depends on User)
    const backupCodes = await sourcePrisma.backupCode.findMany()
    stats.push(await migrateTable('BackupCode', backupCodes, targetPrisma.backupCode))

    // 4. RecoveryCodes (depends on User)
    const recoveryCodes = await sourcePrisma.recoveryCode.findMany()
    stats.push(await migrateTable('RecoveryCode', recoveryCodes, targetPrisma.recoveryCode))

    // 5. PasswordHistory (depends on User)
    const passwordHistory = await sourcePrisma.passwordHistory.findMany()
    stats.push(await migrateTable('PasswordHistory', passwordHistory, targetPrisma.passwordHistory))

    // 6. BlockedIP (no dependencies)
    const blockedIPs = await sourcePrisma.blockedIP.findMany()
    stats.push(await migrateTable('BlockedIP', blockedIPs, targetPrisma.blockedIP))

    // 7. RateLimit (no dependencies)
    const rateLimits = await sourcePrisma.rateLimit.findMany()
    stats.push(await migrateTable('RateLimit', rateLimits, targetPrisma.rateLimit))

    // 8. AuditLog (no dependencies)
    const auditLogs = await sourcePrisma.auditLog.findMany()
    stats.push(await migrateTable('AuditLog', auditLogs, targetPrisma.auditLog))

    // 9. WarRoomArticle (no dependencies)
    const articles = await sourcePrisma.warRoomArticle.findMany()
    stats.push(await migrateTable('WarRoomArticle', articles, targetPrisma.warRoomArticle))

    // 10. Comment (depends on WarRoomArticle)
    const comments = await sourcePrisma.comment.findMany()
    stats.push(await migrateTable('Comment', comments, targetPrisma.comment))

    // 11. DistributionJob (no dependencies)
    const jobs = await sourcePrisma.distributionJob.findMany()
    stats.push(await migrateTable('DistributionJob', jobs, targetPrisma.distributionJob))

    // 12. DistributionVariant (depends on DistributionJob)
    const variants = await sourcePrisma.distributionVariant.findMany()
    stats.push(await migrateTable('DistributionVariant', variants, targetPrisma.distributionVariant))

    // 13. GlossaryTerm (no dependencies)
    const glossary = await sourcePrisma.glossaryTerm.findMany()
    stats.push(await migrateTable('GlossaryTerm', glossary, targetPrisma.glossaryTerm))

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary')
    console.log('='.repeat(60))

    let totalRecords = 0
    let successCount = 0
    let failCount = 0

    stats.forEach(stat => {
      const status = stat.success ? '✅' : '❌'
      console.log(`${status} ${stat.table.padEnd(20)} ${stat.count} records`)
      
      if (stat.success) {
        totalRecords += stat.count
        successCount++
      } else {
        failCount++
        if (stat.error) {
          console.log(`   Error: ${stat.error}`)
        }
      }
    })

    console.log('='.repeat(60))
    console.log(`Total Records Migrated: ${totalRecords}`)
    console.log(`Successful Tables: ${successCount}/${stats.length}`)
    console.log(`Failed Tables: ${failCount}`)
    console.log('='.repeat(60))

    if (failCount > 0) {
      console.log('\n⚠️  Migration completed with errors')
      console.log('Review failed tables and retry if needed')
      process.exit(1)
    } else {
      console.log('\n✅ Migration completed successfully!')
      console.log('\nNext steps:')
      console.log('1. Update DATABASE_URL in .env.production')
      console.log('2. Deploy to production')
      console.log('3. Verify data in Turso dashboard')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sourcePrisma.$disconnect()
    await targetPrisma.$disconnect()
  }
}

main()
