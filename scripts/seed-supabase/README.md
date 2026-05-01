# 🌱 HUMI HRM – Supabase Seed Script

Script này giúp bạn tự động thêm schema + dữ liệu vào Supabase.

## 🚀 Cách sử dụng

### 1️⃣ Chuẩn bị Supabase

- Tạo dự án trên [supabase.com](https://supabase.com)
- Lấy **Project URL** và **Anon Key** từ `Project Settings → API`

### 2️⃣ Cấu hình .env

```bash
cd scripts/seed-supabase
cp .env.example .env
```

Sửa `.env` với thông tin của bạn:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

### 3️⃣ Cài đặt dependencies

```bash
npm install
```

### 4️⃣ Chạy seed

```bash
# Thêm dữ liệu (skip nếu đã tồn tại)
npm run seed

# Chạy lại với ghi đè
npm run seed:fresh

# Chỉ xoá dữ liệu
npm run reset
```

## 📊 Dữ liệu mặc định

Seed sẽ tạo:
- **14 nhân viên** (10 employee + 3 manager + 1 admin)
- **5 ca làm việc** (Ca sáng, chiều, tối, ngắn...)
- **Tài khoản mặc định**: NV000001 / 123456
- **Tài khoản admin**: NV000014 / 123456

## ✅ Kiểm tra

Sau khi seed xong, đăng nhập vào web:
```
http://localhost:8000/login.html
Mã nhân viên: NV000001
Mật khẩu: 123456
```

Trang sẽ tự động đồng bộ dữ liệu từ Supabase (~500ms sau khi load).

## ⚙️ Chi tiết kỹ thuật

- Script sử dụng `@supabase/supabase-js` SDK v2
- Dữ liệu được INSERT bằng `upsert()` (skip nếu đã tồn tại)
- Không xoá dữ liệu cũ nếu không dùng `--force`
- Hỗ trợ `.gitignore` tự động cho `.env`
