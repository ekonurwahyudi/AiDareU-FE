# SEO Setup Guide - AiDareU

## 📋 Checklist untuk Index di Google

### 1. ✅ Files yang Sudah Dibuat

- [x] `public/robots.txt` - Instruksi untuk web crawler
- [x] `src/app/sitemap.ts` - Dynamic sitemap generator
- [x] `src/app/manifest.ts` - PWA manifest untuk SEO
- [x] `src/lib/structuredData.ts` - Schema.org helpers
- [x] Root Layout SEO metadata sudah lengkap

### 2. 🔍 Submit ke Google Search Console

#### Langkah-langkah:

1. **Buka Google Search Console**
   - Kunjungi: https://search.google.com/search-console
   - Login dengan akun Google

2. **Tambahkan Property**
   - Klik "Add Property"
   - Pilih "URL prefix"
   - Masukkan: `https://aidareu.com`

3. **Verifikasi Kepemilikan**

   **Opsi A: HTML File Upload**
   - Download file verifikasi dari Google
   - Upload ke `/public/` folder
   - Deploy website
   - Klik "Verify"

   **Opsi B: HTML Tag** (Recommended)
   - Copy meta tag verifikasi
   - Tambahkan ke `src/app/layout.tsx` di dalam `<head>`:
   ```tsx
   <meta name="google-site-verification" content="KODE_DARI_GOOGLE" />
   ```

   **Opsi C: Google Analytics**
   - Jika sudah ada Google Analytics
   - Pilih opsi ini dan verify

4. **Submit Sitemap**
   - Setelah verified, buka menu "Sitemaps"
   - Tambahkan sitemap URL: `https://aidareu.com/sitemap.xml`
   - Klik "Submit"

5. **Request Indexing**
   - Buka menu "URL Inspection"
   - Masukkan URL: `https://aidareu.com`
   - Klik "Request Indexing"
   - Ulangi untuk halaman penting lainnya

### 3. 📊 Setup Google Analytics (Optional tapi Recommended)

1. Buat property di Google Analytics 4
2. Copy Measurement ID (format: G-XXXXXXXXXX)
3. Tambahkan di `.env.local`:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

4. Buat file `src/lib/gtag.ts`:
   ```typescript
   export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

   export const pageview = (url: string) => {
     if (typeof window !== 'undefined' && window.gtag) {
       window.gtag('config', GA_MEASUREMENT_ID!, {
         page_path: url,
       })
     }
   }
   ```

5. Tambahkan script di `src/app/layout.tsx`:
   ```tsx
   <Script
     src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
     strategy="afterInteractive"
   />
   <Script id="google-analytics" strategy="afterInteractive">
     {`
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', '${GA_MEASUREMENT_ID}');
     `}
   </Script>
   ```

### 4. 🚀 Optimasi Tambahan

#### A. Core Web Vitals
- ✅ Images sudah menggunakan Next.js Image (optimized)
- ✅ Layout sudah responsive
- ⚠️ Cek performance di PageSpeed Insights: https://pagespeed.web.dev/

#### B. Meta Tags per Halaman
Setiap halaman penting sudah punya metadata yang bagus:
- ✅ Home page
- ✅ Store pages (`/s/[subdomain]`)
- ⚠️ Product pages - pastikan ada metadata unik per produk

#### C. Internal Linking
- Pastikan semua halaman terhubung dengan internal links
- Gunakan breadcrumb navigation
- Link ke halaman terkait di dalam konten

#### D. Mobile-Friendly
- ✅ Responsive design sudah diimplementasi
- Test di: https://search.google.com/test/mobile-friendly

### 5. 📝 URL Structure yang SEO-Friendly

Sudah diimplementasi:
- ✅ `/s/[subdomain]` - Store pages
- ✅ `/store/[slug]` - Product pages dengan slug yang descriptive
- ✅ `/domain-checker` - Landing pages

### 6. 🔗 Backlinks & Social Signals

Tingkatkan authority domain dengan:
- Submit ke direktori bisnis Indonesia
- Share di social media (Facebook, Instagram, Twitter, LinkedIn)
- Guest posting di blog terkait
- Kolaborasi dengan influencer UMKM

### 7. ⚡ Monitoring & Tracking

Setelah submit, monitor di:
1. **Google Search Console**
   - Coverage issues
   - Performance (impressions, clicks, CTR)
   - Mobile usability

2. **Google Analytics** (jika sudah setup)
   - Traffic sources
   - User behavior
   - Conversion tracking

### 8. 📅 Timeline Indexing

- **Minggu 1-2**: Google mulai crawl sitemap
- **Minggu 2-4**: Halaman mulai muncul di hasil pencarian
- **Bulan 1-3**: Ranking mulai stabil
- **Bulan 3+**: Optimasi berkelanjutan

### 9. ⚠️ Troubleshooting

Jika belum terindex setelah 2 minggu:

1. **Cek robots.txt**
   ```
   https://aidareu.com/robots.txt
   ```
   Pastikan tidak memblokir Googlebot

2. **Cek Sitemap**
   ```
   https://aidareu.com/sitemap.xml
   ```
   Pastikan dapat diakses dan valid

3. **Manual Request Indexing**
   - Di Google Search Console
   - URL Inspection Tool
   - Request indexing untuk setiap halaman penting

4. **Cek Server Response**
   - Pastikan website return 200 OK
   - Tidak ada 404 atau 500 errors
   - HTTPS aktif dan valid

### 10. 🎯 Keywords Target (Indonesia)

Pastikan konten mengandung keywords:
- "website toko online gratis"
- "buat website tanpa coding"
- "platform UMKM Indonesia"
- "toko online Indonesia"
- "website builder Indonesia"
- "domain gratis Indonesia"
- "e-commerce Indonesia"

## 📞 Support

Jika ada masalah dengan indexing:
1. Cek Google Search Console untuk error messages
2. Gunakan URL Inspection Tool
3. Submit feedback di Search Console

---

**Last Updated**: December 2024
**Version**: 1.0
