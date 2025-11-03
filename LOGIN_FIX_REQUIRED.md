# Login Issue - Missing `credentials: 'include'` in Fetch

## 🚨 MASALAH DITEMUKAN

Login tidak berhasil karena **fetch request tidak mengirim credentials (cookies)**.

### File yang Bermasalah

**File:** `frontend/src/views/pages/auth/LoginV1Simple.tsx`

**Baris:** 70-79

**Kode saat ini:**
```typescript
const response = await fetch(`${backendUrl}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: data.email,
    password: data.password
  })
})
```

### ❌ Masalahnya

Fetch **TIDAK** include `credentials: 'include'`, sehingga:

1. **Browser tidak mengirim cookies** existing (jika ada)
2. **Browser tidak menyimpan cookies** yang di-set oleh backend
3. **Session tidak ter-establish** antara frontend dan backend
4. **Subsequent requests** ke `/api/users/me`, `/api/rbac/permissions/me`, dll **GAGAL dengan 401**

### Error yang Terjadi

Dari screenshot Anda:
```
GET https://aidareu.com/api/users/me
❌ Failed to fetch user data from API: 401

GET https://aidareu.com/api/rbac/permissions/me
❌ HTTP/2 401

GET https://aidareu.com/api/rbac/roles
❌ HTTP/2 401

❌ Login error: SyntaxError: JSON.parse: unexpected character at line 1 column 1 of the JSON data
```

**Root cause:**
1. Login request tidak set session cookie (karena tidak ada `credentials: 'include'`)
2. Subsequent requests tidak kirim session cookie
3. Backend return 401 Unauthorized
4. 401 response kadang berupa HTML error page (bukan JSON)
5. JSON.parse gagal karena mencoba parse HTML

---

## ✅ SOLUSI

### Yang Harus Ditambahkan

Di file `LoginV1Simple.tsx` line 70, tambahkan `credentials: 'include'`:

```typescript
const response = await fetch(`${backendUrl}/api/auth/login`, {
  method: 'POST',
  credentials: 'include',  // ← TAMBAHKAN INI
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: data.email,
    password: data.password
  })
})
```

### Kenapa `credentials: 'include'` Penting?

Untuk **session-based authentication** dengan cookies:

1. **Mengirim cookies** yang sudah ada ke server
2. **Menyimpan cookies** baru dari server (Set-Cookie header)
3. **Mendukung CORS** dengan credentials
4. **Memastikan session** konsisten across requests

### Browser Behavior

**Tanpa `credentials: 'include'`:**
```
Request Headers:
  (no Cookie header)

Response Headers:
  Set-Cookie: laravel_session=xxx; Domain=.aidareu.com; ...

Browser: ❌ IGNORE Set-Cookie (karena fetch tidak include credentials)
```

**Dengan `credentials: 'include'`:**
```
Request Headers:
  (no Cookie header - first time)

Response Headers:
  Set-Cookie: laravel_session=xxx; Domain=.aidareu.com; ...

Browser: ✅ SAVE cookie untuk domain .aidareu.com

Next Request:
  Cookie: laravel_session=xxx  ← Cookie automatically sent!
```

---

## 🔍 File Lain yang Perlu Dicek

Grep untuk semua fetch calls yang perlu `credentials: 'include'`:

### Files yang Kemungkinan Perlu Fix

1. **Login related:**
   - `src/views/pages/auth/LoginV1Simple.tsx` ← **CONFIRMED ISSUE**
   - `src/views/Login.tsx` (if exists)

2. **Register related:**
   - `src/views/pages/auth/RegisterV1.tsx`
   - `src/views/pages/auth/RegisterV1Simple.tsx`

3. **Auth related:**
   - `src/views/pages/auth/ForgotPasswordV1.tsx`
   - `src/views/pages/auth/ResetPasswordV1.tsx`
   - `src/views/pages/auth/TwoStepsV1.tsx`

4. **API calls:**
   - Any file making API calls to backend
   - Check all `fetch()` calls
   - Should include `credentials: 'include'`

### Search Command

```bash
# Search for fetch without credentials
grep -r "fetch(" frontend/src --include="*.tsx" --include="*.ts" | grep -v "credentials"
```

---

## 📝 Best Practice

### Create API Helper Function

**Recommended:** Buat fungsi helper untuk standardize fetch:

**File:** `src/utils/apiClient.ts`

```typescript
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`

  const defaultOptions: RequestInit = {
    credentials: 'include', // Always include credentials
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, defaultOptions)

  if (!response.ok) {
    // Handle non-OK responses
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const error = await response.json()
      throw new Error(error.message || `HTTP ${response.status}`)
    } else {
      // Non-JSON response (probably HTML error page)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  return response.json()
}
```

**Usage:**

```typescript
// Before
const response = await fetch(`${backendUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
const result = await response.json()

// After
const result = await apiClient('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})
```

---

## 🧪 Testing After Fix

### 1. Clear Browser Data

**Chrome/Edge:**
- Ctrl + Shift + Delete
- Check "Cookies" and "Cached images"
- Clear data

### 2. Test Login

1. Open DevTools (F12) > Network tab
2. Go to https://aidareu.com/login
3. Enter credentials
4. Click Login
5. Check Network tab:

**Request to `/api/auth/login`:**
```
Request Headers:
  (first time - no cookies yet)

Response Headers:
  Set-Cookie: laravel_session=xxx; Domain=.aidareu.com; Secure; HttpOnly; SameSite=None
  Set-Cookie: XSRF-TOKEN=xxx; Domain=.aidareu.com; Secure; SameSite=None
```

**Next Request to `/api/users/me`:**
```
Request Headers:
  Cookie: laravel_session=xxx; XSRF-TOKEN=xxx  ← Should be present!

Response:
  200 OK
  { "status": "success", "data": { ... } }
```

### 3. Verify Cookies

DevTools > Application > Cookies > https://aidareu.com

Should see:
- `laravel_session`
  - Domain: `.aidareu.com`
  - Secure: ✓
  - HttpOnly: ✓
  - SameSite: `None`

- `XSRF-TOKEN`
  - Domain: `.aidareu.com`
  - Secure: ✓
  - SameSite: `None`

### 4. Verify No 401 Errors

After login:
- ✅ `/api/users/me` → 200 OK
- ✅ `/api/rbac/permissions/me` → 200 OK
- ✅ `/api/rbac/roles` → 200 OK
- ✅ No JSON.parse errors

---

## 🔧 Quick Fix Summary

**Minimal change needed:**

**File:** `frontend/src/views/pages/auth/LoginV1Simple.tsx`

**Line 70:** Add `credentials: 'include'` to fetch options

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

**After fix:**
1. Save file
2. Rebuild frontend: `npm run build`
3. Restart frontend service
4. Clear browser cache & cookies
5. Test login

---

## ⚠️ IMPORTANT

### Backend Already Correct

Backend configuration sudah benar:
- ✅ CORS allows credentials (`supports_credentials: true`)
- ✅ Sanctum stateful domains configured
- ✅ Session configuration correct

**Yang kurang:** Frontend tidak request credentials dari backend!

### This is a Frontend-Only Issue

- ❌ Frontend: Missing `credentials: 'include'` in fetch
- ✅ Backend: Already configured correctly for sessions

---

## 📋 Checklist

**Frontend Fix:**
- [ ] Add `credentials: 'include'` to login fetch (LoginV1Simple.tsx)
- [ ] Check other auth files (register, forgot password, etc.)
- [ ] Consider creating apiClient helper function
- [ ] Rebuild frontend
- [ ] Deploy to EasyPanel

**Testing:**
- [ ] Clear browser cache & cookies
- [ ] Test login flow
- [ ] Verify cookies are set with correct domain
- [ ] Verify `/api/users/me` returns 200 OK (not 401)
- [ ] No JSON.parse errors in console

**Backend (Already Done):**
- ✅ CORS configuration correct
- ✅ Sanctum configuration correct
- ✅ Session configuration correct
- ✅ Environment variables correct (after EasyPanel update)

---

## 🎯 Root Cause Analysis

**Timeline:**

1. User klik "Login"
2. Frontend fetch `/api/auth/login` **WITHOUT `credentials: 'include'`**
3. Backend authenticate user → return JSON + Set session cookies
4. **Browser IGNORES Set-Cookie** karena fetch tidak include credentials
5. Frontend redirect ke dashboard
6. Dashboard load → fetch `/api/users/me` **WITHOUT cookies**
7. Backend check auth → No session cookie → **401 Unauthorized**
8. Backend return 401 (kadang HTML error page)
9. Frontend try to JSON.parse HTML → **SyntaxError**

**Fix:**

Add `credentials: 'include'` → Browser akan save & send cookies → Session works ✅

---

**Status:** ⚠️ **CODE FIX REQUIRED** di frontend

File ini hanya dokumentasi. Perubahan actual code diperlukan di `LoginV1Simple.tsx`.
