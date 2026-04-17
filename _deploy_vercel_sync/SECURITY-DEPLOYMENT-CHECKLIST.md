# Security Features Deployment Checklist

**Use this checklist to deploy the 4 security features to production**

---

## 📋 Pre-Deployment Checklist

### ✅ Code Review
- [ ] All TypeScript files compile without errors
- [ ] No console.error or TODO comments in production code
- [ ] All imports are correct and dependencies installed
- [ ] Code follows project conventions

### ✅ Testing
- [ ] All RBAC tests pass (7 test suites)
- [ ] Integration tests pass
- [ ] Manual API endpoint testing completed
- [ ] Session timeout tested in browser
- [ ] Recovery code flow tested end-to-end

### ✅ Dependencies
- [ ] `bullmq` installed
- [ ] `ioredis` installed
- [ ] `bcryptjs` installed
- [ ] `jest` and test dependencies installed
- [ ] `tsx` installed for worker script

### ✅ Database
- [ ] Prisma migration created
- [ ] Migration tested in development
- [ ] RecoveryCode model verified in schema
- [ ] Backup of production database taken

---

## 🔧 Environment Configuration

### ✅ Required Variables
- [ ] `NEXTAUTH_SECRET` set (production value)
- [ ] `NEXTAUTH_URL` set (production domain)
- [ ] `IDLE_TIMEOUT_MINUTES` set (default: 30)
- [ ] `REDIS_HOST` set
- [ ] `REDIS_PORT` set
- [ ] `REDIS_PASSWORD` set (if required)
- [ ] `SLACK_WEBHOOK_URL` set (for alerts)
- [ ] `DATABASE_URL` set (production database)

### ✅ Verify Variables
```bash
# Check all required variables are set
echo $NEXTAUTH_SECRET
echo $REDIS_HOST
echo $SLACK_WEBHOOK_URL
```

---

## 🗄️ Database Deployment

### ✅ Migration Steps
- [ ] Review migration SQL
- [ ] Test migration on staging database
- [ ] Backup production database
- [ ] Run migration: `npx prisma migrate deploy`
- [ ] Verify RecoveryCode table exists
- [ ] Check indexes are created

### ✅ Verification Queries
```sql
-- Check RecoveryCode table
SELECT * FROM RecoveryCode LIMIT 1;

-- Check indexes
.schema RecoveryCode

-- Verify AuditLog table
SELECT COUNT(*) FROM AuditLog;
```

---

## 🔴 Redis Setup

### ✅ Installation
- [ ] Redis server installed
- [ ] Redis running on correct port
- [ ] Redis accessible from application
- [ ] Redis password configured (if required)
- [ ] Redis persistence enabled

### ✅ Verification
```bash
# Test connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping

# Check memory
redis-cli info memory

# Test authentication (if password set)
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
```

---

## 🚀 Application Deployment

### ✅ Build & Deploy
- [ ] Run type check: `npm run type-check`
- [ ] Run linter: `npm run lint`
- [ ] Build application: `npm run build`
- [ ] Deploy to production server
- [ ] Verify application starts successfully

### ✅ Integration
- [ ] SessionKeepalive added to root layout
- [ ] SessionProvider wraps application
- [ ] Middleware updated and active
- [ ] Auth configuration merged correctly

---

## 🤖 Worker Deployment

### ✅ Setup Worker Process
- [ ] Worker script tested locally
- [ ] Process manager chosen (PM2/systemd)
- [ ] Worker configured to start on boot
- [ ] Worker logs configured
- [ ] Worker restart policy set

### ✅ PM2 Setup (Option 1)
```bash
# Start worker
pm2 start npm --name "audit-cleanup-worker" -- run worker:audit-cleanup

# Save configuration
pm2 save

# Setup startup script
pm2 startup

# Verify running
pm2 list
```

### ✅ Systemd Setup (Option 2)
```bash
# Create service file
sudo nano /etc/systemd/system/audit-cleanup-worker.service

# Enable service
sudo systemctl enable audit-cleanup-worker

# Start service
sudo systemctl start audit-cleanup-worker

# Check status
sudo systemctl status audit-cleanup-worker
```

---

## 🧪 Post-Deployment Testing

### ✅ Feature 1: Idle Timeout
- [ ] Login to application
- [ ] Wait 30 minutes (or configured timeout)
- [ ] Verify session expires
- [ ] Check warning appears at 5 minutes
- [ ] Verify activity resets timer
- [ ] Test `/api/auth/session-status` endpoint

### ✅ Feature 2: RBAC
- [ ] Test viewer cannot access admin routes
- [ ] Test editor cannot access admin routes
- [ ] Test admin can access all routes
- [ ] Verify 403 errors for unauthorized access
- [ ] Check audit logs for authorization failures

### ✅ Feature 3: Audit Cleanup
- [ ] Verify worker is running
- [ ] Check worker logs
- [ ] Trigger manual cleanup (optional)
- [ ] Verify Slack webhook works
- [ ] Check job is scheduled for 02:00
- [ ] Monitor first scheduled run

### ✅ Feature 4: 2FA Recovery
- [ ] Generate recovery codes for test user
- [ ] Verify codes are hashed in database
- [ ] Test login with recovery code
- [ ] Verify code is marked as used
- [ ] Test regeneration endpoint
- [ ] Check audit logs for recovery events

---

## 📊 Monitoring Setup

### ✅ Logging
- [ ] Application logs configured
- [ ] Worker logs accessible
- [ ] Redis logs monitored
- [ ] Audit log retention verified

### ✅ Alerts
- [ ] Slack webhook tested
- [ ] Alert format verified
- [ ] Test failure alert sent
- [ ] Alert recipients configured

### ✅ Metrics
- [ ] Session timeout rate tracked
- [ ] Authorization failure rate tracked
- [ ] Audit cleanup success rate tracked
- [ ] Recovery code usage tracked

---

## 🔒 Security Verification

### ✅ Session Security
- [ ] HTTPS enabled in production
- [ ] Secure cookie flags set
- [ ] Session tokens properly encrypted
- [ ] CSRF protection enabled

### ✅ RBAC Security
- [ ] JWT signature validation working
- [ ] Role tampering prevented
- [ ] Token expiration enforced
- [ ] Authorization logged

### ✅ Recovery Code Security
- [ ] Codes are bcrypt hashed
- [ ] Codes are one-time use
- [ ] Used codes marked, not deleted
- [ ] Recovery attempts logged

### ✅ Audit Security
- [ ] Audit logs immutable
- [ ] Retention policy enforced
- [ ] Sensitive data not logged
- [ ] Access to logs restricted

---

## 📈 Performance Verification

### ✅ Application Performance
- [ ] Session status endpoint < 100ms
- [ ] RBAC middleware < 50ms overhead
- [ ] Recovery code verification < 200ms
- [ ] No memory leaks detected

### ✅ Worker Performance
- [ ] Cleanup job completes < 5 minutes
- [ ] Redis memory usage acceptable
- [ ] No job queue backlog
- [ ] Worker restarts automatically

---

## 🔄 Rollback Plan

### ✅ Preparation
- [ ] Database backup verified
- [ ] Previous deployment tagged
- [ ] Rollback procedure documented
- [ ] Team notified of deployment

### ✅ Rollback Steps (if needed)
1. Stop worker: `pm2 stop audit-cleanup-worker`
2. Revert application deployment
3. Rollback database migration: `npx prisma migrate resolve --rolled-back`
4. Restore environment variables
5. Restart application
6. Verify rollback successful

---

## 📝 Documentation

### ✅ Update Documentation
- [ ] Production URLs documented
- [ ] Environment variables documented
- [ ] Worker setup documented
- [ ] Monitoring procedures documented
- [ ] Troubleshooting guide updated

### ✅ Team Communication
- [ ] Deployment announcement sent
- [ ] Feature documentation shared
- [ ] Training materials prepared
- [ ] Support team briefed

---

## ✅ Final Verification

### ✅ Smoke Tests
- [ ] Application loads successfully
- [ ] Login works
- [ ] Session timeout works
- [ ] RBAC enforcement works
- [ ] Worker is running
- [ ] Alerts are working

### ✅ User Acceptance
- [ ] Test user can login
- [ ] Test user session expires correctly
- [ ] Admin can access admin routes
- [ ] Viewer cannot access admin routes
- [ ] Recovery codes can be generated

---

## 🎉 Deployment Complete

### ✅ Post-Deployment
- [ ] Monitor logs for 24 hours
- [ ] Check error rates
- [ ] Verify worker runs at 02:00
- [ ] Review audit logs
- [ ] Collect user feedback

### ✅ Success Criteria
- [ ] Zero critical errors
- [ ] All features working as expected
- [ ] Performance within acceptable limits
- [ ] No security incidents
- [ ] User satisfaction positive

---

## 📞 Support Contacts

**Technical Issues**:
- Check logs: `pm2 logs audit-cleanup-worker`
- Review audit: `SELECT * FROM AuditLog ORDER BY timestamp DESC`
- Redis status: `redis-cli info`

**Emergency Rollback**:
1. Contact: DevOps team
2. Execute rollback plan
3. Notify stakeholders

---

## 📅 Schedule

**Day 1**: Pre-deployment checks  
**Day 2**: Deploy to staging  
**Day 3**: Test on staging  
**Day 4**: Deploy to production  
**Day 5**: Monitor and verify  
**Day 6**: Review and optimize  
**Day 7**: Final sign-off

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Verified By**: _____________  
**Status**: ⬜ Pending | ⬜ In Progress | ⬜ Complete

---

**Version**: 1.0.0  
**Last Updated**: March 21, 2026
