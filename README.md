# ShiftForce — Aplikasi Absensi dan Penggajian Karyawan

Aplikasi manajemen absensi dan penggajian berbasis web untuk owner dan karyawan. Dibangun dengan React + TypeScript (frontend) dan Go/Gin (backend).

---

## Fitur

**Owner:**
- Login via PIN
- Dashboard ringkasan kehadiran harian
- Kelola data karyawan (tambah, edit, nonaktifkan)
- Kelola data outlet/cabang dengan geofencing
- Log absensi lengkap dengan foto bukti
- Rekap penggajian otomatis dengan export Excel
- Cetak slip gaji PDF per karyawan

**Karyawan:**
- Login via PIN
- Absen masuk & keluar dengan foto + validasi lokasi GPS
- Riwayat absensi pribadi

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Go, Gin Framework |
| Database | Supabase |
| Storage | Supabase |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## Struktur Project

```
ClecoPii-absensi-v2/
├── backend/          # Go/Gin REST API
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── helpers/
│   ├── structs/
│   ├── middlewares/
│   ├── .env.example
│   └── main.go
└── frontend/         # React + TypeScript
    ├── src/
    │   ├── views/
    │   ├── hooks/
    │   ├── services/
    │   └── types.ts
    ├── .env.example
    └── package.json
```

---

## Prerequisites

Pastikan sudah terinstall:
- [Go](https://go.dev/dl/) >= 1.21
- [Node.js](https://nodejs.org/) >= 18
- Akun [Supabase](https://supabase.com) untuk database & storage foto

---

## Setup Supabase

### 1. Buat project di Supabase
Masuk ke [supabase.com](https://supabase.com) → New Project

### 2. Buat bucket storage
Storage → New Bucket → nama: `attendance-photos` → set sebagai **Public**

### 3. Catat credentials
Dari Settings → API, catat:
- **Project URL** → untuk `SUPABASE_URL`
- **service_role key** → untuk `SUPABASE_KEY`

Dari Settings → Database, catat:
- **Connection string (URI)** → untuk `DB_URL`
  - Pilih mode **Transaction** (port 6543) untuk kompatibilitas PgBouncer

---

## Setup Backend

### 1. Masuk ke folder backend
```bash
cd backend
```

### 2. Install dependencies 
```bash
go mod tidy
```

### 3. Buat file `.env`
```bash
touch .env
```

Isi nilai di `.env`:
```env
# Koneksi Database PostgreSQL Supabase
# Ambil dari Supabase Dashboard → Connect → Direct → Transaction pooler
# Supabase biasanya memberi format:
# postgresql://postgres.project-ref:[YOUR-PASSWORD]@xxx.pooler.supabase.com:6543/postgres
#
# Ubah ke format DSN berikut:
DB_URL="host=xxx.pooler.supabase.com user=postgres.xxx password=PASSWORD_DATABASE dbname=postgres port=6543 sslmode=require"

# Konfigurasi Aplikasi
APP_PORT=3000
JWT_SECRET=isi_dengan_string_random_panjang_minimal_32_karakter

# Supabase Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=service_role_key_dari_supabase
SUPABASE_BUCKET=attendance-photos
```

### 4. Jalankan backend
```bash
go run main.go
```

Backend berjalan di `http://localhost:3000`

> Database akan otomatis ter-migrasi saat pertama kali dijalankan (GORM AutoMigrate).

### 5. Buat akun Owner pertama
```bash
curl -X POST http://localhost:3000/api/seed
```
PIN default owner: `123456` — **ganti segera setelah login pertama**.

---

## Setup Frontend

### 1. Masuk ke folder frontend
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Buat file `.env.local`
```bash
cp .env.example .env.local
```

Isi nilai di `.env.local`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Jalankan frontend
```bash
npm run dev
```

Frontend berjalan di `http://localhost:5173`

---

## Deploy

### Backend → Railway

1. Buka [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Pilih repo ini → set **Root Directory** ke `backend`
3. Set environment variables di Railway dashboard:

```
APP_PORT=3000
DB_URL=<connection string Supabase>
JWT_SECRET=<string random panjang>
SUPABASE_URL=<project URL Supabase>
SUPABASE_KEY=<service role key Supabase>
SUPABASE_BUCKET=attendance-photos
```

4. Catat URL yang digenerate Railway, contoh: `https://clecopii.railway.app`

### Frontend → Vercel

1. Buka [vercel.com](https://vercel.com) → New Project → Import dari GitHub
2. Set **Root Directory** ke `frontend`
3. Set environment variable di Vercel dashboard:

```
VITE_API_URL=https://clecopii.railway.app/api
```

4. Deploy

### Setelah deploy — update CORS

Tambahkan URL Vercel ke `backend/routes/router.go`:
```go
AllowOrigins: []string{
    "http://localhost:5173",
    "https://nama-app.vercel.app", // ← tambahkan URL Vercel kamu
},
```

Commit dan push → Railway auto-redeploy.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Keterangan |
|---|---|
| `DB_URL` | Connection string PostgreSQL Supabase (Transaction mode) |
| `APP_PORT` | Port server (default: 3000) |
| `JWT_SECRET` | Secret key untuk JWT token (min 32 karakter) |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_KEY` | Service role key Supabase |
| `SUPABASE_BUCKET` | Nama bucket storage (default: attendance-photos) |

### Frontend (`frontend/.env.local`)

| Variable | Keterangan |
|---|---|
| `VITE_API_URL` | URL backend API |

---

## Lisensi

MIT License — lihat file [LICENSE](LICENSE)