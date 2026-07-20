# 🎂 Aplikasi Skripsi Performa — Dokumentasi API

Dokumentasi lengkap untuk backend sistem pemesanan kue berbasis REST API. Dokumen ini mencakup: cara setup, penjelasan setiap endpoint beserta **logika bisnis** di baliknya, skema request/response, dan panduan testing.

> **Tujuan Dokumen:** Selain sebagai referensi teknis, dokumen ini juga menjelaskan **mengapa** sebuah endpoint dirancang seperti itu — cocok untuk belajar arsitektur REST API Node.js + Prisma.

---

## 📋 Daftar Isi

1. [Prerequisites & Setup](#-prerequisites)
2. [Konfigurasi Environment](#-konfigurasi-environment)
3. [Setup Database](#-setup-database)
4. [Menjalankan Server & Test](#-menjalankan-server)
5. [Konsep Dasar Autentikasi](#-konsep-autentikasi-httpcookie)
6. [Route Overview](#-api-routes-overview)
7. [AUTH — Registrasi & Login](#-auth)
8. [PROFILE — Kelola Profil](#-profile)
9. [PRODUCTS — Manajemen Produk](#-products)
10. [CUSTOM CAKE — Kue Kustom](#-custom-cake)
11. [CART — Keranjang Belanja](#-cart)
12. [ORDER — Pesanan & Alur Status](#-order)
13. [REVIEW — Ulasan Produk](#-review)
14. [DASHBOARD — Laporan & Statistik](#-dashboard)
15. [Format Response Standar](#-response-format-standar)
16. [Kode Error](#-kode-error)
17. [Test Suite](#-test-suite)
18. [Troubleshooting](#-troubleshooting)

---

## 📋 Prerequisites

| Tool                                          | Versi Minimum | Keterangan                                         |
| --------------------------------------------- | ------------- | -------------------------------------------------- |
| [Node.js](https://nodejs.org/)                | v18+          | Runtime JavaScript                                 |
| [npm](https://www.npmjs.com/)                 | v9+           | Package manager                                    |
| [Git](https://git-scm.com/)                   | -             | Version control                                    |
| PostgreSQL                                    | v14+          | Database utama                                     |
| [Cloudinary](https://cloudinary.com/)         | Akun gratis   | Penyimpanan gambar (foto produk, bukti bayar, dll) |
| [Postman](https://www.postman.com/downloads/) | -             | Untuk testing endpoint manual                      |

---

## 📥 Clone & Install

```bash
# Clone repository
git clone https://github.com/cholifahdewi653-cyber/aplikasi-skripsi-performa-.git
cd aplikasi-skripsi-performa-

# Install semua dependencies
npm install
```

---

## ⚙️ Konfigurasi Environment

Buat file `.env` di root project berdasarkan `.env.example`:

```dotenv
# ── Database ──────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME"
# Contoh: DATABASE_URL="postgresql://postgres:rahasia@localhost:5432/kue_db"

# ── Server ────────────────────────────────────────────
PORT=3000

# ── JWT ───────────────────────────────────────────────
JWT_SECRET="generate_pakai_perintah_di_bawah"

# ── Cloudinary ────────────────────────────────────────
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Generate JWT Secret yang aman (minimal 64 karakter):**

```bash
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(64).toString('hex'));"
```

> ⚠️ Jangan pernah commit file `.env` ke repository! Pastikan `.env` sudah ada di `.gitignore`.

---

## 🗄️ Setup Database

```bash
# 1. Generate Prisma Client dari schema
npx prisma generate

# 2. Jalankan migrasi (buat tabel di database)
npx prisma migrate dev

# 3. (Opsional) Isi data awal / seed
npm run seed

# 4. (Opsional) Buka GUI database di browser
npx prisma studio
```

> **Logika Prisma:** `prisma generate` membuat TypeScript client dari `schema.prisma`. `prisma migrate dev` mengeksekusi file SQL di folder `prisma/migrations/`.

---

## ▶️ Menjalankan Server

```bash
# Development — auto-reload saat file berubah (menggunakan ts-node/nodemon)
npm run dev

# Production — compile TypeScript dulu, lalu jalankan JS
npm start
```

Server berjalan di: **`http://localhost:3000`**

---

## 🧪 Menjalankan Test

```bash
npm test
```

Output test menampilkan setiap skenario:

```
▶ UC-AUTH-01: Register user baru berhasil → 201
✅ UC-AUTH-01 Register baru   201
────────────────────────────────────────────────────────────
{
  "status": "success",
  "data": {
    "id": "cmp...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "USER"
  }
}
```

**Coverage: 62 test case, 8 suite (Auth, Product, Cart, Custom Cake, Order, Profile, Review, Dashboard)**

---

## 🔐 Konsep Autentikasi: httpOnly Cookie

Sistem ini menggunakan **JWT yang disimpan dalam httpOnly Cookie** — bukan Authorization Header.

### Mengapa httpOnly Cookie?

- **Keamanan:** Cookie dengan flag `httpOnly` tidak bisa diakses oleh JavaScript di browser, sehingga aman dari serangan XSS.
- **Otomatis:** Browser/Postman mengirim cookie secara otomatis di setiap request, tidak perlu menyertakan header `Authorization: Bearer ...` secara manual.

### Ada 2 jenis token:

| Cookie       | Digunakan oleh            | Isi                                        |
| ------------ | ------------------------- | ------------------------------------------ |
| `tokenUser`  | Role `USER`               | JWT berisi `{ id, role: "USER" }`          |
| `tokenAdmin` | Role `ADMIN` atau `OWNER` | JWT berisi `{ id, role: "ADMIN"/"OWNER" }` |

### Cara kerja `authMiddleware`:

1. Membaca cookie `tokenUser` atau `tokenAdmin` dari request.
2. Memverifikasi JWT menggunakan `JWT_SECRET`.
3. Mengecek apakah `role` di token sesuai dengan role yang diizinkan.
4. Jika valid → lanjut ke controller. Jika tidak → `401 Unauthorized` atau `403 Forbidden`.

### Pengaturan di Postman:

Aktifkan **Cookie Jar** (Settings → Cookies) agar Postman otomatis menyimpan dan mengirim cookie setelah login.

---

## 🗺️ API Routes Overview

| Method   | Route                                          | Keterangan                    | Auth                 |
| -------- | ---------------------------------------------- | ----------------------------- | -------------------- |
| `POST`   | `/api/auth/register`                           | Daftar akun baru              | Public               |
| `POST`   | `/api/auth/login`                              | Login                         | Public               |
| `POST`   | `/api/auth/logout`                             | Logout                        | User / Admin         |
| `GET`    | `/api/auth/me`                                 | Data diri sendiri             | User / Admin         |
| `PATCH`  | `/api/profile/update-profile`                  | Update profil + foto          | User / Admin         |
| `GET`    | `/api/products`                                | Daftar produk (filter/search) | Public               |
| `GET`    | `/api/products/:id`                            | Detail satu produk            | Public               |
| `GET`    | `/api/products/best-seller`                    | 5 produk terlaris             | Public               |
| `GET`    | `/api/products/newest`                         | 10 produk terbaru             | Public               |
| `GET`    | `/api/products/category/:category`             | Produk per kategori           | Public               |
| `POST`   | `/api/products`                                | Buat produk baru              | Admin                |
| `PATCH`  | `/api/products/:id`                            | Update produk (parsial)       | Admin                |
| `DELETE` | `/api/products/:id`                            | Hapus produk                  | Admin                |
| `GET`    | `/api/custom-cakes/all-options`                | Semua opsi kustomisasi        | Public               |
| `POST`   | `/api/custom-cakes/order`                      | Pesan custom cake             | User                 |
| `GET`    | `/api/custom-cakes/order/:id`                  | Detail custom cake            | User                 |
| `POST`   | `/api/custom-cakes/options/:category`          | Buat opsi kustomisasi         | Admin                |
| `GET`    | `/api/custom-cakes/options/:category`          | List opsi kustomisasi         | Admin                |
| `GET`    | `/api/custom-cakes/options/:category/:id`      | Detail satu opsi              | Admin                |
| `PATCH`  | `/api/custom-cakes/options/:category/:id`      | Update opsi                   | Admin                |
| `DELETE` | `/api/custom-cakes/options/:category/:id`      | Hapus opsi                    | Admin                |
| `GET`    | `/api/cart`                                    | Lihat keranjang               | User                 |
| `POST`   | `/api/cart`                                    | Tambah item ke keranjang      | User                 |
| `DELETE` | `/api/cart/:id`                                | Hapus item dari keranjang     | User                 |
| `POST`   | `/api/order/checkout`                          | Checkout dari keranjang       | User                 |
| `GET`    | `/api/order/my-orders`                         | Riwayat pesanan saya          | User                 |
| `GET`    | `/api/order/detail/:id`                        | Detail satu pesanan           | User / Admin / Owner |
| `POST`   | `/api/order/my-orders/:id/payment-proof`       | Upload bukti transfer         | User                 |
| `PATCH`  | `/api/order/my-orders/:id/edit-payment`        | Ubah metode pembayaran        | User                 |
| `POST`   | `/api/order/my-orders/:id/cancel`              | Ajukan pembatalan             | User                 |
| `POST`   | `/api/order/my-orders/:id/reorder`             | Beli lagi (reorder)           | User                 |
| `GET`    | `/api/order/admin/all`                         | Semua pesanan                 | Admin                |
| `PATCH`  | `/api/order/admin/:id/status`                  | Update status manual          | Admin                |
| `PATCH`  | `/api/order/admin/:id/verify`                  | Verifikasi pesanan            | Admin                |
| `PATCH`  | `/api/order/admin/:id/ship`                    | Kirim pesanan                 | Admin                |
| `POST`   | `/api/order/admin/:id/proof-delivery`          | Upload bukti kirim            | Admin                |
| `PATCH`  | `/api/order/admin/:id/confirm-arrival`         | Konfirmasi paket sampai       | Admin                |
| `PATCH`  | `/api/order/admin/requests/:requestId/resolve` | Proses pengajuan batal        | Admin                |
| `POST`   | `/api/reviews`                                 | Buat ulasan                   | User                 |
| `GET`    | `/api/reviews/product/:productId`              | Ulasan satu produk            | Public               |
| `GET`    | `/api/dashboard/owner`                         | Dashboard laporan Owner       | Owner                |
| `GET`    | `/api/dashboard/admin`                         | Dashboard kerja Admin         | Admin                |

---

## 👤 AUTH

### Konsep & Logika

Modul autentikasi mengelola siklus hidup akun pengguna. Semua password di-hash menggunakan **bcrypt** sebelum disimpan ke database — artinya bahkan developer tidak bisa membaca password asli pengguna.

Setelah login berhasil, server membuat JWT dan menyimpannya dalam **httpOnly Cookie**. Token ini menjadi "kunci" untuk mengakses endpoint yang membutuhkan autentikasi.

---

### `POST /api/auth/register` — Public

**Tujuan:** Membuat akun baru.

**Logika:**

1. Validasi input: `name`, `email`, `password`, `confirmPassword` harus sesuai.
2. Cek apakah email sudah terdaftar → jika ya, kembalikan error `CONFLICT_ERROR`.
3. Hash password dengan bcrypt.
4. Simpan user baru ke database dengan role default `USER`.

**Request Body:**

```json
{
  "name": "Siti Cholifah",
  "email": "siti@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response 201:**

```json
{
  "status": "success",
  "data": {
    "id": "cmp1abc2def3",
    "name": "Siti Cholifah",
    "email": "siti@example.com",
    "role": "USER",
    "createdAt": "2026-07-19T05:00:00.000Z"
  }
}
```

---

### `POST /api/auth/login` — Public

**Tujuan:** Login dan mendapatkan cookie autentikasi.

**Logika:**

1. Cari user berdasarkan `identifier` (bisa email atau username).
2. Bandingkan password input dengan hash bcrypt di database.
3. Jika cocok: buat JWT → set ke httpOnly Cookie (`tokenUser` atau `tokenAdmin`).
4. Cookie otomatis dikirim oleh browser/Postman di request berikutnya.

**Request Body:**

```json
{
  "identifier": "siti@example.com",
  "password": "password123"
}
```

> `identifier` bisa berupa **email** atau **username**.

**Response 200:**

```json
{
  "status": "success",
  "message": "Login berhasil",
  "data": {
    "id": "cmp1abc2def3",
    "name": "Siti Cholifah",
    "role": "USER"
  }
}
```

> Cookie `tokenUser` (atau `tokenAdmin` untuk admin/owner) otomatis di-set oleh server dengan flag `httpOnly`.

---

### `GET /api/auth/me` — User / Admin

**Tujuan:** Mendapatkan data akun yang sedang login.

**Logika:** Middleware membaca token dari cookie → ekstrak `userId` dari JWT → ambil data user beserta profil dari database.

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "id": "cmp1abc2def3",
    "name": "Siti Cholifah",
    "email": "siti@example.com",
    "role": "USER",
    "phoneNumber": "081234567890",
    "address": "Jl. Merdeka No. 1",
    "city": "Purwokerto",
    "postalCode": "53111"
  }
}
```

---

### `POST /api/auth/logout` — User / Admin

**Tujuan:** Menghapus cookie autentikasi (logout).

**Logika:** Server memanggil `res.clearCookie()` untuk menghapus `tokenUser` dan `tokenAdmin`. Setelah ini, semua request ke endpoint yang butuh autentikasi akan mendapat `401`.

**Response 200:**

```json
{
  "status": "success",
  "message": "Logout berhasil"
}
```

---

## 👤 PROFILE

### Konsep & Logika

Profil adalah data tambahan user (alamat, nomor HP, foto) yang tersimpan di tabel terpisah dari tabel `User`. Ini disebut pola **One-to-One relation** di Prisma. Endpoint ini menggunakan `PATCH` (bukan `PUT`) karena tidak semua field wajib dikirim — hanya field yang ingin diperbarui.

---

### `PATCH /api/profile/update-profile` — User / Admin

**Tujuan:** Update sebagian atau seluruh data profil.

**Logika:**

1. Ambil `userId` dari JWT cookie.
2. Cek apakah profil sudah ada → jika ya: update (`upsert`), jika belum: buat baru.
3. Jika ada file foto (`foto`), upload ke Cloudinary → simpan URL dan public_id ke database.
4. Jika foto lama ada di Cloudinary, hapus foto lama sebelum upload yang baru.

> **Mengapa PATCH?** Dengan PATCH, frontend bisa mengirim hanya field yang berubah (misalnya hanya `city`). Tidak perlu mengirim semua data profil setiap kali ada perubahan kecil.

Content-Type: `multipart/form-data`

| Field          | Tipe                      | Keterangan             |
| -------------- | ------------------------- | ---------------------- |
| `name`         | string                    | Nama lengkap           |
| `phoneNumber`  | string                    | Nomor HP               |
| `address`      | string                    | Alamat lengkap         |
| `city`         | string                    | Kota                   |
| `postalCode`   | string                    | Kode pos               |
| `jenisKelamin` | `LAKI_LAKI` / `PEREMPUAN` | Jenis kelamin          |
| `foto`         | file (jpg/png/webp)       | Foto profil            |
| `department`   | string                    | Khusus Admin           |
| `adminNotes`   | string                    | Catatan internal Admin |

> Semua field **opsional** — kirim hanya field yang ingin diperbarui.

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "id": "cmp1abc2def3",
    "name": "Siti Cholifah",
    "phoneNumber": "081234567890",
    "address": "Jl. Merdeka No. 1",
    "city": "Purwokerto",
    "postalCode": "53111",
    "jenisKelamin": "PEREMPUAN",
    "foto": "https://res.cloudinary.com/..."
  }
}
```

---

## 🛍️ PRODUCTS

### Konsep & Logika

Produk adalah item reguler yang dijual (berbeda dengan Custom Cake). Setiap produk bisa memiliki:

- **Varian rasa** (`variantRasa`): disimpan sebagai array string
- **Ukuran** (`sizes`): tabel terpisah `ProductSize`, masing-masing punya harga
- **Gambar** (`images`): disimpan sebagai array URL Cloudinary
- **Diskon**: bisa `PERCENTAGE` atau `FIXED`

---

### `GET /api/products` — Public

**Tujuan:** Mendapatkan semua produk yang telah dipublikasikan.

**Logika:** Query ke tabel `Product` dengan filter `isPublished: true`. Mendukung parameter query opsional untuk pencarian dan filter.

**Query Params (opsional):**
| Param | Contoh | Keterangan |
| ----- | ------ | ---------- |
| `category` | `KECIL` | Filter berdasarkan kategori |
| `search` | `cokelat` | Cari berdasarkan nama produk |

**Contoh Request:**

```
GET /api/products?category=KECIL&search=cokelat
```

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "cmp1abc2def3",
      "name": "Kue Ultah Cokelat",
      "slug": "kue-ultah-cokelat",
      "basePrice": 75000,
      "category": "KECIL",
      "stockType": "READY_STOCK",
      "images": ["https://res.cloudinary.com/..."],
      "variants": ["Cokelat", "Vanilla"],
      "isPublished": true
    }
  ]
}
```

---

### `GET /api/products/:id` — Public

**Tujuan:** Mendapatkan detail satu produk.

**Logika:** Mendukung pencarian berdasarkan **ID** atau **slug** (URL-friendly name). Slug di-generate otomatis saat produk dibuat (misal: "Kue Ultah Cokelat" → `kue-ultah-cokelat`).

**Contoh Request:**

```
GET /api/products/kue-ultah-cokelat
GET /api/products/cmp1abc2def3
```

---

### `GET /api/products/best-seller` — Public

**Tujuan:** Mendapatkan 5 produk terlaris untuk tampilan dashboard/homepage user.

**Logika:**

1. Hitung total `qty` terjual per produk dari tabel `OrderItem`, hanya dari order yang tidak berstatus `REJECTED` atau `CANCELLED`.
2. Ambil 5 produk dengan penjualan tertinggi.
3. Jika produk yang punya data penjualan kurang dari 5, **tambal** kekurangannya dengan produk terbaru (createdAt DESC) yang belum masuk di daftar.

> Strategi "tambal" ini memastikan endpoint selalu mengembalikan minimal 5 produk, bahkan jika toko baru saja dibuka dan belum ada penjualan.

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "cmp1...",
      "name": "Kue Ultah Cokelat",
      "slug": "kue-ultah-cokelat",
      "basePrice": 75000,
      "category": "KECIL",
      "stockType": "READY_STOCK",
      "images": ["https://res.cloudinary.com/..."]
    }
  ]
}
```

---

### `GET /api/products/newest` — Public

**Tujuan:** Mendapatkan 10 produk terbaru yang telah dipublikasikan.

**Logika:** Query `Product` dengan filter `isPublished: true`, diurutkan `createdAt DESC`, diambil 10 teratas.

---

### `GET /api/products/category/:category` — Public

**Tujuan:** Filter produk berdasarkan kategori tertentu.

**Logika:** Query `Product` dengan filter `category` (case-insensitive). Nilai kategori yang tersedia: `KECIL`, `BESAR`, `PREMIUM`.

**Contoh:**

```
GET /api/products/category/KECIL
GET /api/products/category/kecil   ← juga valid
```

---

### `POST /api/products` — Admin Only

**Tujuan:** Membuat produk baru.

**Logika:**

1. Validasi input dengan Zod schema.
2. Generate `slug` dari nama produk (huruf kecil, spasi diganti `-`).
3. Jika ada file gambar, upload ke Cloudinary → simpan URL.
4. Jika ada `sizes` (JSON string dari form-data), parse dan buat relasi `ProductSize`.
5. Jika `variantRasa` dikirim (dipisah koma), simpan sebagai array.

Content-Type: `multipart/form-data`

| Field         | Tipe                      | Wajib | Keterangan                                          |
| ------------- | ------------------------- | :---: | --------------------------------------------------- |
| `name`        | string                    |  ✅   | Nama produk                                         |
| `description` | string                    |  ✅   | Deskripsi produk                                    |
| `basePrice`   | number                    |  ✅   | Harga dasar                                         |
| `category`    | `KECIL`/`BESAR`/`PREMIUM` |  ✅   | Kategori                                            |
| `stock`       | `ready`/`preorder`        |  ✅   | Jenis stok                                          |
| `variantRasa` | string                    |   -   | Varian rasa, pisah koma (contoh: `Cokelat,Vanilla`) |
| `sizes`       | JSON string               |   -   | Array ukuran & harga                                |
| `images`      | file                      |   -   | Gambar produk (bisa multiple)                       |

**Contoh body form-data:**

```
name          = Kue Ulang Tahun Strawberry
description   = Kue segar dengan topping strawberry segar
basePrice     = 85000
category      = KECIL
stock         = ready
variantRasa   = Strawberry,Original
sizes         = [{"name":"Loyang 16cm","price":85000},{"name":"Loyang 20cm","price":110000}]
images        = [file upload]
```

**Response 201:**

```json
{
  "status": "success",
  "data": {
    "id": "cmp1abc2def3",
    "name": "Kue Ulang Tahun Strawberry",
    "slug": "kue-ulang-tahun-strawberry",
    "basePrice": 85000,
    "category": "KECIL"
  }
}
```

---

### `PATCH /api/products/:id` — Admin Only

**Tujuan:** Update sebagian data produk.

**Logika:** Sama dengan Create, tetapi semua field opsional. Hanya field yang dikirim yang akan diperbarui di database (`prisma.product.update`). Jika ada gambar baru, gambar lama di Cloudinary dihapus dulu.

Content-Type: `multipart/form-data` — field sama seperti Create, semua opsional.

---

### `DELETE /api/products/:id` — Admin Only

**Tujuan:** Menghapus produk.

**Logika:** Hard delete dari database. Gambar di Cloudinary juga dihapus menggunakan `public_id` yang tersimpan.

**Response 200:**

```json
{
  "status": "success",
  "message": "Produk berhasil dihapus"
}
```

---

## 🎂 CUSTOM CAKE

### Konsep & Logika

Custom Cake adalah fitur di mana user bisa merakit kue sesuai keinginan dari komponen-komponen yang tersedia. Admin mengelola "menu" komponen (opsi), dan user memilih kombinasi yang diinginkan.

**Komponen Custom Cake:**
| Category Key | Nama | Keterangan |
| ------------ | ---- | ---------- |
| `base-cake` | Base Cake | Dasar kue (Vanilla Sponge, Chocolate Sponge, dll) |
| `tipe-cream` | Tipe Cream | Jenis krim (Whipped Cream, Buttercream, dll) |
| `warna-cream` | Warna Cream | Warna krim + kode hex |
| `layer` | Layer | Lapisan kue |
| `size` | Size | Ukuran loyang |

---

### `GET /api/custom-cakes/all-options` — Public

**Tujuan:** Mendapatkan semua opsi yang tersedia untuk form kustomisasi di frontend.

**Logika:** Query semua record aktif dari setiap tabel opsi (`BaseCake`, `TipeCream`, `WarnaKrim`, `Layer`, `Size`), dikembalikan dalam satu response terstruktur. Endpoint ini dipanggil saat user membuka halaman "Buat Custom Cake" untuk mengisi dropdown/pilihan.

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "baseCakes": [
      {
        "id": "cmp1...",
        "name": "Vanilla Sponge",
        "price": 50000,
        "isAvailable": true
      }
    ],
    "tipeCreams": [
      {
        "id": "cmp2...",
        "name": "Whipped Cream",
        "price": 15000,
        "isAvailable": true
      }
    ],
    "warnaCreams": [
      {
        "id": "cmp3...",
        "name": "Merah Muda",
        "warna": "Pink",
        "hex": "#FFB6C1",
        "price": 10000
      }
    ],
    "layers": [{ "id": "cmp4...", "name": "Layer Cokelat", "price": 20000 }],
    "sizes": [{ "id": "cmp5...", "name": "20cm Round", "price": 5000 }]
  }
}
```

---

### `POST /api/custom-cakes/order` — User

**Tujuan:** Membuat pesanan custom cake baru dan langsung memasukkannya ke keranjang.

**Logika:**

1. Validasi semua ID komponen yang dipilih (baseCakeId, tipeCreamId, dll) harus ada di database.
2. Hitung `totalPrice` = harga base cake + harga cream + harga warna + harga setiap layer (harga layer × harga size) + harga topping.
3. Buat record `CustomCake` di database beserta relasi `layers` dan `toppings`.
4. Upload foto referensi (opsional) ke Cloudinary.
5. Tambahkan custom cake ke tabel `CartItem` dengan tipe `CUSTOM_CAKE`.

Content-Type: `multipart/form-data`

| Field          | Tipe           | Wajib | Keterangan                                                     |
| -------------- | -------------- | :---: | -------------------------------------------------------------- |
| `baseCakeId`   | string         |  ✅   | ID base cake                                                   |
| `tipeCreamId`  | string         |  ✅   | ID tipe krim                                                   |
| `warnaCreamId` | string         |  ✅   | ID warna krim                                                  |
| `layers`       | JSON string    |  ✅   | Array layer: `[{"layerId":"...","sizeId":"...","position":1}]` |
| `ucapan`       | string         |   -   | Tulisan di kue (misal: "Happy Birthday!")                      |
| `catatan`      | string         |   -   | Catatan khusus untuk pembuat kue                               |
| `foto`         | file (jpg/png) |   -   | Foto referensi desain                                          |

**Contoh body form-data:**

```
baseCakeId    = cmp1abc2def3
tipeCreamId   = cmp2abc2def3
warnaCreamId  = cmp3abc2def3
layers        = [{"layerId":"cmp4abc","sizeId":"cmp5abc","position":1}]
ucapan        = Selamat Ulang Tahun Bunda!
catatan       = Tolong dibuat manis dan pakai lilin 25
foto          = [file upload referensi desain]
```

**Response 201:**

```json
{
  "status": "success",
  "data": {
    "id": "cmp9xyz...",
    "status": "PENDING",
    "totalPrice": 100000,
    "ucapan": "Selamat Ulang Tahun Bunda!",
    "baseCake": { "name": "Vanilla Sponge", "price": 50000 },
    "tipeCream": { "name": "Whipped Cream", "price": 15000 }
  }
}
```

---

### `GET /api/custom-cakes/order/:id` — User

**Tujuan:** Melihat detail konfigurasi satu custom cake milik sendiri.

**Logika:** Query `CustomCake` berdasarkan ID dengan semua relasi (baseCake, tipeCream, warnaCream, layers beserta ukuran, toppings). Jika custom cake bukan milik user yang login → `403 Forbidden`.

---

### Admin: CRUD Opsi Custom Cake

**Tujuan:** Admin mengelola "menu" pilihan komponen yang bisa dipilih user.

**`:category`** yang tersedia:

```
base-cake | tipe-cream | warna-cream | layer | size
```

```
POST   /api/custom-cakes/options/:category         → Buat opsi baru
GET    /api/custom-cakes/options/:category         → List semua opsi dalam kategori
GET    /api/custom-cakes/options/:category/:id     → Detail satu opsi
PATCH  /api/custom-cakes/options/:category/:id     → Update opsi (parsial)
DELETE /api/custom-cakes/options/:category/:id     → Hapus opsi
```

**Mengapa `isAvailable` field penting?**
Field `isAvailable` (boolean) pada setiap opsi mengontrol apakah opsi tersebut tampil di form kustomisasi user (`GET /all-options` hanya mengambil opsi yang `isAvailable: true`). Admin bisa menonaktifkan opsi tanpa menghapusnya.

**Contoh Create BaseCake:**

`POST /api/custom-cakes/options/base-cake` — Admin

```json
{
  "name": "Chocolate Sponge",
  "price": 60000,
  "isAvailable": true
}
```

**Contoh Create WarnaCream (dengan field tambahan):**

`POST /api/custom-cakes/options/warna-cream` — Admin

```json
{
  "name": "Biru Muda",
  "warna": "Biru",
  "hex": "#ADD8E6",
  "price": 12000,
  "isAvailable": true
}
```

**Contoh Update Status Opsi (hanya update `isAvailable`):**

`PATCH /api/custom-cakes/options/base-cake/cmp1abc2def3` — Admin

```json
{
  "isAvailable": false
}
```

> **Logika PATCH:** Schema menggunakan `z.preprocess()` untuk mengkonversi string `"true"`/`"false"` dari form-data menjadi boolean sejati, dan string angka `"60000"` menjadi number. Ini penting karena form-data mengirim semua field sebagai string.

---

## 🛒 CART

### Konsep & Logika

Keranjang belanja (`Cart`) adalah "holding area" sebelum user melakukan checkout. Setiap user memiliki tepat satu Cart (relasi One-to-One). Item di dalam cart disebut `CartItem`.

Setelah checkout berhasil, cart items yang di-checkout **otomatis dihapus** dari keranjang (dalam database transaction).

---

### `GET /api/cart` — User

**Tujuan:** Melihat isi keranjang belanja.

**Logika:** Query `Cart` milik user yang login, beserta semua `CartItem` dan relasi produk/custom cake masing-masing item. Jika user belum pernah menambahkan item, cart dibuat otomatis (lazy creation).

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "id": "cart_cmp1...",
    "cartItems": [
      {
        "id": "item_cmp1...",
        "productId": "prod_cmp1...",
        "qty": 2,
        "rasa": "Cokelat",
        "type": "PRODUCT",
        "product": {
          "name": "Kue Ultah Cokelat",
          "basePrice": 75000
        }
      }
    ]
  }
}
```

---

### `POST /api/cart` — User

**Tujuan:** Menambahkan item ke keranjang.

**Logika:**

1. Cek apakah produk/custom cake yang ditambahkan ada dan valid.
2. Jika item yang sama (productId + rasa + size) sudah ada di cart → tambah qty-nya.
3. Jika belum ada → buat `CartItem` baru.

**Request Body:**

```json
{
  "productId": "cmp1abc2def3",
  "qty": 2,
  "type": "PRODUCT",
  "rasa": "Cokelat"
}
```

> `type` bisa `PRODUCT` atau `CUSTOM_CAKE`. Untuk custom cake, gunakan `customCakeId` bukan `productId`.

**Response 201:**

```json
{
  "status": "success",
  "data": {
    "id": "item_cmp1...",
    "productId": "cmp1abc2def3",
    "qty": 2,
    "rasa": "Cokelat",
    "type": "PRODUCT"
  }
}
```

---

### `DELETE /api/cart/:id` — User

**Tujuan:** Menghapus satu item dari keranjang.

**Logika:** Hard delete `CartItem` dengan ID tersebut. Validasi bahwa item tersebut memang milik user yang login (mencegah user menghapus cart item orang lain).

```
DELETE /api/cart/item_cmp1abc2def3
```

---

## 📦 ORDER

### Alur Status Pesanan

Pesanan mengikuti alur status yang terstruktur. Memahami alur ini penting sebelum menggunakan endpoint order:

```
[USER Checkout]
      │
      ▼
   PENDING ──────────────────────────────────────► REJECTED
  (Menunggu)     [Admin: /verify dengan REJECT]
      │
      │  [Admin: /verify dengan APPROVE]
      ▼
  PROCESSING ──────────────────────────────────► (dibatalkan via cancel request)
  (Sedang dibuat)
      │
      │  [Admin: /ship]
      ▼
   SHIPPED
  (Sedang dikirim)
      │
      │  [Admin: /proof-delivery (upload foto)]
      ▼
   ARRIVED
  (Paket sampai, menunggu konfirmasi)
      │
      │  [Admin: /confirm-arrival]
      ▼
  COMPLETED  ◄──── User bisa reorder dari sini
  (Selesai)

  CANCELLED  ◄──── Dari status apapun via cancel request + Admin approve
```

**Status Pembayaran (`paymentStatus`):**
| Status | Keterangan |
| ------ | ---------- |
| `UNPAID` | Belum bayar |
| `PAID` | Sudah bayar / lunas |
| `REFUNDED` | Dana dikembalikan |

---

### `POST /api/order/checkout` — User

**Tujuan:** Membuat pesanan baru dari item yang dipilih di keranjang.

**Logika (dalam 1 database transaction):**

1. Validasi `paymentMethod` — jika `TRANSFER`, field `bank` wajib diisi.
2. Ambil data user + profil untuk snapshot alamat pengiriman.
3. Jika user tidak mengisi alamat di body, gunakan alamat dari profil user.
4. Load semua cart items yang dipilih, validasi semua ada dan milik user ini.
5. Hitung `subtotal`: harga setiap item × qty (dengan mempertimbangkan diskon jika ada).
6. Hitung `adminFee`: Rp 2.500 jika metode Transfer, Rp 0 jika COD/Pickup.
7. `totalAmount` = subtotal + adminFee.
8. Generate `orderNumber` unik (format: `ORD-{timestamp}`).
9. Buat record `Order` beserta semua `OrderItem` (snapshot harga dan nama tersimpan agar tidak berubah jika produk diedit kemudian).
10. **Hapus** cart items yang sudah di-checkout dari keranjang.

> **Mengapa snapshot harga?** Field `priceSnapshot` dan `nameSnapshot` di `OrderItem` menyimpan harga dan nama produk **saat checkout**. Ini penting agar riwayat pesanan tetap akurat meskipun harga produk berubah di masa depan.

**Request Body:**

```json
{
  "cartItemIds": ["item_cmp1abc", "item_cmp2def"],
  "paymentMethod": "TRANSFER",
  "bank": "BCA",
  "deliveryDate": "2026-08-01T10:00:00.000Z",
  "recipientName": "Siti Cholifah",
  "phoneNumber": "081234567890",
  "address": "Jl. Merdeka No. 1",
  "city": "Purwokerto",
  "postalCode": "53111"
}
```

| `paymentMethod` | `bank` wajib?                    | Keterangan            |
| --------------- | -------------------------------- | --------------------- |
| `COD`           | ❌                               | Bayar saat paket tiba |
| `TRANSFER`      | ✅ (BCA, BNI, BRI, MANDIRI, dll) | Transfer bank manual  |

**Response 201:**

```json
{
  "status": "success",
  "data": {
    "id": "ord_cmp1...",
    "orderNumber": "ORD-1721390400000",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "paymentMethod": "TRANSFER",
    "bank": "BCA",
    "subtotal": 150000,
    "adminFee": 2500,
    "totalAmount": 152500,
    "deliveryDate": "2026-08-01T10:00:00.000Z",
    "items": [...]
  }
}
```

---

### `GET /api/order/my-orders` — User

**Tujuan:** Melihat semua riwayat pesanan milik sendiri.

**Logika:** Query semua `Order` dengan `userId` dari token, diurutkan terbaru di atas. Menyertakan semua relasi: items (beserta produk dan custom cake), tracking, bukti pembayaran, dan request pembatalan.

---

### `GET /api/order/detail/:id` — User / Admin / Owner

**Tujuan:** Melihat detail lengkap satu pesanan.

**Logika Akses Berbasis Role:**

- **USER:** Hanya bisa melihat pesanan miliknya sendiri → jika `order.userId !== userId`, server melempar `403 Forbidden`.
- **ADMIN / OWNER:** Bisa melihat detail pesanan siapapun tanpa batasan.

**Data yang dikembalikan:**

- Info pesanan (status, total, metode bayar)
- Alamat pengiriman
- Data user pemesan
- Items (dengan snapshot + data produk/custom cake aktual)
- Riwayat tracking
- Bukti pembayaran yang diunggah
- Request pembatalan

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "id": "ord_cmp1...",
    "orderNumber": "ORD-1721390400000",
    "status": "PROCESSING",
    "paymentStatus": "PAID",
    "recipientName": "Siti Cholifah",
    "phoneNumber": "081234567890",
    "address": "Jl. Merdeka No. 1",
    "city": "Purwokerto",
    "postalCode": "53111",
    "paymentMethod": "TRANSFER",
    "bank": "BCA",
    "subtotal": 150000,
    "adminFee": 2500,
    "totalAmount": 152500,
    "user": {
      "id": "usr_123",
      "name": "Siti Cholifah",
      "email": "siti@example.com"
    },
    "items": [
      {
        "id": "item_123",
        "type": "PRODUCT",
        "nameSnapshot": "Kue Ultah Cokelat (Loyang 20cm) - Cokelat",
        "priceSnapshot": 110000,
        "qty": 1,
        "product": {
          "id": "prod_123",
          "name": "Kue Ultah Cokelat",
          "basePrice": 75000
        }
      }
    ],
    "trackings": [
      {
        "status": "PACKED",
        "note": "Pesanan diterima dan mulai diproses",
        "createdAt": "..."
      }
    ],
    "paymentSubmissions": [],
    "requests": []
  }
}
```

---

### `POST /api/order/my-orders/:id/payment-proof` — User

**Tujuan:** Upload bukti transfer pembayaran.

**Logika:**

1. Validasi bahwa order milik user ini, berstatus `PENDING`, dan bermetode `TRANSFER`.
2. Upload file foto ke Cloudinary dalam folder `payment_submission_folder`.
3. Buat record `PaymentSubmission` yang berisi URL foto dan status awal `UNPAID` (menunggu konfirmasi admin).

> **Mengapa tidak langsung `PAID`?** Admin perlu memverifikasi secara manual bahwa transfer benar-benar sudah masuk sebelum pesanan diproses.

Content-Type: `multipart/form-data`

| Field   | Tipe           | Keterangan                     |
| ------- | -------------- | ------------------------------ |
| `bukti` | file (jpg/png) | Foto screenshot bukti transfer |

---

### `PATCH /api/order/my-orders/:id/edit-payment` — User

**Tujuan:** Mengubah metode atau bank pembayaran sebelum pesanan diproses.

**Logika:**

1. Hanya bisa dilakukan jika status `PENDING` dan `paymentStatus` masih `UNPAID`.
2. Jika metode berubah dari/ke `TRANSFER`, admin fee (Rp 2.500) dihitung ulang.
3. `totalAmount` diperbarui otomatis.

**Request Body:**

```json
{
  "paymentMethod": "TRANSFER",
  "bank": "BNI"
}
```

---

### `POST /api/order/my-orders/:id/cancel` — User

**Tujuan:** Mengajukan permintaan pembatalan pesanan.

**Logika:**

1. Tidak bisa diajukan untuk order berstatus `COMPLETED`, `CANCELLED`, atau `REJECTED`.
2. Satu order maksimal **3 kali** pengajuan cancel (setelah ditolak admin, user bisa ajukan lagi).
3. Membuat record `OrderRequest` dengan tipe `CANCEL` dan status `PENDING`.
4. Admin kemudian memproses permintaan ini via `/admin/requests/:requestId/resolve`.

**Request Body:**

```json
{
  "reason": "Berubah pikiran, tidak jadi beli"
}
```

**Response 201:**

```json
{
  "status": "success",
  "data": {
    "id": "req_cmp1...",
    "orderId": "ord_cmp1...",
    "reason": "Berubah pikiran, tidak jadi beli",
    "status": "PENDING"
  }
}
```

---

### `POST /api/order/my-orders/:id/reorder` — User

**Tujuan:** Menambahkan kembali semua item dari pesanan lama ke keranjang (beli lagi).

**Logika:**

1. Hanya bisa dilakukan untuk order berstatus `COMPLETED`.
2. Untuk item tipe `PRODUCT`: buat CartItem baru yang merujuk ke produk yang sama.
3. Untuk item tipe `CUSTOM_CAKE`: **duplikasi** seluruh konfigurasi custom cake (termasuk semua relasi layer dan topping) → buat CartItem baru yang merujuk ke custom cake duplikat ini.

> **Mengapa custom cake harus diduplikasi?** Custom cake adalah entitas unik yang terikat ke order. Agar user bisa memesan kue yang sama sekali lagi, sistem harus membuat salinan konfigurasi baru yang bisa dimodifikasi secara independen.

**Response 200:**

```json
{
  "status": "success",
  "message": "Item berhasil ditambahkan ke keranjang",
  "data": {
    "addedItems": 2,
    "cartId": "cart_cmp1..."
  }
}
```

---

### `GET /api/order/admin/all` — Admin Only

**Tujuan:** Melihat semua pesanan dari semua user.

**Logika:** Query semua `Order` tanpa filter, diurutkan terbaru. Menyertakan data user, items, tracking, dan bukti pembayaran. Digunakan admin untuk memantau semua aktivitas pesanan.

---

### `PATCH /api/order/admin/:id/status` — Admin Only

**Tujuan:** Update status order secara manual (untuk penyesuaian/koreksi).

**Logika:**

1. Update field `status` pada order.
2. Jika status baru adalah `PROCESSING`, `SHIPPED`, atau `ARRIVED` → otomatis buat record `OrderTracking` sebagai riwayat perubahan status.

**Request Body:**

```json
{
  "status": "PROCESSING",
  "note": "Pesanan mulai diproses oleh tim dapur"
}
```

> Ini adalah endpoint "admin override" yang bisa mengubah status ke nilai apapun. Gunakan endpoint spesifik (`/verify`, `/ship`, dll) untuk alur normal.

---

### `PATCH /api/order/admin/:id/verify` — Admin Only

**Tujuan:** Memverifikasi pesanan baru — terima atau tolak.

**Logika:**

- Hanya bisa dijalankan untuk order berstatus `PENDING`.
- **APPROVE**: Status berubah ke `PROCESSING`. Jika metode `TRANSFER`, payment status diubah ke `PAID`. Tracking baru dibuat dengan status `PACKED`.
- **REJECT**: Status berubah ke `REJECTED`. Alasan penolakan tersimpan di `rejectReason`.

**Request Body:**

```json
{
  "action": "APPROVE"
}
```

atau

```json
{
  "action": "REJECT",
  "reason": "Stok bahan habis, tidak bisa memenuhi pesanan"
}
```

> `action`: `APPROVE` (terima) atau `REJECT` (tolak).

---

### `PATCH /api/order/admin/:id/ship` — Admin Only

**Tujuan:** Menandai pesanan sudah dikirim beserta info ekspedisi.

**Logika:**

1. Hanya bisa dilakukan untuk order berstatus `PROCESSING`.
2. Status berubah ke `SHIPPED`.
3. Ekspedisi dan nomor resi disimpan di order (`expedition`, `resi`).
4. Tracking baru dibuat: status `ON_THE_WAY` dengan catatan ekspedisi + nomor resi.

**Request Body:**

```json
{
  "expedition": "JNE",
  "resi": "JNE1234567890"
}
```

> Gunakan field `expedition` dan `resi` (bukan `courier` dan `trackingNumber` seperti di versi lama).

---

### `POST /api/order/admin/:id/proof-delivery` — Admin Only

**Tujuan:** Upload foto bukti paket sudah sampai di tujuan.

**Logika:**

1. Bisa dilakukan untuk order berstatus `SHIPPED` atau `PROCESSING`.
2. Upload foto ke Cloudinary folder `delivery_proof_folder`.
3. URL foto disimpan di `proofOfDelivery`.
4. Status order otomatis berubah ke `ARRIVED`.
5. Tracking baru dibuat: status `ARRIVED`.

Content-Type: `multipart/form-data`

| Field  | Tipe           | Keterangan              |
| ------ | -------------- | ----------------------- |
| `foto` | file (jpg/png) | Foto bukti paket sampai |

---

### `PATCH /api/order/admin/:id/confirm-arrival` — Admin Only

**Tujuan:** Mengkonfirmasi pesanan telah diterima dan menyelesaikan transaksi.

**Logika:**

1. Hanya bisa dilakukan untuk order berstatus `ARRIVED`.
2. Status order berubah ke `COMPLETED`.
3. `paymentStatus` otomatis berubah ke `PAID` (lunas) — cocok untuk order COD.

**Request Body:** Bisa kosong atau:

```json
{
  "note": "Paket diterima oleh penerima langsung"
}
```

---

### `PATCH /api/order/admin/requests/:requestId/resolve` — Admin Only

**Tujuan:** Memproses pengajuan pembatalan dari user (terima atau tolak).

**Logika:**

- **APPROVE**: Status request → `ACCEPTED`. Status order → `CANCELLED`. Informasi refund tersimpan.
- **REJECT**: Status request → `REJECTED`. Order tetap berjalan normal. `adminNote` (alasan penolakan) **wajib** diisi.

**Request Body:**

```json
{
  "action": "APPROVE",
  "settlementType": "REFUND",
  "adminNote": "Pembatalan disetujui, dana dikembalikan dalam 3 hari kerja"
}
```

| Field            | Nilai                        | Keterangan                             |
| ---------------- | ---------------------------- | -------------------------------------- |
| `action`         | `APPROVE` / `REJECT`         | Terima atau tolak pembatalan           |
| `settlementType` | `REFUND` / `CREDIT` / `NONE` | Jenis penyelesaian dana (jika APPROVE) |
| `adminNote`      | string                       | Catatan admin (wajib jika REJECT)      |

---

## ⭐ REVIEW

### Konsep & Logika

Review adalah sistem ulasan produk yang **terverifikasi** — user hanya bisa memberikan ulasan untuk produk yang benar-benar sudah dibeli dan diterima. Ini mencegah review palsu.

**Aturan review:**

- Order harus berstatus `COMPLETED`.
- Satu `OrderItem` hanya bisa di-review **satu kali** (cek via `reviewedAt` pada OrderItem).
- Rating antara 1 sampai 5.

---

### `GET /api/reviews/product/:productId` — Public

**Tujuan:** Mendapatkan semua ulasan untuk satu produk.

**Logika:** Query semua `Review` yang terhubung ke produk ini (via OrderItem → product), diurutkan terbaru, beserta nama user yang memberi ulasan.

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "rev_cmp1...",
      "rating": 5,
      "comment": "Kuenya enak banget dan cantik!",
      "foto": "https://res.cloudinary.com/...",
      "user": { "name": "Siti Cholifah" },
      "createdAt": "2026-07-19T05:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/reviews` — User

**Tujuan:** Membuat ulasan baru untuk item yang sudah diterima.

**Logika:**

1. Ambil `OrderItem` berdasarkan `orderItemId`.
2. Validasi: order item milik user ini, order berstatus `COMPLETED`, item belum pernah di-review.
3. Upload foto ulasan (opsional) ke Cloudinary.
4. Buat record `Review`.
5. Tandai `OrderItem.reviewedAt` = sekarang (agar tidak bisa di-review lagi).

Content-Type: `multipart/form-data`

| Field         | Tipe           | Wajib | Keterangan                            |
| ------------- | -------------- | :---: | ------------------------------------- |
| `orderItemId` | string         |  ✅   | ID item dari order yang sudah selesai |
| `rating`      | number (1–5)   |  ✅   | Rating bintang                        |
| `comment`     | string         |   -   | Komentar/ulasan                       |
| `foto`        | file (jpg/png) |   -   | Foto produk yang diterima             |

**Contoh body form-data:**

```
orderItemId   = item_cmp1abc2def3
rating        = 5
comment       = Kuenya cantik banget sesuai pesanan, rasanya enak!
foto          = [file upload foto kue yang diterima]
```

**Response 201:**

```json
{
  "status": "success",
  "data": {
    "id": "rev_cmp1...",
    "rating": 5,
    "comment": "Kuenya cantik banget sesuai pesanan, rasanya enak!",
    "foto": "https://res.cloudinary.com/...",
    "orderItemId": "item_cmp1...",
    "createdAt": "2026-07-19T05:00:00.000Z"
  }
}
```

---

## 📊 DASHBOARD

### Konsep & Logika

Dashboard menyediakan data agregat yang sudah diolah — bukan raw data — sehingga frontend tidak perlu menghitung sendiri. Ada dua dashboard yang berbeda, disesuaikan dengan kebutuhan masing-masing role.

---

### `GET /api/products/best-seller` — Public

_(Lihat dokumentasi di bagian [PRODUCTS](#get-apiproductsbest-seller--public))_

### `GET /api/products/newest` — Public

_(Lihat dokumentasi di bagian [PRODUCTS](#get-apiproductsnewest--public))_

### `GET /api/products/category/:category` — Public

_(Lihat dokumentasi di bagian [PRODUCTS](#get-apiproductscategorycategory--public))_

---

### `GET /api/dashboard/owner` — Owner Only

**Tujuan:** Dashboard laporan bisnis lengkap untuk Owner.

**Auth:** httpOnly Cookie `tokenAdmin` dengan `role = OWNER`.

**Logika:**

1. **Omset 30 Hari:** Iterasi setiap tanggal dalam 30 hari terakhir → jumlahkan `totalAmount` semua order pada tanggal tersebut (hanya order yang **tidak** berstatus `REJECTED` atau `CANCELLED`). Hasilnya adalah array 30 titik data untuk grafik garis/bar.
2. **Active Orders:** Ambil semua order berstatus `PROCESSING`, `SHIPPED`, `ARRIVED`, `CANCELLED`, atau `RETURNED`, diurutkan `updatedAt DESC`.
3. **Orders 30 Days:** Semua order yang dibuat dalam 30 hari terakhir (semua status), diurutkan `createdAt DESC`.

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "omset": [
      { "date": "2026-06-20", "total": 0 },
      { "date": "2026-06-21", "total": 450000 },
      { "date": "2026-07-19", "total": 1850000 }
    ],
    "activeOrders": [
      {
        "id": "ord_123",
        "orderNumber": "ORD-1721390400000",
        "status": "PROCESSING",
        "totalAmount": 155000,
        "user": { "name": "Siti Cholifah", "email": "siti@example.com" },
        "items": [...]
      }
    ],
    "orders30Days": [
      {
        "id": "ord_123",
        "orderNumber": "ORD-1721390400000",
        "status": "COMPLETED",
        "totalAmount": 155000,
        "createdAt": "2026-07-19T05:00:00.000Z",
        "user": { "name": "Siti Cholifah", "email": "siti@example.com" }
      }
    ]
  }
}
```

---

### `GET /api/dashboard/admin` — Admin Only

**Tujuan:** Dashboard kerja harian untuk Admin — fokus pada order yang perlu ditindaklanjuti.

**Auth:** httpOnly Cookie `tokenAdmin` dengan `role = ADMIN`.

**Logika:** Sama dengan Owner Dashboard, **tanpa** data omset (karena omset adalah informasi bisnis yang hanya diperuntukkan Owner).

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "activeOrders": [
      {
        "id": "ord_123",
        "orderNumber": "ORD-1721390400000",
        "status": "PROCESSING",
        "totalAmount": 155000,
        "user": { "name": "Siti Cholifah", "email": "siti@example.com" },
        "items": [...]
      }
    ],
    "orders30Days": [
      {
        "id": "ord_123",
        "orderNumber": "ORD-1721390400000",
        "status": "COMPLETED",
        "totalAmount": 155000,
        "createdAt": "2026-07-19T05:00:00.000Z",
        "user": { "name": "Siti Cholifah", "email": "siti@example.com" }
      }
    ]
  }
}
```

---

## 📊 Response Format Standar

Semua endpoint mengikuti format response yang konsisten:

**Sukses:**

```json
{
  "status": "success",
  "data": { ... },
  "message": "Pesan opsional"
}
```

**Error:**

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Ada data yang tidak sesuai. Periksa kembali isian kamu.",
  "errors": {
    "email": ["Format email tidak valid"],
    "password": ["Password minimal 6 karakter"]
  }
}
```

---

## 🚨 Kode Error

| HTTP Status | Code                    | Kapan Terjadi                                                            |
| ----------- | ----------------------- | ------------------------------------------------------------------------ |
| 400         | `VALIDATION_ERROR`      | Input tidak valid (format salah, field wajib kosong)                     |
| 401         | `UNAUTHORIZED`          | Belum login, token expired, atau token tidak valid                       |
| 403         | `FORBIDDEN`             | Sudah login tapi tidak punya hak akses (wrong role, bukan milik sendiri) |
| 404         | `NOT_FOUND`             | Data yang dicari tidak ada di database                                   |
| 409         | `CONFLICT_ERROR`        | Data sudah ada (misal: email sudah terdaftar)                            |
| 422         | `INVALID_REFERENCE`     | ID referensi tidak valid (misal: `productId` tidak ada)                  |
| 500         | `INTERNAL_SERVER_ERROR` | Kesalahan tak terduga di server                                          |

**Perbedaan 401 vs 403:**

- `401 Unauthorized`: Kamu belum membuktikan siapa dirimu (belum login).
- `403 Forbidden`: Kamu sudah login, tapi tidak diizinkan mengakses resource itu (salah role, atau data milik orang lain).

---

## 🧪 Test Suite

Jalankan seluruh integration test:

```bash
npm test
```

| Suite       | ID                        | Jumlah Skenario |
| ----------- | ------------------------- | --------------- |
| Auth        | UC-AUTH-01 s/d UC-AUTH-09 | 9               |
| Product     | UC-PROD-01 s/d UC-PROD-08 | 8               |
| Cart        | UC-CART-01 s/d UC-CART-06 | 6               |
| Custom Cake | UC-CC-01 s/d UC-CC-09     | 9               |
| Order       | UC-ORD-01 s/d UC-ORD-15   | 15              |
| Profile     | UC-PRF-01 s/d UC-PRF-04   | 4               |
| Review      | UC-REV-01 s/d UC-REV-06   | 6               |
| Dashboard   | UC-DSH-01 s/d UC-DSH-07   | 7               |
| **Total**   |                           | **62 skenario** |

**Cara kerja test:**

- Setiap test suite berjalan dalam **isolasi** — database dibersihkan sebelum dan sesudah setiap suite.
- Test menggunakan **supertest** untuk simulasi HTTP request langsung ke server.
- Data test dibuat fresh di setiap run (tidak bergantung pada data production).

---

## ❓ Troubleshooting

| Masalah                             | Kemungkinan Penyebab                 | Solusi                                          |
| ----------------------------------- | ------------------------------------ | ----------------------------------------------- |
| `connect ECONNREFUSED`              | PostgreSQL tidak berjalan            | Jalankan PostgreSQL, cek `DATABASE_URL`         |
| `Invalid API Key` (Cloudinary)      | Konfigurasi salah                    | Cek `CLOUDINARY_*` di `.env`                    |
| `PrismaClientKnownRequestError`     | Schema tidak sinkron                 | Jalankan `npx prisma migrate dev`               |
| `Prisma Client not generated`       | Client belum dibuat                  | Jalankan `npx prisma generate`                  |
| Port sudah dipakai                  | Port 3000 dipakai proses lain        | Ganti `PORT` di `.env`                          |
| `401 Unauthorized` di Postman       | Belum login atau cookie hilang       | Login ulang, aktifkan Cookie Jar                |
| Cookie tidak terkirim               | Cookie Jar Postman nonaktif          | Settings → Cookies → aktifkan                   |
| Test timeout                        | Database tidak dapat diakses         | Pastikan DB berjalan, jalankan `npm test` ulang |
| `403 Forbidden` saat akses order    | Bukan milik user ini / role salah    | Gunakan akun yang sesuai                        |
| `z.preprocess` error di custom cake | Nilai boolean dikirim sebagai string | Normal — sistem sudah handle ini otomatis       |

---

## 📁 Variabel Environment Lengkap

| Variable                | Tipe   | Keterangan                                 | Contoh                                         |
| ----------------------- | ------ | ------------------------------------------ | ---------------------------------------------- |
| `DATABASE_URL`          | string | Koneksi string PostgreSQL                  | `postgresql://postgres:pass@localhost:5432/db` |
| `PORT`                  | number | Port server Express                        | `3000`                                         |
| `JWT_SECRET`            | string | Secret untuk sign/verify JWT (min 64 char) | `a3f1c2e4b9d7...`                              |
| `CLOUDINARY_NAME`       | string | Cloud Name dari Cloudinary dashboard       | `my-cloud-name`                                |
| `CLOUDINARY_API_KEY`    | string | API Key dari Cloudinary dashboard          | `123456789012345`                              |
| `CLOUDINARY_API_SECRET` | string | API Secret dari Cloudinary dashboard       | `abcDEFghiJKL...`                              |

> 💡 Gunakan perintah `node -e "require('crypto').randomBytes(64).toString('hex')" | pbcopy` (Mac/Linux) untuk generate `JWT_SECRET` secara aman.
