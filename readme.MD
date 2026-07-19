# 🎂 Aplikasi Skripsi Performa — API Documentation

Panduan lengkap setup, menjalankan server, testing, dan dokumentasi seluruh endpoint API.

---

## 📋 Prerequisites

| Tool                                          | Versi Minimum |
| --------------------------------------------- | ------------- |
| [Node.js](https://nodejs.org/)                | v18+          |
| [npm](https://www.npmjs.com/)                 | v9+           |
| [Git](https://git-scm.com/)                   | -             |
| PostgreSQL                                    | v14+          |
| [Cloudinary](https://cloudinary.com/)         | Akun gratis   |
| [Postman](https://www.postman.com/downloads/) | Untuk testing |

---

## 📥 Clone & Install

```bash
# Clone repository
git clone https://github.com/cholifahdewi653-cyber/aplikasi-skripsi-performa-.git
cd aplikasi-skripsi-performa-

# Install dependencies
npm install
```

---

## ⚙️ Konfigurasi Environment

Buat file `.env` di root project:

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

**Generate JWT Secret:**

```bash
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(64).toString('hex'));"
```

---

## 🗄️ Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migrasi
npx prisma migrate dev

# (Opsional) Seed data awal
npm run seed

# (Opsional) Buka GUI database
npx prisma studio
```

---

## ▶️ Menjalankan Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server berjalan di: **`http://localhost:3000`**

---

## 🧪 Menjalankan Test

```bash
npm test
```

Output test menampilkan setiap skenario dengan ✅ (sukses) atau ❌ (error yang diharapkan) beserta data response JSON yang terformat rapi.

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

**Coverage: 59 test case, 8 suite (Auth, Product, Cart, Custom Cake, Order, Profile, Review, Dashboard)**

---

## 🗺️ API Routes Overview

| Base Route                                       | Keterangan          | Auth       |
| ------------------------------------------------ | ------------------- | ---------- |
| `POST /api/auth/register`                        | Daftar akun baru    | Public     |
| `POST /api/auth/login`                           | Login               | Public     |
| `POST /api/auth/logout`                          | Logout              | User/Admin |
| `GET /api/auth/me`                               | Data diri           | User/Admin |
| `GET /api/products`                              | Daftar produk       | Public     |
| `POST /api/products`                             | Buat produk         | Admin      |
| `PATCH /api/products/:id`                        | Update produk       | Admin      |
| `DELETE /api/products/:id`                       | Hapus produk        | Admin      |
| `GET /api/cart`                                  | Lihat keranjang     | User       |
| `POST /api/cart`                                 | Tambah ke keranjang | User       |
| `DELETE /api/cart/:id`                           | Hapus item cart     | User       |
| `POST /api/order/checkout`                       | Checkout            | User       |
| `GET /api/order/my-orders`                       | Riwayat pesanan     | User       |
| `GET /api/order/detail/:id`                      | Detail pesanan      | User/Admin/Owner |
| `GET /api/order/admin/all`                       | Semua pesanan       | Admin      |
| `PATCH /api/order/admin/:id/verify`              | Verifikasi pesanan  | Admin      |
| `PATCH /api/order/admin/:id/ship`                | Kirim pesanan       | Admin      |
| `POST /api/order/admin/:id/proof-delivery`       | Upload bukti kirim  | Admin      |
| `PATCH /api/order/admin/:id/confirm-arrival`     | Konfirmasi sampai   | Admin      |
| `PATCH /api/order/admin/requests/:id/resolve`    | Resolve cancel      | Admin      |
| `POST /api/order/my-orders/:id/payment-proof`    | Upload bukti bayar  | User       |
| `PATCH /api/order/my-orders/:id/edit-payment`    | Edit pembayaran     | User       |
| `POST /api/order/my-orders/:id/cancel`           | Ajukan cancel       | User       |
| `POST /api/order/my-orders/:id/reorder`          | Beli lagi           | User       |
| `GET /api/custom-cakes/all-options`              | Semua opsi kustom   | Public     |
| `POST /api/custom-cakes/order`                   | Pesan custom cake   | User       |
| `GET /api/custom-cakes/order/:id`                | Detail custom cake  | User       |
| `POST /api/custom-cakes/options/:category`       | Buat opsi           | Admin      |
| `GET /api/custom-cakes/options/:category`        | List opsi           | Admin      |
| `PATCH /api/custom-cakes/options/:category/:id`  | Update opsi         | Admin      |
| `DELETE /api/custom-cakes/options/:category/:id` | Hapus opsi          | Admin      |
| `PATCH /api/profile/update-profile`              | Update profil       | User/Admin |
| `POST /api/reviews`                              | Buat review         | User       |
| `GET /api/reviews/product/:productId`            | Review produk       | Public     |

> 🍪 **Auth via httpOnly Cookie** — setelah login, token tersimpan otomatis di cookie. Postman mengirimnya otomatis tanpa konfigurasi manual.

---

## 👤 AUTH

### Register

**`POST /api/auth/register`** — Public

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

### Login

**`POST /api/auth/login`** — Public

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

> Cookie `tokenUser` (atau `tokenAdmin` untuk admin) otomatis di-set oleh server.

---

### Get Me

**`GET /api/auth/me`** — User / Admin

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

### Logout

**`POST /api/auth/logout`** — User / Admin

**Response 200:**

```json
{
  "status": "success",
  "message": "Logout berhasil"
}
```

---

## 👤 PROFILE

### Update Profil

**`PATCH /api/profile/update-profile`** — User / Admin  
Content-Type: `multipart/form-data`

| Field          | Tipe                      | Keterangan             |
| -------------- | ------------------------- | ---------------------- |
| `name`         | string                    | Nama lengkap           |
| `phoneNumber`  | string                    | Nomor HP               |
| `address`      | string                    | Alamat lengkap         |
| `city`         | string                    | Kota                   |
| `postalCode`   | string                    | Kode pos               |
| `jenisKelamin` | `LAKI_LAKI` / `PEREMPUAN` | Jenis kelamin          |
| `foto`         | file (jpg/png)            | Foto profil (opsional) |
| `department`   | string                    | Khusus Admin           |
| `adminNotes`   | string                    | Khusus Admin           |

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
    "jenisKelamin": "PEREMPUAN"
  }
}
```

---

## 🛍️ PRODUCTS

### Get All Products

**`GET /api/products`** — Public

Query params (opsional): `?category=KECIL&search=cokelat`

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

### Get One Product

**`GET /api/products/:id`** — Public

Gunakan ID atau slug produk.

```
GET /api/products/kue-ultah-cokelat
GET /api/products/cmp1abc2def3
```

---

### Create Product _(Admin only)_

**`POST /api/products`** — Admin  
Content-Type: `multipart/form-data`

| Field         | Tipe                      | Wajib | Keterangan               |
| ------------- | ------------------------- | :---: | ------------------------ |
| `name`        | string                    |  ✅   | Nama produk              |
| `description` | string                    |  ✅   | Deskripsi                |
| `basePrice`   | number                    |  ✅   | Harga dasar              |
| `category`    | `KECIL`/`BESAR`/`PREMIUM` |  ✅   | Kategori                 |
| `stock`       | `ready`/`preorder`        |  ✅   | Jenis stok               |
| `variantRasa` | string                    |   -   | Varian rasa (pisah koma) |
| `sizes`       | JSON string               |   -   | Array ukuran & harga     |
| `images`      | file/URL                  |   -   | Gambar produk            |

**Contoh body:**

```
name          = Kue Ulang Tahun Strawberry
description   = Kue segar dengan topping strawberry segar
basePrice     = 85000
category      = KECIL
stock         = ready
variantRasa   = Strawberry
sizes         = [{"name":"Loyang 16cm","price":85000},{"name":"Loyang 20cm","price":110000}]
images        = [file upload atau URL]
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

### Update Product _(Admin only)_

**`PATCH /api/products/:id`** — Admin  
Content-Type: `multipart/form-data`

Field sama seperti Create, semua opsional.

---

### Delete Product _(Admin only)_

**`DELETE /api/products/:id`** — Admin

**Response 200:**

```json
{
  "status": "success",
  "message": "Produk berhasil dihapus"
}
```

---

## 🎂 CUSTOM CAKE

### Get All Options (Form Kustomisasi)

**`GET /api/custom-cakes/all-options`** — Public

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "baseCakes": [
      { "id": "cmp1...", "name": "Vanilla Sponge", "price": 50000 }
    ],
    "tipeCreams": [
      { "id": "cmp2...", "name": "Whipped Cream", "price": 15000 }
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

### Order Custom Cake

**`POST /api/custom-cakes/order`** — User  
Content-Type: `multipart/form-data`

| Field          | Tipe           | Wajib | Keterangan                                                     |
| -------------- | -------------- | :---: | -------------------------------------------------------------- |
| `baseCakeId`   | string         |  ✅   | ID base cake                                                   |
| `tipeCreamId`  | string         |  ✅   | ID tipe krim                                                   |
| `warnaCreamId` | string         |  ✅   | ID warna krim                                                  |
| `layers`       | JSON string    |  ✅   | Array layer: `[{"layerId":"...","sizeId":"...","position":1}]` |
| `ucapan`       | string         |   -   | Tulisan di kue                                                 |
| `catatan`      | string         |   -   | Catatan tambahan                                               |
| `foto`         | file (jpg/png) |   -   | Foto referensi desain                                          |

**Contoh body:**

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

### Get Detail Custom Cake

**`GET /api/custom-cakes/order/:id`** — User

---

### Admin: CRUD Opsi Custom Cake

**Category** yang tersedia: `base-cake` | `tipe-cream` | `warna-cream` | `layer` | `size`

```
POST   /api/custom-cakes/options/:category          → Create opsi
GET    /api/custom-cakes/options/:category          → List semua opsi
GET    /api/custom-cakes/options/:category/:id      → Detail satu opsi
PATCH  /api/custom-cakes/options/:category/:id      → Update opsi
DELETE /api/custom-cakes/options/:category/:id      → Hapus opsi
```

**Contoh Create BaseCake:**

**`POST /api/custom-cakes/options/base-cake`** — Admin

```json
{
  "name": "Chocolate Sponge",
  "price": 60000
}
```

**Contoh Create WarnaCream:**

**`POST /api/custom-cakes/options/warna-cream`** — Admin

```json
{
  "name": "Biru Muda",
  "warna": "Biru",
  "hex": "#ADD8E6",
  "price": 12000
}
```

---

## 🛒 CART

### Get Cart

**`GET /api/cart`** — User

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

### Add to Cart

**`POST /api/cart`** — User

```json
{
  "productId": "cmp1abc2def3",
  "qty": 2,
  "type": "PRODUCT",
  "rasa": "Cokelat"
}
```

> `type` bisa `PRODUCT` atau `CUSTOM_CAKE`

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

### Delete Cart Item

**`DELETE /api/cart/:id`** — User

```
DELETE /api/cart/item_cmp1abc2def3
```

---

## 📦 ORDER

### Checkout

**`POST /api/order/checkout`** — User

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

| `paymentMethod` | `bank` wajib?                    |
| --------------- | -------------------------------- |
| `COD`           | ❌                               |
| `TRANSFER`      | ✅ (BCA, BNI, BRI, MANDIRI, dll) |

**Response 201:**

```json
{
  "status": "success",
  "data": {
    "id": "ord_cmp1...",
    "orderNumber": "ORD-2026-001",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "paymentMethod": "TRANSFER",
    "bank": "BCA",
    "subtotal": 150000,
    "adminFee": 5000,
    "totalAmount": 155000,
    "deliveryDate": "2026-08-01T10:00:00.000Z",
    "items": [...]
  }
}
```

---

### Get My Orders

**`GET /api/order/my-orders`** — User

---

### Get Order Detail (Rincian Pesanan)

**`GET /api/order/detail/:id`** — User / Admin / Owner

Mendapatkan informasi detail rincian pesanan berdasarkan ID. 
- Jika diakses oleh **USER**, hanya bisa melihat pesanan miliknya sendiri (lainnya akan mengembalikan `403 Forbidden`).
- Jika diakses oleh **ADMIN** atau **OWNER**, dapat melihat rincian pesanan siapapun.

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "id": "ord_cmp1...",
    "orderNumber": "ORD-2026-001",
    "status": "PROCESSING",
    "paymentStatus": "UNPAID",
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
        "nameSnapshot": "Kue Ultah Cokelat",
        "priceSnapshot": 75000,
        "qty": 2,
        "product": {
          "id": "prod_123",
          "name": "Kue Ultah Cokelat",
          "basePrice": 75000
        }
      }
    ],
    "trackings": [],
    "paymentSubmissions": [],
    "requests": []
  }
}
```

---

### Upload Bukti Pembayaran

**`POST /api/order/my-orders/:id/payment-proof`** — User  
Content-Type: `multipart/form-data`

| Field   | Tipe           | Keterangan          |
| ------- | -------------- | ------------------- |
| `bukti` | file (jpg/png) | Foto bukti transfer |

---

### Edit Metode Pembayaran

**`PATCH /api/order/my-orders/:id/edit-payment`** — User

```json
{
  "paymentMethod": "TRANSFER",
  "bank": "BNI"
}
```

---

### Ajukan Pembatalan

**`POST /api/order/my-orders/:id/cancel`** — User  
_(Maksimal 3 kali per order)_

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

### Beli Lagi (Reorder)

**`POST /api/order/my-orders/:id/reorder`** — User  
_(Hanya untuk order berstatus COMPLETED)_

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

### Admin: Get All Orders

**`GET /api/order/admin/all`** — Admin

---

### Admin: Verifikasi Pesanan

**`PATCH /api/order/admin/:id/verify`** — Admin

```json
{
  "action": "APPROVE"
}
```

> `action`: `APPROVE` (terima) atau `REJECT` (tolak)

---

### Admin: Kirim Pesanan

**`PATCH /api/order/admin/:id/ship`** — Admin

```json
{
  "courier": "JNE",
  "trackingNumber": "JNE1234567890"
}
```

---

### Admin: Upload Bukti Pengiriman

**`POST /api/order/admin/:id/proof-delivery`** — Admin  
Content-Type: `multipart/form-data`

| Field  | Tipe           | Keterangan              |
| ------ | -------------- | ----------------------- |
| `foto` | file (jpg/png) | Foto bukti paket sampai |

---

### Admin: Konfirmasi Pesanan Sampai

**`PATCH /api/order/admin/:id/confirm-arrival`** — Admin

Body kosong atau:

```json
{
  "note": "Paket diterima oleh penerima langsung"
}
```

---

### Admin: Resolve Cancel Request

**`PATCH /api/order/admin/requests/:requestId/resolve`** — Admin

```json
{
  "action": "APPROVE",
  "settlementType": "REFUND",
  "adminNote": "Pembatalan disetujui, dana dikembalikan dalam 3 hari kerja"
}
```

| Field            | Nilai                        |
| ---------------- | ---------------------------- |
| `action`         | `APPROVE` / `REJECT`         |
| `settlementType` | `REFUND` / `CREDIT` / `NONE` |

---

## ⭐ REVIEW

### Get Reviews Produk

**`GET /api/reviews/product/:productId`** — Public

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

### Buat Review

**`POST /api/reviews`** — User  
Content-Type: `multipart/form-data`

> Hanya bisa review item dari order berstatus **COMPLETED** milik sendiri. Satu item hanya bisa di-review satu kali.

| Field         | Tipe           | Wajib | Keterangan                            |
| ------------- | -------------- | :---: | ------------------------------------- |
| `orderItemId` | string         |  ✅   | ID item dari order yang sudah selesai |
| `rating`      | number (1–5)   |  ✅   | Rating bintang                        |
| `comment`     | string         |   -   | Komentar/ulasan                       |
| `foto`        | file (jpg/png) |   -   | Foto produk yang diterima             |

**Contoh body:**

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

### 1. Best Seller Products

**`GET /api/products/best-seller`** — Public

Mendapatkan 5 produk terlaris berdasarkan total kuantitas terjual pada pesanan yang tidak dibatalkan/ditolak. Jika data pesanan kurang dari 5, server akan melengkapi sisanya dengan produk terbaru.

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "cmrrcj9b60001...",
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

### 2. Newest Products

**`GET /api/products/newest`** — Public

Mendapatkan 10 produk reguler paling baru ditambahkan oleh Admin.

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "cmrrcj9b60001...",
      "name": "Kue Baru",
      "slug": "kue-baru",
      "basePrice": 80000,
      "category": "KECIL",
      "stockType": "READY_STOCK",
      "images": ["https://res.cloudinary.com/..."]
    }
  ]
}
```

---

### 3. Products by Category

**`GET /api/products/category/:category`** — Public

Mendapatkan seluruh produk dengan kategori tertentu (case-insensitive).

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "cmrrcj9b60001...",
      "name": "Kue Kecil Cantik",
      "category": "KECIL"
    }
  ]
}
```

---

### 4. Owner Dashboard

**`GET /api/dashboard/owner`** — Owner Only (httpOnly Cookie `tokenAdmin` dengan role `OWNER`)

Mendapatkan data laporan lengkap untuk Owner, terdiri dari grafik omset harian 30 hari terakhir, daftar pesanan aktif, dan semua order masuk dalam 30 hari terakhir.

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "omset": [
      { "date": "2026-07-18", "total": 1200000 },
      { "date": "2026-07-19", "total": 1850000 }
    ],
    "activeOrders": [
      {
        "id": "ord_123",
        "orderNumber": "ORD-2026-001",
        "status": "PROCESSING",
        "totalAmount": 155000,
        "user": { "name": "Siti Cholifah", "email": "siti@example.com" },
        "items": [...]
      }
    ],
    "orders30Days": [
      {
        "id": "ord_123",
        "orderNumber": "ORD-2026-001",
        "status": "PROCESSING",
        "totalAmount": 155000,
        "createdAt": "2026-07-19T05:00:00.000Z",
        "user": { "name": "Siti Cholifah", "email": "siti@example.com" }
      }
    ]
  }
}
```

---

### 5. Admin Dashboard

**`GET /api/dashboard/admin`** — Admin Only (httpOnly Cookie `tokenAdmin` dengan role `ADMIN`)

Mendapatkan data pesanan aktif dan semua order masuk dalam 30 hari terakhir (tanpa menyertakan data omset).

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "activeOrders": [
      {
        "id": "ord_123",
        "orderNumber": "ORD-2026-001",
        "status": "PROCESSING",
        "totalAmount": 155000,
        "user": { "name": "Siti Cholifah", "email": "siti@example.com" },
        "items": [...]
      }
    ],
    "orders30Days": [
      {
        "id": "ord_123",
        "orderNumber": "ORD-2026-001",
        "status": "PROCESSING",
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

**Kode Error Umum:**

| HTTP | Code                    | Keterangan                  |
| ---- | ----------------------- | --------------------------- |
| 400  | `VALIDATION_ERROR`      | Input tidak valid           |
| 401  | `UNAUTHORIZED`          | Belum login / token expired |
| 403  | `FORBIDDEN`             | Tidak punya akses           |
| 404  | `NOT_FOUND`             | Data tidak ditemukan        |
| 409  | `CONFLICT_ERROR`        | Data sudah ada (duplikat)   |
| 422  | `INVALID_REFERENCE`     | Referensi ID tidak valid    |
| 500  | `INTERNAL_SERVER_ERROR` | Kesalahan server            |

---

## 🧪 Test Suite

Jalankan seluruh integration test:

```bash
npm test
```

| Suite       | Use Cases                              |
| ----------- | -------------------------------------- |
| Auth        | UC-AUTH-01 s/d UC-AUTH-09 (9 skenario) |
| Product     | UC-PROD-01 s/d UC-PROD-08 (8 skenario) |
| Cart        | UC-CART-01 s/d UC-CART-06 (6 skenario) |
| Custom Cake | UC-CC-01 s/d UC-CC-09 (9 skenario)     |
| Order       | UC-ORD-01 s/d UC-ORD-15 (15 skenario)  |
| Profile     | UC-PRF-01 s/d UC-PRF-04 (4 skenario)   |
| Review      | UC-REV-01 s/d UC-REV-06 (6 skenario)   |
| Dashboard   | UC-DSH-01 s/d UC-DSH-07 (7 skenario)   |
| **Total**   | **59 skenario**                        |

---

## ❓ Troubleshooting

| Masalah                        | Solusi                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| `connect ECONNREFUSED`         | Pastikan PostgreSQL berjalan dan `DATABASE_URL` benar          |
| `Invalid API Key` (Cloudinary) | Cek `CLOUDINARY_API_KEY` dan `CLOUDINARY_API_SECRET` di `.env` |
| `Prisma Client not generated`  | Jalankan `npx prisma generate`                                 |
| Port sudah dipakai             | Ganti `PORT` di `.env` ke port lain (misal `3001`)             |
| `401 Unauthorized` di Postman  | Pastikan sudah login dan cookie aktif                          |
| Cookie tidak terkirim          | Pastikan **Cookie Jar** aktif di Postman                       |
| Test timeout                   | Pastikan database bisa diakses, jalankan `npm test` ulang      |

---

## 📁 Variabel Environment

| Variable                | Keterangan               | Contoh                                         |
| ----------------------- | ------------------------ | ---------------------------------------------- |
| `DATABASE_URL`          | Koneksi PostgreSQL       | `postgresql://postgres:pass@localhost:5432/db` |
| `PORT`                  | Port server              | `3000`                                         |
| `JWT_SECRET`            | Secret JWT (min 64 char) | `a3f1c2e4b9d7...`                              |
| `CLOUDINARY_NAME`       | Cloud Name Cloudinary    | `my-cloud-name`                                |
| `CLOUDINARY_API_KEY`    | API Key Cloudinary       | `123456789012345`                              |
| `CLOUDINARY_API_SECRET` | API Secret Cloudinary    | `abcDEFghiJKL...`                              |

> 💡 Jangan pernah commit file `.env` ke repository. Pastikan `.env` ada di `.gitignore`.
