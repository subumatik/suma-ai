# Demodex AI 🧬

> Yapay zeka destekli Demodex akarı analizi ve dermatoloji asistanı platformu.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB)](https://react.dev/)
[![MUI](https://img.shields.io/badge/MUI-v9-007FFF)](https://mui.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748)](https://prisma.io/)

---

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji Stack'i](#teknoloji-stacki)
- [Ekran Görüntüleri](#ekran-görüntüleri)
- [Kurulum](#kurulum)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Veritabanı Şeması](#veritabanı-şeması)
- [Vektör Veritabanı](#vektör-veritabanı)
- [Auth & Güvenlik](#auth--güvenlik)
- [Deploy](#deploy)
- [Mimari](#mimari)
- [Lisans](#lisans)

---

## ✨ Özellikler

- 🔬 **AI Destekli Analiz** — YOLOv26 ile akar tespiti, Gemma 4 ile Türkçe/İngilizce klinik rapor
- 📊 **Dashboard** — Gerçek zamanlı istatistikler ve son analizler
- 👤 **Hasta Yönetimi** — SHA-256 anonim hash ile hasta kayıtları, CRUD işlemleri
- 📝 **Klinik Form** — 12 değişkenli analiz formu (yaş, cinsiyet, kaşınma, kızarıklık, stres, uyku vb.)
- 📈 **Analiz Takibi** — Progress bar ile canlı durum izleme (Bekleniyor → İşleniyor → Tamamlandı)
- 📄 **Raporlama** — PDF, JSON ve FHIR/HL7 formatında rapor çıktısı
- 🔄 **Geri Bildirim** — Doktor düzeltmeleri ile aktif öğrenme döngüsü (ground truth)
- 🔍 **Benzer Vaka Arama** — pgvector ile cosine similarity tabanlı vektör araması
- 🌙 **Karanlık/Aydınlık Tema** — MUI v9 CSS theme variables ile anlık tema değişimi
- 🔐 **Supabase Auth** — JWT tabanlı güvenli kimlik doğrulama, RLS ile satır bazlı yetkilendirme

---

## 🛠 Teknoloji Stack'i

| Katman | Teknoloji |
|--------|-----------|
| **Framework** | Next.js 16.2.4 (App Router) |
| **UI** | React 19.2.5 + MUI v9 + TypeScript |
| **Styling** | MUI CSS Variables + Turbopack |
| **Auth** | Supabase Auth (SSR) + PKCE flow |
| **Database** | Supabase PostgreSQL 17 |
| **ORM** | Prisma 7.8 |
| **Vektör DB** | pgvector (768-boyutlu embeddingler) |
| **Storage** | Cloudflare R2 (planlanıyor) |
| **AI/ML** | YOLOv26 + Gemma 4 Multimodal (backend) |

---

## 📸 Ekran Görüntüleri

> Yakında eklenecek...

---

## 🚀 Kurulum

### 1. Repo'yu klonla

```bash
git clone https://github.com/subumatik/suma-ai.git
cd suma-ai
```

### 2. Bağımlılıkları kur

```bash
npm install
```

### 3. Prisma Client üret

```bash
npx prisma generate
```

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## 🔑 Ortam Değişkenleri

`.env.local` dosyası oluştur ve aşağıdaki değerleri ekle:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://twzvqzyxshznzwlnbxyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Prisma (opsiyonel, server-side kullanım için)
DATABASE_URL=postgresql://postgres:[password]@db.twzvqzyxshznzwlnbxyh.supabase.co:5432/postgres

# Cloudflare R2 (ileride)
# R2_BUCKET_NAME=
# R2_ACCOUNT_ID=
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
```

---

## 🗄 Veritabanı Şeması

### Temel Tablolar

```
auth.users ──────► profiles (trigger ile otomatik)
                     │
                     ├──► patients ────► analyses ────► clinical_forms
                     │                    │
                     │                    ├──► analysis_results
                     │                    ├──► doctor_feedback
                     │                    ├──► reports
                     │                    └──► embeddings
                     │
                     └──► audit_logs
```

### Tablo Özeti

| Tablo | Amaç |
|-------|------|
| `profiles` | Auth kullanıcı profili (isim, klinik, rol) |
| `patients` | Hasta kaydı (anonim hash, yaş, cinsiyet, notlar) |
| `analyses` | Analiz isteği (görüntü URL, durum, progress) |
| `clinical_forms` | 12 klinik değişken formu |
| `analysis_results` | AI sonuçları (YOLO, Gemma raporu, SHAP, Grad-CAM) |
| `doctor_feedback` | Doktor onay/düzeltme (ground truth) |
| `reports` | PDF/JSON/FHIR rapor kayıtları |
| `audit_logs` | KVKK denetim logları |
| `embeddings` | Klinik/görüntü vektörleri (pgvector) |

---

## 🔍 Vektör Veritabanı

**pgvector** extension ile 768-boyutlu embedding saklama:

```sql
-- Benzer vaka arama
SELECT * FROM search_similar_cases(
  query_embedding := '[0.1, 0.2, ...]'::vector(768),
  match_type := 'clinical',
  match_count := 5
);
```

- **İndeks**: `ivfflat` (cosine similarity)
- **Etiketler**: `demodex`, `healthy`, `rosacea`, `acne`, ...
- **Model**: `biomedclip` (şimdilik)

---

## 🔐 Auth & Güvenlik

- **Supabase SSR Auth** — `@supabase/ssr` paketi, cookie tabanlı session
- **PKCE Flow** — Güvenli OAuth kod değişimi
- **RLS (Row Level Security)** — Her kullanıcı sadece kendi verisini görebilir
- **Proxy Pattern** — Next.js 16.2 `proxy.ts` ile token refresh
- **JWT Validasyon** — `getUser()` ile her istekte sunucu tarafında doğrulama

---

## 🌐 Deploy

### Vercel

1. [Vercel Dashboard](https://vercel.com)'a git
2. `subumatik/suma-ai` repo'sunu import et
3. Environment Variables ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy 🚀

---

## 🏗 Mimari

[Demodex_AI_Mimari_v2.html](Demodex_AI_Mimari_v2.html) dosyasını tarayıcıda açarak tam teknik mimari diyagramını inceleyebilirsiniz.

### Genel Akış

```
Doktor Arayüzü
    │
    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Next.js    │────►│  Supabase   │────►│  PostgreSQL │
│  Frontend   │     │  Auth/DB    │     │  + pgvector │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │  AI Backend │
                    │ YOLO + Gemma│
                    └─────────────┘
```

### Adımlar

1. **Girdi** — Mikroskobik / dermoskopik / klinik görüntü + 12 değişken form
2. **Kalite Kontrol** — Netlik, aydınlık, çözünürlük kontrolü
3. **Ön İşleme** — CLAHE, 640×640 resize, TTA
4. **YOLOv26** — Akar tespiti, sayım, konumlama
5. **Klinik Kodlayıcı** — SHAP ile risk faktörleri
6. **Gemma 4** — Türkçe/İngilizce klinik rapor üretimi
7. **XAI** — Grad-CAM, SHAP, doğal dil açıklaması
8. **Rapor** — PDF + JSON + FHIR çıktısı
9. **Geri Bildirim** — Doktor düzeltmeleri → aktif öğrenme havuzu

---

## 🧪 Geliştirme

### Kod Stili

```bash
# Lint
npm run lint

# Build
npm run build

# Prisma güncelle
npx prisma generate
```

### Önemli Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `src/proxy.ts` | Auth token refresh (Next.js 16.2 proxy) |
| `src/lib/supabase/server.ts` | Server-side Supabase client |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `prisma/schema.prisma` | Database şeması |
| `src/app/(app)/layout.tsx` | Protected layout (auth check) |

---

## 👤 Yazar

**Subutay Matik** — [subumatik@gmail.com](mailto:subumatik@gmail.com)

---

## 📄 Lisans

Bu proje özel lisans altındadır. Tüm hakları saklıdır.

---

<p align="center">
  <sub>Demodex AI Platform v2 — YOLOv26 + Gemma 4 Multimodal Hibrit Sistem</sub>
</p>
