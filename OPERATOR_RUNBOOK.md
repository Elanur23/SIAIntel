# Operator Runbook

## Strict PECL Runtime Precheck

Run this command before strict-mode publication workflows:

```bash
npx tsx scripts/precheck-pecl-runtime.ts
```

## Notes

- Ensure `SHADOW_MODE=false` and `VALIDATION_STRICT_MODE=true` when validating enforce posture.
- Verify `PECL_SIGNING_KEY_ID`, `PECL_PRIVATE_KEY`, and matching `PECL_PUBLIC_KEY_<KEY_ID>` are loaded.
