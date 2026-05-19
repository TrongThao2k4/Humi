# Humi HRM

Humi HRM là một ứng dụng quản trị nhân sự giao diện web, được xây dựng bằng HTML, CSS và JavaScript thuần. Dự án có tích hợp Supabase để đồng bộ dữ liệu, đồng thời vẫn hỗ trợ lưu trữ cục bộ bằng `localStorage` cho các luồng thao tác nội bộ.

## Tính năng chính

- Đăng nhập, đăng xuất và xác thực OTP.
- Dashboard tổng quan cho quản trị nhân sự.
- Duyệt công, duyệt phép và quản lý danh sách phiếu nghỉ.
- Quản lý nhân viên, lịch làm việc, chia ca và thiết lập ca.
- Hộp thư, nhật ký hoạt động, xem phép tồn và xem thu nhập.
- Cài đặt hệ thống và quản trị tài khoản.

## Cấu trúc dự án

- `index.html` - Trang chủ của hệ thống.
- `login.html` - Màn hình đăng nhập.
- `pages/` - Các trang chức năng theo module.
- `js/` - Logic JavaScript cho từng tính năng.
- `css/` - Style riêng cho từng trang.
- `assets/` - Font, icon và hình ảnh.
- `supabase_schema.sql` - Schema cho cơ sở dữ liệu Supabase.
- `supabase_seed.sql` - Dữ liệu mẫu ban đầu.
- `supabase_reset.sql` - Script reset dữ liệu.
- `scripts/seed-supabase/` - Script Node để nạp dữ liệu mẫu vào Supabase.

## Yêu cầu

- Trình duyệt hiện đại như Chrome, Edge hoặc Firefox.
- Nếu muốn dùng dữ liệu mẫu từ Supabase: cài đặt Node.js 18 trở lên.
- Một project Supabase có sẵn để tạo bảng và lưu dữ liệu.

## Cách chạy nhanh

1. Mở `index.html` bằng Live Server hoặc một HTTP server tĩnh.
2. Hoặc mở trực tiếp `login.html` để vào luồng đăng nhập.

Nếu chạy bằng server tĩnh, toàn bộ menu và liên kết trang sẽ hoạt động ổn định hơn so với mở file trực tiếp.

## Cấu hình Supabase

1. Tạo project Supabase mới.
2. Chạy file `supabase_schema.sql` để tạo cấu trúc bảng.
3. Chạy `supabase_seed.sql` nếu muốn nạp dữ liệu mẫu thủ công.
4. Cập nhật URL và key trong `js/db.js` nếu bạn dùng project Supabase khác.

Mặc định dự án đang dùng một cặp thông tin Supabase được khai báo sẵn trong `js/db.js`. Nếu triển khai cho môi trường riêng, nên thay bằng project của bạn.

## Nạp dữ liệu mẫu bằng script

Trong thư mục `scripts/seed-supabase/` có sẵn script để reset và seed dữ liệu:

```bash
cd scripts/seed-supabase
npm install
```

Tạo file `.env` trong cùng thư mục với nội dung:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

Chạy các lệnh sau:

```bash
npm run seed
npm run seed:fresh
npm run reset
```

## Tài khoản mặc định

Dữ liệu seed hiện có tạo sẵn một số tài khoản để thử nghiệm:

- Nhân viên: `NV000001` / `123456`
- Quản trị: `NV000014` / `123456`

## Ghi chú kỹ thuật

- Ứng dụng dùng Supabase JS SDK từ CDN.
- Một phần dữ liệu có cơ chế sync giữa Supabase và `localStorage`.
- Giao diện được chia theo từng trang HTML riêng, không dùng framework frontend.

## Luồng gợi ý khi bắt đầu

1. Mở `login.html`.
2. Đăng nhập bằng tài khoản mẫu.
3. Chuyển sang `index.html` để xem dashboard và điều hướng tới các module khác.

## Đóng góp

Nếu cần mở rộng dự án, nên cập nhật đồng bộ cả 3 lớp sau:

- HTML cho bố cục trang.
- CSS trong thư mục `css/`.
- Logic nghiệp vụ trong thư mục `js/`.
