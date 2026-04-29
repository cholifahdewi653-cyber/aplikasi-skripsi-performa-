# 🚀 Project Setup Guide

Panduan lengkap untuk melakukan pull, instalasi, dan menjalankan project ini secara lokal.

---

## 📋 Prerequisites

Pastikan kamu sudah menginstall tools berikut sebelum memulai:

- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [npm](https://www.npmjs.com/) atau [Bun](https://bun.sh/)
- [Git](https://git-scm.com/)
- Database PostgreSQL (lokal atau cloud)
- Akun [Cloudinary](https://cloudinary.com/) (untuk upload media)

---

## 📥 1. Clone / Pull Repository

### Clone pertama kali

```bash
git clone https://github.com/username/nama-repo.git
cd nama-repo
```

### Pull update terbaru (jika sudah pernah clone)

```bash
git pull origin main
```

---

## 📦 2. Install Dependencies

Pilih salah satu package manager:

### Menggunakan npm

```bash
npm install
```

### Menggunakan Bun

```bash
bun install
```

---

## ⚙️ 3. Konfigurasi Environment Variables

Buat file `.env` di root project, lalu isi dengan konfigurasi berikut:

```dotenv
# ============================================================
# DATABASE
# ============================================================
# Ganti USER, PASSWORD, PORT, dan DB_NAME sesuai konfigurasi PostgreSQL kamu
DATABASE_URL="postgresql://USER:PASSWORD@localhost:PORT/DB_NAME"

# Contoh:
# DATABASE_URL="postgresql://postgres:rahasia123@localhost:5432/mydb"

# ============================================================
# SERVER
# ============================================================
PORT=3000

# ============================================================
# JWT
# ============================================================
# Ganti dengan string acak yang kuat (minimal 32 karakter)
JWT_SECRET="JWT_SECRET"

# ============================================================
# CLOUDINARY
# ============================================================
# Dapatkan kredensial ini dari dashboard Cloudinary kamu:
# https://cloudinary.com/console
CLOUDINARY_API_KEY=CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET
CLOUDINARY_NAME=CLOUDINARY_NAME
```

> **Cara mendapatkan kredensial Cloudinary:**
>
> 1. Daftar / login di [cloudinary.com](https://cloudinary.com)
> 2. Buka **Dashboard**
> 3. Salin nilai **Cloud Name**, **API Key**, dan **API Secret**

---

## 🗄️ 4. Setup Database dengan Prisma

### Generate Prisma Client

```bash
npx prisma generate
```

### Jalankan Migrasi Database

```bash
npx prisma migrate dev
```

> Perintah ini akan membuat tabel-tabel di database sesuai skema Prisma.

### (Opsional) Lihat isi database via Prisma Studio

```bash
npx prisma studio
```

---

## ▶️ 5. Menjalankan Aplikasi

### Mode Development (dengan auto-reload)

```bash
# Menggunakan npm
npm run dev

# Menggunakan Bun
bun run dev
```

### Mode Production

```bash
# Menggunakan npm
npm start

# Menggunakan Bun
bun start
```

Server akan berjalan di: **http://localhost:3000** (atau sesuai `PORT` di `.env`)

---

## 🧪 Struktur Perintah Lengkap (Quick Start)

```bash
# 1. Clone repo
git clone https://github.com/username/nama-repo.git
cd nama-repo

# 2. Install dependencies
npm install

# 3. Buat file .env dan isi konfigurasi (lihat bagian di atas)
cp .env.example .env   # jika tersedia, atau buat manual

# 4. Setup database
npx prisma generate
npx prisma migrate dev

# 5. Jalankan server
npm run dev
```

---

## ❓ Troubleshooting

| Masalah                        | Solusi                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `Error: connect ECONNREFUSED`  | Pastikan PostgreSQL sudah berjalan dan `DATABASE_URL` sudah benar            |
| `Invalid API Key` (Cloudinary) | Cek kembali nilai `CLOUDINARY_API_KEY` dan `CLOUDINARY_API_SECRET` di `.env` |
| `Prisma Client not generated`  | Jalankan `npx prisma generate` terlebih dahulu                               |
| Port sudah digunakan           | Ganti nilai `PORT` di `.env` ke port lain (misal `3001`)                     |

---

## 📁 Variabel Environment — Referensi Lengkap

| Variable                | Keterangan                 | Contoh                                         |
| ----------------------- | -------------------------- | ---------------------------------------------- |
| `DATABASE_URL`          | Koneksi string PostgreSQL  | `postgresql://postgres:pass@localhost:5432/db` |
| `PORT`                  | Port server Express        | `3000`                                         |
| `JWT_SECRET`            | Secret key untuk JWT token | `s3cr3t_k3y_yang_panjang`                      |
| `CLOUDINARY_API_KEY`    | API Key dari Cloudinary    | `123456789012345`                              |
| `CLOUDINARY_API_SECRET` | API Secret dari Cloudinary | `abcDEFghiJKL...`                              |
| `CLOUDINARY_NAME`       | Cloud Name dari Cloudinary | `my-cloud-name`                                |

---

> 💡 **Tip:** Jangan pernah commit file `.env` ke repository. Pastikan `.env` sudah ada di `.gitignore`.
