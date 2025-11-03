# Frontend Fetch Credentials Fix - Complete List

## 🚨 SEMUA FILE YANG PERLU FIX

**Issue:** Fetch calls ke backend API **TIDAK include `credentials: 'include'`**

**Impact:** Session cookies tidak di-save/send, menyebabkan 401 Unauthorized errors

---

## 📝 Files yang Perlu Ditambahkan `credentials: 'include'`

### Authentication Files (CRITICAL - MUST FIX)

1. **src/views/pages/auth/LoginV1Simple.tsx**
   - Line: 70
   - Endpoint: `/api/auth/login`
   - Status: ❌ MISSING credentials

2. **src/views/Login.tsx**
   - Line: 138
   - Endpoint: `/api/auth/login`
   - Status: ❌ MISSING credentials

3. **src/views/pages/auth/RegisterV1Simple.tsx**
   - Line: 135
   - Endpoint: `/api/auth/register`
   - Status: ❌ MISSING credentials

4. **src/views/pages/auth/RegisterV1.tsx**
   - Line: 119
   - Endpoint: `/api/auth/register`
   - Status: ❌ MISSING credentials

5. **src/views/Register.tsx**
   - Line: 168
   - Endpoint: `/api/auth/register`
   - Status: ❌ MISSING credentials

6. **src/views/pages/auth/ForgotPasswordV1.tsx**
   - Line: 67
   - Endpoint: `/api/auth/forgot-password`
   - Status: ❌ MISSING credentials

7. **src/views/pages/auth/ResetPasswordV1.tsx**
   - Line: 141
   - Endpoint: `/api/auth/reset-password`
   - Status: ❌ MISSING credentials

8. **src/views/pages/auth/TwoStepsV1.tsx**
   - Line: 99, 128, 186
   - Endpoints: `/api/auth/verify-email`, `/api/auth/login`, `/api/auth/resend-verification`
   - Status: ❌ MISSING credentials (3 fetch calls)

9. **src/components/layout/shared/UserDropdown.tsx**
   - Line: 97
   - Endpoint: `/api/auth/logout`
   - Status: ❌ MISSING credentials

10. **src/app/(dashboard)/dashboard/page.tsx**
    - Line: 60
    - Endpoint: `/api/auth/me`
    - Status: ❌ MISSING credentials

---

## 🔧 HOW TO FIX

### Pattern yang Harus Difix

**BEFORE (WRONG):**
```typescript
const response = await fetch(`${backendUrl}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ... })
})
```

**AFTER (CORRECT):**
```typescript
const response = await fetch(`${backendUrl}/api/auth/login`, {
  method: 'POST',
  credentials: 'include',  // ← ADD THIS LINE
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ... })
})
```

---

## 🎯 Detailed Fix for Each File

### 1. LoginV1Simple.tsx (Line 70)

```diff
  const response = await fetch(`${backendUrl}/api/auth/login`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password
    })
  })
```

### 2. Login.tsx (Line 138)

```diff
  const response = await fetch(`${backendUrl}/api/auth/login`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password
    })
  })
```

### 3. RegisterV1Simple.tsx (Line 135)

```diff
  const response = await fetch(`${backendUrl}/api/auth/register`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ... })
  })
```

### 4. RegisterV1.tsx (Line 119)

```diff
  const response = await fetch(`${backendUrl}/api/auth/register`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ... })
  })
```

### 5. Register.tsx (Line 168)

```diff
  const response = await fetch('/api/auth/register', {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ... })
  })
```

### 6. ForgotPasswordV1.tsx (Line 67)

```diff
  const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: data.email })
  })
```

### 7. ResetPasswordV1.tsx (Line 141)

```diff
  const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ... })
  })
```

### 8. TwoStepsV1.tsx (3 fixes needed)

**Line 99:**
```diff
  const response = await fetch(`${backendUrl}/api/auth/verify-email`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ... })
  })
```

**Line 128:**
```diff
  const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ... })
  })
```

**Line 186:**
```diff
  const response = await fetch(`${backendUrl}/api/auth/resend-verification`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ... })
  })
```

### 9. UserDropdown.tsx (Line 97)

```diff
  fetch(`${backendUrl}/api/auth/logout`, {
    method: 'POST',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
```

### 10. dashboard/page.tsx (Line 60)

```diff
  const response = await fetch('/api/auth/me', {
    method: 'GET',
+   credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
```

---

## ⚡ QUICK FIX with Find & Replace

### Step 1: Backup Files

```bash
cd frontend
git stash  # Save current changes if any
git checkout -b fix/add-credentials-to-fetch
```

### Step 2: Manual Fix (Recommended)

Open each file and add `credentials: 'include',` after `method: 'POST'` or `method: 'GET'`.

### Step 3: OR Use sed (Linux/Mac/Git Bash)

**⚠️ CAREFUL - TEST FIRST!**

```bash
# For files with POST method
find src -name "*.tsx" -type f -exec sed -i "s/method: 'POST',$/&\n    credentials: 'include',/g" {} +

# For files with GET method
find src -name "*.tsx" -type f -exec sed -i "s/method: 'GET',$/&\n    credentials: 'include',/g" {} +
```

**BETTER:** Do it manually for safety!

---

## 🧪 Testing After Fix

### 1. Rebuild Frontend

```bash
cd frontend
npm run build
```

### 2. Clear Browser Data

- Ctrl + Shift + Delete
- Clear cookies & cache

### 3. Test Login

1. Go to https://aidareu.com/login
2. Open DevTools (F12) > Network tab
3. Login with valid credentials
4. Check request to `/api/auth/login`:

**Request Headers (should include):**
```
credentials: include
```

**Response Headers (should include):**
```
Set-Cookie: laravel_session=xxx; Domain=.aidareu.com; ...
Set-Cookie: XSRF-TOKEN=xxx; Domain=.aidareu.com; ...
```

5. Check DevTools > Application > Cookies:
   - Domain: `.aidareu.com`
   - Cookie: `laravel_session`
   - Cookie: `XSRF-TOKEN`

6. Check Console - NO errors:
   - ✅ No 401 Unauthorized
   - ✅ No JSON.parse errors
   - ✅ `/api/users/me` returns 200 OK

---

## 📊 Summary

**Total files to fix:** 10 files
**Total fetch calls to fix:** 13 calls

### Priority (Fix in Order)

**HIGH PRIORITY (Must Fix First):**
1. ✅ LoginV1Simple.tsx
2. ✅ Login.tsx
3. ✅ UserDropdown.tsx (logout)
4. ✅ dashboard/page.tsx (auth check)

**MEDIUM PRIORITY:**
5. ✅ RegisterV1Simple.tsx
6. ✅ RegisterV1.tsx
7. ✅ Register.tsx

**LOW PRIORITY (But Still Important):**
8. ✅ ForgotPasswordV1.tsx
9. ✅ ResetPasswordV1.tsx
10. ✅ TwoStepsV1.tsx

---

## ✅ Checklist

**Code Changes:**
- [ ] Fix LoginV1Simple.tsx (line 70)
- [ ] Fix Login.tsx (line 138)
- [ ] Fix RegisterV1Simple.tsx (line 135)
- [ ] Fix RegisterV1.tsx (line 119)
- [ ] Fix Register.tsx (line 168)
- [ ] Fix ForgotPasswordV1.tsx (line 67)
- [ ] Fix ResetPasswordV1.tsx (line 141)
- [ ] Fix TwoStepsV1.tsx (lines 99, 128, 186)
- [ ] Fix UserDropdown.tsx (line 97)
- [ ] Fix dashboard/page.tsx (line 60)

**Build & Deploy:**
- [ ] Test locally (`npm run dev`)
- [ ] Build for production (`npm run build`)
- [ ] Commit changes
- [ ] Push to repository
- [ ] Deploy to EasyPanel

**Testing:**
- [ ] Clear browser cache & cookies
- [ ] Test login flow
- [ ] Verify cookies are set
- [ ] Verify no 401 errors
- [ ] Test registration
- [ ] Test logout
- [ ] Test forgot password

---

## 🎯 Git Commit Message

```bash
git add src/views/pages/auth/*.tsx
git add src/views/Login.tsx
git add src/views/Register.tsx
git add src/components/layout/shared/UserDropdown.tsx
git add src/app/(dashboard)/dashboard/page.tsx

git commit -m "Fix: Add credentials: 'include' to all auth fetch calls

- Add credentials: 'include' to login, register, logout fetch calls
- Fix session cookie not being saved/sent to backend
- Resolve 401 Unauthorized errors on authenticated requests
- Fix JSON.parse errors caused by HTML 401 responses

This enables session-based authentication with cookies across
frontend (aidareu.com) and backend (api.aidareu.com) domains.

Files modified:
- LoginV1Simple.tsx
- Login.tsx
- RegisterV1Simple.tsx, RegisterV1.tsx, Register.tsx
- ForgotPasswordV1.tsx, ResetPasswordV1.tsx
- TwoStepsV1.tsx (3 fetch calls)
- UserDropdown.tsx (logout)
- dashboard/page.tsx (auth check)

Fixes issue where login was successful but subsequent API calls
returned 401 because session cookies were not being stored/sent.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin fix/add-credentials-to-fetch
```

---

## 🚀 Next Steps

1. **Fix all 10 files** listed above
2. **Test locally** dengan `npm run dev`
3. **Commit & push** ke repository
4. **Deploy** ke EasyPanel
5. **Test** di production

**Estimated Time:** 30-45 minutes untuk fix semua files

---

**IMPORTANT:** Ini adalah **frontend-only fix**. Backend sudah correct, hanya perlu update environment variables di EasyPanel (seperti yang sudah di dokumentasikan di `EASYPANEL_DEPLOYMENT_FIX.md`).
