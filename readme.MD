# 🚀 Aplikasi Skripsi Performa — Setup Guide

Panduan lengkap untuk melakukan pull, instalasi, menjalankan server, dan testing API menggunakan Postman.

---

## 📋 Prerequisites

Pastikan kamu sudah menginstall tools berikut sebelum memulai:

- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- Database PostgreSQL (lokal atau cloud)
- Akun [Cloudinary](https://cloudinary.com/) (untuk upload media)
- [Postman](https://www.postman.com/downloads/) (untuk testing API)

---

## 📥 1. Clone / Pull Repository

### Clone pertama kali

```bash
git clone https://github.com/cholifahdewi653-cyber/aplikasi-skripsi-performa-.git
cd aplikasi-skripsi-performa-
```

### Pull update terbaru (jika sudah pernah clone)

```bash
git pull origin main
```

---

## 📦 2. Install Dependencies

```bash
npm install
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
JWT_SECRET="isi_dengan_hasil_generate_di_bawah"

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

## 🔑 4. Generate JWT Secret via CLI (Node.js Crypto)

Buka terminal, jalankan perintah berikut:

```bash
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(64).toString('hex'));"
```

Output-nya berupa string panjang seperti ini:

```
a3f1c2e4b9d76f3a1c2e4b9d76f3a1c2e4b9d76f3a1c2e4b9d76f3a1c2e4b9d7...
```

Salin output tersebut, lalu tempel ke `.env`:

```dotenv
JWT_SECRET="a3f1c2e4b9d7..."
```

> ⚠️ Jangan pernah pakai JWT secret yang pendek atau mudah ditebak di production.

---

## 🗄️ 5. Setup Database dengan Prisma

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

## ▶️ 6. Menjalankan Aplikasi

### Mode Development (dengan auto-reload)

```bash
npm run dev
```

### Mode Production

```bash
npm start
```

Server akan berjalan di: **http://localhost:3000** (atau sesuai `PORT` di `.env`)

---

## 🧪 Quick Start — Semua Langkah Sekaligus

```bash
# 1. Clone repo
git clone https://github.com/cholifahdewi653-cyber/aplikasi-skripsi-performa-.git
cd aplikasi-skripsi-performa-

# 2. Install dependencies
npm install

# 3. Generate JWT Secret (salin outputnya ke .env)
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(64).toString('hex'));"

# 4. Buat file .env dan isi semua konfigurasi (lihat bagian di atas)

# 5. Setup database
npx prisma generate
npx prisma migrate dev

# 6. Jalankan server
npm run dev
```

---

## 🗺️ API Routes Overview

Server berjalan di `http://localhost:3000`. Berikut daftar base route yang tersedia:

| Base Route            | Keterangan                            |
| --------------------- | ------------------------------------- |
| `/api/auth/...`       | Autentikasi (register, login, logout) |
| `/api/products/...`   | Manajemen produk                      |
| `/api/categories/...` | Manajemen kategori                    |
| `/api/profile/...`    | Profil pengguna                       |
| `/api/cart/...`       | Keranjang belanja                     |
| `/api/order/...`      | Manajemen order                       |

> 📂 Detail lengkap setiap endpoint bisa dilihat di folder `src/routes/`.

---

## 📬 Testing API dengan Postman

### A. Membuat Akun & Install Postman

1. Buka [postman.com](https://www.postman.com/) → klik **Sign Up**
2. Daftar menggunakan email atau akun Google
3. Download & install **Postman Desktop** dari [postman.com/downloads](https://www.postman.com/downloads/)
4. Buka aplikasi Postman → login dengan akun yang baru dibuat

### B. Membuat Collection Baru

1. Di sidebar kiri → klik **Collections**
2. Klik tombol **+** → pilih **Blank Collection**
3. Beri nama: `Aplikasi Skripsi Performa`
4. Tekan **Enter** untuk menyimpan

### C. Cara Membuat & Menjalankan Request

Untuk setiap endpoint di bawah, ikuti langkah ini:

1. Klik tombol **+** (New Tab) di area utama Postman
2. Pilih **HTTP method** (POST, GET, dll) di dropdown kiri
3. Masukkan **URL** di kolom address bar
4. Buka tab **Body** → pilih **raw** → ubah format ke **JSON**
5. Paste **body JSON** sesuai contoh di bawah
6. Klik tombol **Send** (biru)
7. Lihat response di panel bawah

---

## 👤 Contoh Request Auth

> 🍪 **Catatan penting — httpOnly Cookie:**
> Aplikasi ini menggunakan **httpOnly cookie** untuk menyimpan token JWT, bukan melalui response body. Ini lebih aman karena cookie tidak dapat diakses oleh JavaScript di sisi client.
>
> **Cara kerja di Postman:**
>
> - Setelah login berhasil, server otomatis mengirim cookie `token` ke browser / Postman.
> - Postman akan **menyimpan dan mengirim ulang cookie secara otomatis** pada request berikutnya selama session masih aktif.
> - Kamu **tidak perlu** menyalin token secara manual — cukup pastikan fitur **Cookie Jar** di Postman aktif (aktif by default).
>
> ✅ Tidak perlu lagi set `Authorization: Bearer <token>` secara manual di setiap request.

---

### 1. Register Admin

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/register`
- **Body (JSON):**

```json
{
  "name": "admin_test",
  "email": "adminTest@gmail.com",
  "password": "admin12345",
  "confirmPassword": "admin12345",
  "role": "ADMIN"
}
```

---

### 2. Register User

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/register`
- **Body (JSON):**

```json
{
  "name": "user_test",
  "email": "userTest@gmail.com",
  "password": "user12345",
  "confirmPassword": "user12345"
}
```

---

### 3. Login Admin

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/login`
- **Body (JSON):**

```json
{
  "email": "adminTest@gmail.com",
  "password": "admin12345"
}
```

> ✅ Setelah login berhasil, server akan mengirimkan **httpOnly cookie** yang berisi token JWT. Postman menyimpannya otomatis — request selanjutnya sudah terautentikasi tanpa perlu setting manual.

---

### 4. Login User

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/login`
- **Body (JSON):**

```json
{
  "email": "userTest@gmail.com",
  "password": "user12345"
}
```

---

### D. Autentikasi di Request Selanjutnya (httpOnly Cookie)

Karena token disimpan di **httpOnly cookie**, Postman secara otomatis menyertakannya di setiap request berikutnya. **Kamu tidak perlu melakukan setting apapun** selama cookie belum expired dan kamu menggunakan session Postman yang sama.

> 💡 Jika ingin memastikan cookie aktif: buka **Postman → Cookies** (pojok kanan atas area request) dan cari cookie `token` untuk domain `localhost`.

---

## 👤 Contoh Request Profile

### 1. Get My Profile (Get Me)

Endpoint ini digunakan untuk mengambil data profil pengguna yang sedang login.

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/profile/me`
- **Authorization:** httpOnly Cookie (otomatis)
- **Body:** tidak diperlukan

---

### 2. Update Profile

Endpoint ini digunakan untuk memperbarui data profil pengguna yang sedang login.

- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/profile/me`
- **Authorization:** httpOnly Cookie (otomatis)
- **Body (JSON):**

```json
{
  "name": "user1_update",
  "phoneNumber": "0887772890",
  "address": "test_1",
  "city": "test_1",
  "postalCode": "54261",
  "image": "https://images.unsplash.com/photo-1768405942784-0d48a1f44fe7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1fHx8ZW58MHx8fHx8"
}
```

> 💡 Semua field bersifat opsional — kamu bisa mengirim hanya field yang ingin diperbarui.

---

## 🛒 Contoh Request Products

> 📌 **Ringkasan Akses:**
>
> | Endpoint       | Admin | User |
> | -------------- | :---: | :--: |
> | Get All        |  ✅   |  ✅  |
> | Get One by ID  |  ✅   |  ✅  |
> | Create Product |  ✅   |  ❌  |
> | Update Product |  ✅   |  ❌  |
> | Delete Product |  ✅   |  ❌  |

---

### 1. Get All Products

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/products/`
- **Authorization:** httpOnly Cookie (otomatis)
- **Body:** tidak diperlukan

---

### 2. Get One Product by ID

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/products/cmoh6gusm0008ewu1eqkezcfs`
- **Authorization:** httpOnly Cookie (otomatis)
- **Body:** tidak diperlukan

> 💡 Ganti `cmoh6gusm0008ewu1eqkezcfs` dengan ID produk yang ingin dilihat.

---

### 3. Create Product — CUSTOM Pricing _(Admin only)_

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/products/`
- **Authorization:** httpOnly Cookie **Admin** (otomatis)
- **Body (JSON):**

```json
{
  "name": "Kue Ultah Custom",
  "slug": "kue-ultah-custom",
  "description": "Kue custom pilih rasa dan ukuran sendiri",
  "categoryId": "cmoh6cmpm0000ewu1eles6m51",
  "pricingType": "CUSTOM",
  "basePrice": 50000,
  "isPublished": true,
  "isFeatured": false,
  "images": [
    "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FrZXxlbnwwfHwwfHx8MA%3D%3D"
  ],
  "variants": [
    { "name": "Coklat", "isBase": true, "priceAdjust": 0 },
    { "name": "Vanilla", "isBase": false, "priceAdjust": 5000 },
    { "name": "Keju", "isBase": false, "priceAdjust": 8000 }
  ],
  "sizes": [
    { "label": "16", "isBase": true, "priceAdjust": 0, "stock": 10 },
    { "label": "20", "isBase": false, "priceAdjust": 15000, "stock": 8 },
    { "label": "24", "isBase": false, "priceAdjust": 30000, "stock": 5 }
  ]
}
```

---

### 4. Create Product — FIXED Pricing _(Admin only)_

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/products/`
- **Authorization:** httpOnly Cookie **Admin** (otomatis)
- **Body (JSON):**

```json
{
  "name": "Kue Lapis Legit Premium",
  "slug": "kue-lapis-legit-premium",
  "description": "Kue lapis legit tradisional dengan mentega wisman asli. Tekstur lembut dan wangi.",
  "categoryId": "cmoh6cmpm0000ewu1eles6m51",
  "pricingType": "FIXED",
  "basePrice": 150000,
  "isPublished": true,
  "isFeatured": true,
  "images": [
    "https://images.unsplash.com/photo-1768321139994-81a8e8862f5e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0fHx8ZW58MHx8fHx8"
  ],
  "variants": [
    { "name": "Original (Polos)", "isBase": true, "priceAdjust": 0 },
    { "name": "Keju Kraft", "isBase": false, "priceAdjust": 25000 },
    { "name": "Prunes (Selingan)", "isBase": false, "priceAdjust": 35000 }
  ],
  "sizes": [
    {
      "label": "Setengah Loyang (10x20)",
      "isBase": true,
      "priceAdjust": 0,
      "stock": 20
    },
    {
      "label": "Satu Loyang (20x20)",
      "isBase": false,
      "priceAdjust": 140000,
      "stock": 15
    }
  ]
}
```

---

### 5. Update Product _(Admin only)_

- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/products/:id`
- **Authorization:** httpOnly Cookie **Admin** (otomatis)
- **Body (JSON):**

```json
{
  "name": "Kue Lapis Legit Premium - Edisi Lebaran",
  "basePrice": 160000,
  "isFeatured": true,
  "variants": [
    {
      "name": "Coklat",
      "isBase": false,
      "priceAdjust": 30000
    }
  ],
  "sizes": [
    {
      "label": "Loyang 20cm",
      "isBase": true,
      "priceAdjust": 0,
      "stock": 50
    }
  ]
}
```

> 💡 Ganti `:id` di URL dengan ID produk yang ingin diupdate, contoh:
> `http://localhost:3000/api/products/cmoh6gusm0008ewu1eqkezcfs`

---

### 6. Delete Product _(Admin only)_

- **Method:** `DELETE`
- **URL:** `http://localhost:3000/api/products/:id`
- **Authorization:** httpOnly Cookie **Admin** (otomatis)
- **Body:** tidak diperlukan

> 💡 Ganti `:id` di URL dengan ID produk yang ingin dihapus, contoh:
> `http://localhost:3000/api/products/cmoh6gusm0008ewu1eqkezcfs`

---

## 🗂️ Contoh Request Categories

> 📌 **Ringkasan Akses:**
>
> | Endpoint        | Admin | User |
> | --------------- | :---: | :--: |
> | Get All         |  ✅   |  ✅  |
> | Get One by ID   |  ✅   |  ✅  |
> | Create Category |  ✅   |  ❌  |
> | Update Category |  ✅   |  ❌  |
> | Delete Category |  ✅   |  ❌  |

---

### 1. Get All Categories

Endpoint ini untuk mengambil seluruh daftar kategori yang tersedia.

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/categories/`
- **Authorization:** httpOnly Cookie (otomatis)
- **Body:** tidak diperlukan

---

### 2. Get One Category by ID

Endpoint ini untuk mengambil detail satu kategori berdasarkan ID-nya.

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/categories/:id`
- **Authorization:** httpOnly Cookie (otomatis)
- **Body:** tidak diperlukan

> 💡 Ganti `:id` dengan ID kategori yang ingin dilihat, contoh:
> `http://localhost:3000/api/categories/cmoh6cmpm0000ewu1eles6m51`

---

### 3. Create Category _(Admin only)_

Endpoint ini untuk membuat kategori baru.

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/categories/`
- **Authorization:** httpOnly Cookie **Admin** (otomatis)
- **Body (JSON):**

```json
{
  "name": "Kue Lapis Legit minimum",
  "slug": "kue-lapis-legit-minimum"
}
```

---

### 4. Update Category _(Admin only)_

Endpoint ini untuk memperbarui data kategori yang sudah ada.

- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/categories/:id`
- **Authorization:** httpOnly Cookie **Admin** (otomatis)
- **Body (JSON):**

```json
{
  "name": "update_categories",
  "slug": "update_categories"
}
```

> 💡 Ganti `:id` dengan ID kategori yang ingin diupdate, contoh:
> `http://localhost:3000/api/categories/cmoh6cmpm0000ewu1eles6m51`

---

### 5. Delete Category _(Admin only)_

Endpoint ini untuk menghapus kategori berdasarkan ID-nya.

- **Method:** `DELETE`
- **URL:** `http://localhost:3000/api/categories/:id`
- **Authorization:** httpOnly Cookie **Admin** (otomatis)
- **Body:** tidak diperlukan

> 💡 Ganti `:id` dengan ID kategori yang ingin dihapus, contoh:
> `http://localhost:3000/api/categories/cmoh6cmpm0000ewu1eles6m51`

---

## 🛒 Contoh Request Cart

> 📌 **Catatan:** Semua endpoint cart hanya bisa diakses oleh **User yang sedang login**. Setiap user hanya bisa melihat dan mengelola cart milik mereka sendiri.

---

### 1. Get Cart (Lihat Isi Keranjang)

Endpoint ini untuk mengambil semua item yang ada di keranjang belanja milik user yang sedang login.

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/cart/`
- **Authorization:** httpOnly Cookie **User** (otomatis)
- **Body:** tidak diperlukan

---

### 2. Add Item to Cart (Tambah ke Keranjang)

Endpoint ini untuk menambahkan produk ke dalam keranjang belanja. Gunakan path URL yang sama dengan Get Cart, bedanya hanya di HTTP method-nya.

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/cart/`
- **Authorization:** httpOnly Cookie **User** (otomatis)
- **Body (JSON):**

```json
{
  "productId": "cmoh6gusm0008ewu1eqkezcfs",
  "variantId": "cmoh6gusm0009ewu1eqkezcfs",
  "sizeId": "cmoh6gusm0010ewu1eqkezcfs",
  "quantity": 2
}
```

> 💡 Sesuaikan `productId`, `variantId`, dan `sizeId` dengan ID yang ada di database. Kamu bisa dapatkan ID ini dari response endpoint **Get All Products**.

---

### 3. Delete Cart Item (Hapus Item dari Keranjang)

Endpoint ini untuk menghapus satu item tertentu dari keranjang belanja berdasarkan ID cart item-nya.

- **Method:** `DELETE`
- **URL:** `http://localhost:3000/api/cart/:id`
- **Authorization:** httpOnly Cookie **User** (otomatis)
- **Body:** tidak diperlukan

> 💡 Ganti `:id` dengan ID cart item yang ingin dihapus, contoh:
> `http://localhost:3000/api/cart/cmohaewyf0000vku1hpykiw2s`
>
> ID cart item bisa diperoleh dari response endpoint **Get Cart** di atas.

---

## 📦 Contoh Request Order

> 📌 **Ringkasan Akses:**
>
> | Endpoint                   | Admin | User |
> | -------------------------- | :---: | :--: |
> | My Orders (per user)       |  ❌   |  ✅  |
> | All Orders (semua orderan) |  ✅   |  ❌  |
> | Checkout                   |  ❌   |  ✅  |
> | Update Status Order        |  ✅   |  ❌  |

---

### 1. My Orders (Riwayat Pesanan User)

Endpoint ini untuk mengambil semua pesanan milik user yang sedang login.

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/order/my-orders`
- **Authorization:** httpOnly Cookie **User** (otomatis)
- **Body:** tidak diperlukan

---

### 2. All Orders — Admin (Semua Pesanan)

Endpoint ini untuk mengambil seluruh pesanan dari semua user. Hanya bisa diakses oleh Admin.

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/order/admin/all`
- **Authorization:** httpOnly Cookie **Admin** (otomatis)
- **Body:** tidak diperlukan

---

### 3. Checkout

Endpoint ini untuk membuat pesanan baru. Mendukung **2 cara checkout**:

#### a) Checkout dari Cart

Checkout berdasarkan item yang sudah ada di keranjang belanja.

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/order/checkout`
- **Authorization:** httpOnly Cookie **User** (otomatis)
- **Body (JSON):**

```json
{
  "source": "cart",
  "cartItemIds": ["cmohaewyf0000vku1hpykiw2s", "cmohaewyf0001vku1hpykiw2s"],
  "shippingAddress": "Jl. Merdeka No. 10, Purwokerto",
  "notes": "Tolong dikemas dengan rapi"
}
```

> 💡 `cartItemIds` diisi dengan ID item yang ada di cart (didapat dari response **Get Cart**). Hanya item yang dipilih saja yang akan di-checkout.

#### b) Checkout Direct (Langsung)

Checkout langsung tanpa melalui cart — cocok untuk pembelian cepat satu produk.

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/order/checkout`
- **Authorization:** httpOnly Cookie **User** (otomatis)
- **Body (JSON):**

```json
{
  "source": "direct",
  "productId": "cmoh6gusm0008ewu1eqkezcfs",
  "variantId": "cmoh6gusm0009ewu1eqkezcfs",
  "sizeId": "cmoh6gusm0010ewu1eqkezcfs",
  "quantity": 1,
  "shippingAddress": "Jl. Merdeka No. 10, Purwokerto",
  "notes": "Tanpa lilin ya"
}
```

---

### 4. Update Status Pesanan — Admin

Endpoint ini untuk memperbarui status pesanan tertentu. Hanya bisa diakses oleh Admin.

- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/order/admin/:id/status`
- **Authorization:** httpOnly Cookie **Admin** (otomatis)
- **Body (JSON):**

```json
{
  "status": "PROCESSING"
}
```

> 💡 Ganti `:id` dengan ID order yang ingin diupdate statusnya, contoh:
> `http://localhost:3000/api/order/admin/cmohbfebe0000xku1vuvqfoj1/status`
>
> Nilai `status` yang umum digunakan:
>
> | Status       | Keterangan                         |
> | ------------ | ---------------------------------- |
> | `PENDING`    | Pesanan baru masuk, belum diproses |
> | `PROCESSING` | Pesanan sedang diproses / dibuat   |
> | `SHIPPED`    | Pesanan sudah dikirim              |
> | `DELIVERED`  | Pesanan sudah diterima             |
> | `CANCELLED`  | Pesanan dibatalkan                 |

---

## ❓ Troubleshooting

| Masalah                          | Solusi                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `Error: connect ECONNREFUSED`    | Pastikan PostgreSQL sudah berjalan dan `DATABASE_URL` sudah benar                  |
| `Invalid API Key` (Cloudinary)   | Cek kembali nilai `CLOUDINARY_API_KEY` dan `CLOUDINARY_API_SECRET` di `.env`       |
| `Prisma Client not generated`    | Jalankan `npx prisma generate` terlebih dahulu                                     |
| Port sudah digunakan             | Ganti nilai `PORT` di `.env` ke port lain (misal `3001`)                           |
| `401 Unauthorized` di Postman    | Pastikan sudah login dan cookie masih aktif (cek via Postman → Cookies)            |
| `Cannot POST /api/auth/register` | Pastikan server sudah berjalan dengan `npm run dev`                                |
| Response kosong / error 500      | Cek terminal server untuk melihat pesan error lengkap                              |
| Cookie tidak terkirim di Postman | Pastikan **Cookie Jar** aktif di Postman — buka Cookies dan cek domain `localhost` |

---

## 📁 Variabel Environment — Referensi Lengkap

| Variable                | Keterangan                           | Contoh                                         |
| ----------------------- | ------------------------------------ | ---------------------------------------------- |
| `DATABASE_URL`          | Koneksi string PostgreSQL            | `postgresql://postgres:pass@localhost:5432/db` |
| `PORT`                  | Port server Express                  | `3000`                                         |
| `JWT_SECRET`            | Secret key JWT (generate via crypto) | `a3f1c2e4b9d7...`                              |
| `CLOUDINARY_API_KEY`    | API Key dari Cloudinary              | `123456789012345`                              |
| `CLOUDINARY_API_SECRET` | API Secret dari Cloudinary           | `abcDEFghiJKL...`                              |
| `CLOUDINARY_NAME`       | Cloud Name dari Cloudinary           | `my-cloud-name`                                |

---

> 💡 **Tip:** Jangan pernah commit file `.env` ke repository. Pastikan `.env` sudah ada di `.gitignore`.
