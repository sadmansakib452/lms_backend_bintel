# 2FA Login Hang Analysis Report

---

## Issue: Login hangs after enabling 2FA

### Logs:
```
Processing job 1 of type sendOtpCodeToEmail with data [object Object]...
Sending OTP code to email
Job 1 with name sendOtpCodeToEmail completed  ← Completed after ~3 seconds
```

---

## Analysis

### What Happened:
1. Login request sent with email + password
2. Backend validated password, checked 2FA enabled
3. Created Redis session `2fa_session:{userId}`
4. Called `mailService.sendOtpCodeToEmail()` with `.catch()` (non-blocking)
5. Threw `UnauthorizedException('2FA token required')`
6. **Login hangs** - response never returned

### Root Cause:

**The Culprit: BullMQ Queue + Async/Await**

Even though we use:
```typescript
this.mailService.sendOtpCodeToEmail({...}).catch(err => console.error(...));
```

The BullMQ queue is still processing synchronously. The email log shows it took 3 seconds to complete - that's blocking time.

### Why It Hangs:

| Step | What Happens | Duration |
|------|--------------|----------|
| 1 | Validate password | Fast |
| 2 | Create Redis session | Fast |
| 3 | Queue email (await) | ~3 seconds |
| 4 | Throw exception | Fast |

The queue's `await` in `sendOtpCodeToEmail` is blocking the response.

---

## Solution

### Option A: Don't use queue for 2FA (Simplest)

Don't queue the 2FA email - send it directly or use a much simpler approach.

### Option B: Pre-generate token before login

Create the 2FA token beforehand (when user enables 2FA) and just send it, don't generate each time.

### Option C: Use existing Ucode system

Store token in Ucode table (like other OTPs), not Redis session. Send via queue is fine because it's separate from login request.

---

## Recommended Fix: Use Ucode (Like Other OTPs)

Instead of Redis session + email queue:
1. Use existing `ucodeRepository.createToken()` (already exists, works like password reset OTP)
2. Send via queue (queue completes in background)
3. Throw exception immediately after queue.add() - don't await

```typescript
// Current (BROKEN):
await this.redis.set(`2fa_session:${user.id}`, sessionToken, 'EX', 300);
await this.mailService.sendOtpCodeToEmail({...}); // Blocks! ← CULPRIT
throw UnauthorizedException('2FA token required');

// FIXED - use Ucode:
const token = await this.ucodeRepository.createToken({ userId: user.id, isOtp: true });
this.mailService.sendOtpCodeToEmail({...}).catch(...); // Non-blocking
throw UnauthorizedException('2FA token required');
```

This way:
- Ucode creation is fast
- Email is queued (non-blocking)
- Exception thrown immediately

---

## Summary

| Issue | Cause |
|-------|-------|
| Login hangs | `mailService.sendOtpCodeToEmail()` is awaited/blocking |
| Email works | Queue processes, but blocks login response |
| Fix | Use Ucode instead of Redis session |

---

**Want me to implement the Ucode fix?**