# 🚀 Quick SEO Checklist - AiDareU

## ✅ Files Created (Sudah Selesai)

- ✅ `public/robots.txt` - Web crawler instructions
- ✅ `src/app/sitemap.ts` - Dynamic sitemap (auto-updates)
- ✅ `src/app/manifest.ts` - PWA manifest
- ✅ `src/lib/structuredData.ts` - Schema.org helpers
- ✅ `scripts/generate-sitemap.js` - Static sitemap generator
- ✅ Root layout metadata sudah optimal

## 📍 URLs yang Penting

| File | URL | Status |
|------|-----|--------|
| Sitemap | https://aidareu.com/sitemap.xml | ✅ Auto-generated |
| Robots | https://aidareu.com/robots.txt | ✅ Static file |
| Manifest | https://aidareu.com/manifest.webmanifest | ✅ Auto-generated |

## 🎯 Next Steps (Action Required)

### 1. Google Search Console Setup
```
🔗 https://search.google.com/search-console
```

**Steps:**
1. Add property: `https://aidareu.com`
2. Verify ownership (HTML tag atau file upload)
3. Submit sitemap: `https://aidareu.com/sitemap.xml`
4. Request indexing untuk homepage

**Estimasi waktu:** 10-15 menit

### 2. Verify Sitemap Works

After deploy, test these URLs:
```bash
# Should show robots.txt content
https://aidareu.com/robots.txt

# Should show XML sitemap
https://aidareu.com/sitemap.xml

# Should show JSON manifest
https://aidareu.com/manifest.webmanifest
```

### 3. Optional: Google Analytics

1. Create GA4 property
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

## 🛠️ Commands

```bash
# Generate static sitemap (optional)
npm run generate:sitemap

# Build and deploy
npm run build
npm start

# Development
npm run dev
```

## 📊 Monitoring

After submission, check these:

**Google Search Console (Weekly)**
- Coverage: Halaman yang terindex
- Performance: Clicks, impressions, CTR
- Issues: Errors atau warnings

**Tools untuk Testing:**
- PageSpeed: https://pagespeed.web.dev/
- Mobile-Friendly: https://search.google.com/test/mobile-friendly
- Rich Results: https://search.google.com/test/rich-results

## ⏱️ Timeline Indexing

| Waktu | Milestone |
|-------|-----------|
| Day 1 | Submit sitemap ke GSC |
| Day 2-7 | Google mulai crawl |
| Week 2-4 | Halaman mulai muncul di search |
| Month 1-3 | Ranking mulai stabil |

## 🎯 Target Keywords

Primary keywords untuk konten:
- "website toko online gratis"
- "buat website tanpa coding"
- "platform UMKM Indonesia"
- "website builder Indonesia"
- "toko online Indonesia"

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Sitemap not found | Deploy ulang, pastikan `src/app/sitemap.ts` ada |
| Robots.txt blocked | Cek `public/robots.txt` tidak block Googlebot |
| Pages not indexed | Manual request via URL Inspection Tool |
| Slow indexing | Submit individual URLs, add backlinks |

## 📞 Quick Help

**Error dengan sitemap.ts?**
```bash
# Check sitemap locally
npm run dev
# Visit: http://localhost:3000/sitemap.xml
```

**Robots.txt tidak muncul?**
```bash
# Verify file exists
ls -la public/robots.txt
# Visit: http://localhost:3000/robots.txt
```

---

**Priority Actions:**
1. ⭐ Deploy website
2. ⭐ Submit ke Google Search Console
3. ⭐ Request indexing homepage
4. Optional: Setup Google Analytics

**Time needed:** ~30 minutes total
