-- ═══════════════════════════════════════════════════════════════════
-- HUMI HRM  –  Complete Database Reset & Seed
-- Paste toàn bộ file này vào Supabase SQL Editor → Run
-- Có thể chạy lại nhiều lần (idempotent)
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 1 – SCHEMA EXTENSIONS
-- Bổ sung cột còn thiếu so với db.js (idempotent – an toàn khi chạy lại)
-- ───────────────────────────────────────────────────────────────────

-- employees: face recognition + manager link
alter table employees add column if not exists face_image       text;
alter table employees add column if not exists face_descriptor  text;
alter table employees add column if not exists manager_id       text;

-- attendance: extended fields used by db.js
alter table attendance add column if not exists shift_id             text;
alter table attendance add column if not exists face_image_in        text;
alter table attendance add column if not exists face_image_out       text;
alter table attendance add column if not exists approver_id          text;
alter table attendance add column if not exists approved_at          timestamptz;
alter table attendance add column if not exists approved_check_in    text;
alter table attendance add column if not exists approved_check_out   text;
alter table attendance add column if not exists approver_note        text;

do $$ begin
  alter table attendance
    add constraint attendance_shift_fk
    foreign key (shift_id) references shifts(id) on delete set null;
exception when duplicate_object then null;
end $$;

-- leave_requests: approval/reject audit
alter table leave_requests add column if not exists approver_id   text;
alter table leave_requests add column if not exists approved_at   timestamptz;
alter table leave_requests add column if not exists rejected_at   timestamptz;
alter table leave_requests add column if not exists reject_reason text;
alter table leave_requests add column if not exists leave_type_name text;
alter table leave_requests add column if not exists total_days    numeric;

-- messages: fields used by db.js mapping
alter table messages add column if not exists from_id   text;
alter table messages add column if not exists from_name text;
alter table messages add column if not exists avatar    text;
alter table messages add column if not exists subject   text;
alter table messages add column if not exists preview   text;
alter table messages add column if not exists body      text;
alter table messages add column if not exists actions   jsonb;
alter table messages add column if not exists tag       text;
alter table messages add column if not exists tag_class text;
alter table messages add column if not exists is_read   boolean default false;
alter table messages add column if not exists timestamp timestamptz default now();
alter table messages add column if not exists tags      text[]  default '{}';
alter table messages add column if not exists important boolean default false;
alter table messages add column if not exists deleted   boolean default false;
alter table messages add column if not exists created_at timestamptz default now();

-- work_shifts table (lịch làm việc)
create table if not exists work_shifts (
  id          text primary key,
  employee_id text references employees(id) on delete cascade,
  work_date   date not null,
  start_time  text,
  end_time    text,
  shift_id    text references shifts(id) on delete set null,
  created_at  timestamptz default now()
);

-- requests: bổ sung các cột mở rộng
alter table requests add column if not exists type_label  text;
alter table requests add column if not exists approver_id text;
alter table requests add column if not exists content     text;

-- announcements: bổ sung các cột mở rộng
alter table announcements add column if not exists department text;
alter table announcements add column if not exists preview    text;
alter table announcements add column if not exists creator    text;
alter table announcements add column if not exists approver   text;

-- accounts: đảm bảo cột password tồn tại
alter table accounts add column if not exists password text;

-- shifts: đảm bảo apply_days là jsonb
alter table shifts add column if not exists apply_days jsonb;

-- pgcrypto cho gen_random_uuid()
create extension if not exists pgcrypto;


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 2 – TRUNCATE  (thứ tự child → parent để tránh FK violation)
-- ───────────────────────────────────────────────────────────────────

truncate table work_shifts       cascade;
truncate table shift_assignments cascade;
truncate table messages          cascade;
truncate table salary            cascade;
truncate table requests          cascade;
truncate table leave_requests    cascade;
truncate table attendance        cascade;
truncate table accounts          cascade;
truncate table announcements     cascade;
truncate table shifts            cascade;
truncate table employees         cascade;

-- Thêm unique constraint sau khi truncate (bảng rỗng → không bị lỗi duplicate)
do $$ begin
  alter table attendance drop constraint if exists attendance_emp_date_uq;
  alter table attendance add constraint attendance_emp_date_uq unique (employee_id, date);
end $$;


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 3 – EMPLOYEES  (14 nhân viên)
-- ───────────────────────────────────────────────────────────────────

insert into employees
  (id,code,name,avatar,unit,position,role_id,status,gender,
   phone,email,dob,start_date,
   contract_status,contract_type,work_mode,manager_name,manager_id,
   leave_balance,id_card)
values
-- ── CH613 Âu Cơ  (manager: Tiểu Nhi – NV000011) ─────────────────
('NV000001','NV000001','Nguyễn Văn An',
 'https://i.pravatar.cc/80?img=11','CH613 Âu Cơ','Nhân viên bán hàng',
 'employee','active','Nam','0901234567','an.nv@humi.vn',
 '1998-03-15','2023-01-10',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','Tiểu Nhi','NV000011',
 '{"annual":10,"sick":28,"maternity":180,"unpaid":99}','012345678901'),

('NV000002','NV000002','Trần Thị Bích',
 'https://i.pravatar.cc/80?img=32','CH613 Âu Cơ','Nhân viên bán hàng',
 'employee','active','Nữ','0912345678','bich.tt@humi.vn',
 '1999-07-22','2023-03-01',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','Tiểu Nhi','NV000011',
 '{"annual":10,"sick":30,"maternity":180,"unpaid":99}','012345678902'),

('NV000007','NV000007','Bùi Văn Cường',
 'https://i.pravatar.cc/80?img=17','CH613 Âu Cơ','Nhân viên kho',
 'employee','active','Nam','0967890123','cuong.bv@humi.vn',
 '1995-09-30','2020-05-15',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','Tiểu Nhi','NV000011',
 '{"annual":12,"sick":30,"maternity":180,"unpaid":99}','012345678907'),

('NV000010','NV000010','Lý Thị Mỹ',
 'https://i.pravatar.cc/80?img=20','CH613 Âu Cơ','Thu ngân',
 'employee','active','Nữ','0990123456','my.lt@humi.vn',
 '2000-10-08','2024-01-15',
 'Đã có hợp đồng','Hợp đồng thử việc','Toàn thời gian','Tiểu Nhi','NV000011',
 '{"annual":5,"sick":30,"maternity":180,"unpaid":99}','012345678910'),

-- ── CH614 Lê Văn Sỹ  (manager: Minh Quang – NV000012) ──────────
('NV000003','NV000003','Lê Minh Quân',
 'https://i.pravatar.cc/80?img=13','CH614 Lê Văn Sỹ','Nhân viên bán hàng',
 'employee','active','Nam','0923456789','quan.lm@humi.vn',
 '1997-11-05','2022-06-15',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','Minh Quang','NV000012',
 '{"annual":12,"sick":30,"maternity":180,"unpaid":99}','012345678903'),

('NV000004','NV000004','Phạm Thị Thu',
 'https://i.pravatar.cc/80?img=45','CH614 Lê Văn Sỹ','Nhân viên bán hàng',
 'employee','active','Nữ','0934567890','thu.pt@humi.vn',
 '2000-02-28','2023-08-01',
 'Đã có hợp đồng','Hợp đồng thử việc','Toàn thời gian','Minh Quang','NV000012',
 '{"annual":8,"sick":30,"maternity":180,"unpaid":99}','012345678904'),

('NV000008','NV000008','Nguyễn Thị Hoa',
 'https://i.pravatar.cc/80?img=18','CH614 Lê Văn Sỹ','Thu ngân',
 'employee','active','Nữ','0978901234','hoa.nt@humi.vn',
 '1999-12-25','2023-04-10',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','Minh Quang','NV000012',
 '{"annual":11,"sick":30,"maternity":180,"unpaid":99}','012345678908'),

-- ── CH615 Nguyễn Trãi  (manager: Thanh Hương – NV000013) ────────
('NV000005','NV000005','Hoàng Anh Tuấn',
 'https://i.pravatar.cc/80?img=15','CH615 Nguyễn Trãi','Nhân viên bán hàng',
 'employee','active','Nam','0945678901','tuan.ha@humi.vn',
 '1996-08-19','2021-11-20',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','Thanh Hương','NV000013',
 '{"annual":12,"sick":27,"maternity":180,"unpaid":99}','012345678905'),

('NV000006','NV000006','Đặng Thị Lan',
 'https://i.pravatar.cc/80?img=16','CH615 Nguyễn Trãi','Nhân viên bán hàng',
 'employee','active','Nữ','0956789012','lan.dt@humi.vn',
 '2001-04-12','2024-02-01',
 'Đã có hợp đồng','Hợp đồng thử việc','Bán thời gian','Thanh Hương','NV000013',
 '{"annual":6,"sick":30,"maternity":180,"unpaid":99}','012345678906'),

('NV000009','NV000009','Trương Văn Đức',
 'https://i.pravatar.cc/80?img=19','CH615 Nguyễn Trãi','Nhân viên kho',
 'employee','active','Nam','0989012345','duc.tv@humi.vn',
 '1997-06-14','2022-09-01',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','Thanh Hương','NV000013',
 '{"annual":12,"sick":30,"maternity":180,"unpaid":99}','012345678909'),

-- ── Managers & Admin (manager_id = null) ─────────────────────────
('NV000011','NV000011','Tiểu Nhi',
 'https://i.pravatar.cc/80?img=47','CH613 Âu Cơ','Quản lý chi nhánh',
 'manager','active','Nữ','0901111111','nhi.t@humi.vn',
 '1992-05-20','2019-03-01',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','—',null,
 '{"annual":15,"sick":30,"maternity":180,"unpaid":99}','012345678911'),

('NV000012','NV000012','Minh Quang',
 'https://i.pravatar.cc/80?img=12','CH614 Lê Văn Sỹ','Quản lý chi nhánh',
 'manager','active','Nam','0902222222','quang.m@humi.vn',
 '1990-01-10','2018-07-15',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','—',null,
 '{"annual":15,"sick":30,"maternity":180,"unpaid":99}','012345678912'),

('NV000013','NV000013','Thanh Hương',
 'https://i.pravatar.cc/80?img=23','CH615 Nguyễn Trãi','Quản lý chi nhánh',
 'manager','active','Nữ','0903333333','huong.t@humi.vn',
 '1991-08-30','2019-01-20',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','—',null,
 '{"annual":15,"sick":30,"maternity":180,"unpaid":99}','012345678913'),

('NV000014','NV000014','Admin',
 'https://i.pravatar.cc/80?img=7','Công ty TNHH Humi','Quản trị hệ thống',
 'admin','active','Nam','0904444444','admin@humi.vn',
 '1985-12-01','2015-01-01',
 'Đã có hợp đồng','Hợp đồng dài hạn','Toàn thời gian','—',null,
 '{"annual":20,"sick":30,"maternity":180,"unpaid":99}','012345678914');


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 4 – ACCOUNTS  (password mặc định = 123456)
-- ───────────────────────────────────────────────────────────────────

insert into accounts (employee_id, password) values
('NV000001','123456'),('NV000002','123456'),('NV000003','123456'),
('NV000004','123456'),('NV000005','123456'),('NV000006','123456'),
('NV000007','123456'),('NV000008','123456'),('NV000009','123456'),
('NV000010','123456'),('NV000011','123456'),('NV000012','123456'),
('NV000013','123456'),('NV000014','123456');


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 5 – SHIFTS  (5 loại ca)
-- ───────────────────────────────────────────────────────────────────

insert into shifts (id,name,code,start_time,end_time,break_minutes,work_hours,quota,active,color,apply_days) values
('SH001','Ca sáng',       'CS', '08:00','17:00',60,8,5,true,'#5D87FF','[1,2,3,4,5,6]'),
('SH002','Ca chiều',      'CC', '13:00','22:00',60,8,4,true,'#22c55e','[1,2,3,4,5,6]'),
('SH003','Ca tối',        'CT', '18:00','23:00',30,5,3,true,'#a855f7','[5,6,0]'),
('SH004','Ca ngắn sáng',  'CNS','08:00','13:00',0, 5,3,true,'#f59e0b','[1,2,3,4,5,6]'),
('SH005','Ca ngắn chiều', 'CNC','15:00','22:00',30,7,3,true,'#ea580c','[1,2,3,4,5,6]');


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 6 – ANNOUNCEMENTS
-- ───────────────────────────────────────────────────────────────────

insert into announcements (id,department,title,preview,creator,approver,status,start_date,end_date) values
('ann_001',
 'Phòng hành chính nhân sự',
 'THÔNG BÁO NGHỈ TẾT ÂM LỊCH NĂM 2026',
 'Phòng Hành chính Nhân sự trân trọng thông báo lịch nghỉ Tết Âm Lịch 2026 tới toàn thể CBNV như sau:',
 'Nguyễn Hoàng Kim Phụng','Cao Thị Hà Như','active','2026-02-05','2026-02-25'),

('ann_002',
 'Phòng hành chính nhân sự',
 'THÔNG BÁO TỔ CHỨC TIỆC TẤT NIÊN (YEAR END PARTY) 2025',
 'Ban Tổ chức trân trọng kính mời toàn thể CBNV tham dự buổi tiệc tất niên năm 2025 do Công ty tổ chức.',
 'Nguyễn Hoàng Kim Phụng','Võ Lê Hoàng Văn','expired','2026-01-01','2026-01-31'),

('ann_003',
 'Ban Giám đốc',
 'THÔNG BÁO ĐIỀU CHỈNH GIỜ LÀM VIỆC THÁNG 04/2026',
 'Kính thông báo về điều chỉnh giờ làm việc trong tháng 04/2026 áp dụng cho tất cả chi nhánh.',
 'Tiểu Nhi','Cao Thị Hà Như','active','2026-04-01','2026-04-30');


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 7 – LEAVE REQUESTS
-- ───────────────────────────────────────────────────────────────────

insert into leave_requests
  (id,employee_id,leave_type,leave_type_name,start_date,end_date,
   total_days,status,reason,approver_id,created_at)
values
('LV001','NV000001','annual',   'Nghỉ phép năm',    '2026-03-10','2026-03-11',2,  'approved','Việc gia đình', 'NV000011','2026-03-05T08:00:00Z'),
('LV002','NV000002','sick',     'Nghỉ ốm',          '2026-03-15','2026-03-15',1,  'approved','Ốm',            'NV000011','2026-03-14T08:00:00Z'),
('LV003','NV000003','annual',   'Nghỉ phép năm',    '2026-04-07','2026-04-07',1,  'pending', 'Việc cá nhân', null,      '2026-03-31T08:00:00Z'),
('LV004','NV000004','sick',     'Nghỉ ốm',          '2026-03-20','2026-03-21',2,  'rejected','Ốm đột ngột',  'NV000012','2026-03-19T08:00:00Z'),
('LV005','NV000005','annual',   'Nghỉ phép năm',    '2026-04-10','2026-04-12',3,  'pending', 'Du lịch',      null,      '2026-04-01T08:00:00Z'),
('LV006','NV000007','unpaid',   'Nghỉ không lương', '2026-03-25','2026-03-26',2,  'approved','Việc cá nhân', 'NV000011','2026-03-20T08:00:00Z'),
('LV007','NV000011','annual',   'Nghỉ phép năm',    '2026-04-15','2026-04-17',3,  'pending', 'Nghỉ dưỡng',   null,      '2026-04-02T08:00:00Z'),
('LV008','NV000008','maternity','Nghỉ thai sản',    '2026-02-01','2026-07-31',180,'approved','Sinh con',     'NV000012','2026-01-25T08:00:00Z');


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 8 – REQUESTS (yêu cầu tăng ca / đổi ca / điều chỉnh công)
-- ───────────────────────────────────────────────────────────────────

insert into requests (id,employee_id,request_type,type_label,content,status,approver_id,created_at) values
('REQ001','NV000002','shift_change','Đổi ca',        'Xin đổi ca ngày 15/04 từ ca sáng sang ca chiều', 'pending', null,       '2026-03-30T08:00:00Z'),
('REQ002','NV000005','overtime',   'Tăng ca',        'Xin tăng ca ngày 20/03 thêm 2 tiếng',            'approved','NV000013','2026-03-18T08:00:00Z'),
('REQ003','NV000001','attendance', 'Điều chỉnh công','Xin điều chỉnh giờ vào ngày 05/03 lên 08:00',    'pending', null,       '2026-03-06T08:00:00Z'),
('REQ004','NV000003','shift_change','Đổi ca',        'Xin đổi ca ngày 22/03',                          'rejected','NV000012','2026-03-15T08:00:00Z');


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 9 – SALARY  (26 bản ghi: 13 NV không phải admin × 2 kỳ)
-- ───────────────────────────────────────────────────────────────────
-- Lương nhân viên: base 6.500.000 + meal 730.000 + transport 500.000
--   gross = 7.730.000 | net = 7.730.000 (không thuế)
-- Lương manager:   base 12.000.000 + phụ cấp = 13.230.000
--   gross = 13.230.000 | net = 12.730.000 (thuế TNCN 500.000)

insert into salary
  (id,employee_id,period,base_salary,gross_salary,net_salary,
   work_days,actual_work_days,allowances,deductions,bonus,overtime_pay)
values
-- ── Nhân viên (không thuế) ──────────────────────────────────────
('SAL_NV000001_2026-02','NV000001','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000001_2026-03','NV000001','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000002_2026-02','NV000002','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000002_2026-03','NV000002','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000003_2026-02','NV000003','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000003_2026-03','NV000003','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000004_2026-02','NV000004','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000004_2026-03','NV000004','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000005_2026-02','NV000005','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000005_2026-03','NV000005','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000006_2026-02','NV000006','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000006_2026-03','NV000006','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000007_2026-02','NV000007','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000007_2026-03','NV000007','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000008_2026-02','NV000008','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000008_2026-03','NV000008','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000009_2026-02','NV000009','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000009_2026-03','NV000009','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000010_2026-02','NV000010','2026-02',6500000,7730000,7730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
('SAL_NV000010_2026-03','NV000010','2026-03',6500000,7730000,7730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":0}',0,0),
-- ── Manager (thuế TNCN 500.000) ──────────────────────────────────
('SAL_NV000011_2026-02','NV000011','2026-02',12000000,13230000,12730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000011_2026-03','NV000011','2026-03',12000000,13230000,12730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000012_2026-02','NV000012','2026-02',12000000,13230000,12730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000012_2026-03','NV000012','2026-03',12000000,13230000,12730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000013_2026-02','NV000013','2026-02',12000000,13230000,12730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000013_2026-03','NV000013','2026-03',12000000,13230000,12730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0);


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 10 – MESSAGES
-- ───────────────────────────────────────────────────────────────────
-- Dùng cột from_name (hiển thị) + from_id (hệ thống)
-- Tất cả manager + admin đều nhận tin nhắn hệ thống

insert into messages
  (id,to_id,from_id,from_name,avatar,subject,preview,body,
   actions,tag,tag_class,is_read,important,deleted,timestamp)
values

-- ── Thông báo lương tháng 03/2026 → từng nhân viên ──────────────
('msg_sal_NV000001','NV000001','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Nguyễn Văn An</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý và sẵn sàng để xem.</p><div style="background:#F2F6FA;border-radius:8px;padding:16px 20px;margin:12px 0;"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;"><span style="color:#7C8FAC;">Lương gross</span><span style="font-weight:600;">7.730.000đ</span></div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:#7C8FAC;">Khấu trừ thuế</span><span style="color:#ef4444;font-weight:600;">-0đ</span></div><div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;border-top:1px solid #e5eaef;padding-top:8px;"><span>Thực nhận</span><span style="color:#16a34a;">7.730.000đ</span></div></div><p style="font-size:13px;">Tiền lương sẽ được chuyển khoản trước ngày <strong>05/04/2026</strong>.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000002','NV000002','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Trần Thị Bích</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000003','NV000003','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Lê Minh Quân</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000004','NV000004','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Phạm Thị Thu</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000005','NV000005','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Hoàng Anh Tuấn</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000006','NV000006','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Đặng Thị Lan</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000007','NV000007','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Bùi Văn Cường</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000008','NV000008','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Nguyễn Thị Hoa</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000009','NV000009','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Trương Văn Đức</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000010','NV000010','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 7.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Lý Thị Mỹ</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000011','NV000011','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 12.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Tiểu Nhi</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p><div style="background:#F2F6FA;border-radius:8px;padding:16px 20px;margin:12px 0;"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;"><span style="color:#7C8FAC;">Lương gross</span><span style="font-weight:600;">13.230.000đ</span></div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:#7C8FAC;">Khấu trừ thuế</span><span style="color:#ef4444;font-weight:600;">-500.000đ</span></div><div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;border-top:1px solid #e5eaef;padding-top:8px;"><span>Thực nhận</span><span style="color:#16a34a;">12.730.000đ</span></div></div>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000012','NV000012','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 12.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Minh Quang</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

('msg_sal_NV000013','NV000013','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Bảng lương tháng 03/2026 đã sẵn sàng',
 'Lương thực nhận: 12.730.000đ. Chuyển khoản trước ngày 05/04/2026',
 '<p>Kính gửi <strong>Thanh Hương</strong>,</p><p>Bảng lương tháng <strong>03/2026</strong> đã được xử lý.</p>',
 '[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]',
 'Lương','tag-green',false,false,false,'2026-04-13T08:00:00Z'),

-- ── Thông báo chấm công chờ duyệt → manager ──────────────────────
('msg_att_NV000011','NV000011','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Có ca chấm công chờ duyệt từ nhân viên',
 'Hệ thống ghi nhận nhiều ca chấm công đang chờ phê duyệt từ nhân viên CH613 Âu Cơ.',
 '<p>Kính gửi <strong>Tiểu Nhi</strong>,</p><p>Hệ thống ghi nhận có các ca chấm công đang chờ phê duyệt từ nhân viên do bạn quản lý.</p><p>Vui lòng truy cập <a href="duyet-cong.html" style="color:#5D87FF;font-weight:600;">Duyệt công</a> để xử lý.</p>',
 '[{"label":"Đi đến Duyệt công","href":"duyet-cong.html","primary":true}]',
 'Duyệt công','tag-orange',false,false,false,'2026-04-18T10:00:00Z'),

('msg_att_NV000012','NV000012','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Có ca chấm công chờ duyệt từ nhân viên',
 'Hệ thống ghi nhận nhiều ca chấm công đang chờ phê duyệt từ nhân viên CH614 Lê Văn Sỹ.',
 '<p>Kính gửi <strong>Minh Quang</strong>,</p><p>Hệ thống ghi nhận có các ca chấm công đang chờ phê duyệt.</p><p>Vui lòng truy cập <a href="duyet-cong.html" style="color:#5D87FF;font-weight:600;">Duyệt công</a> để xử lý.</p>',
 '[{"label":"Đi đến Duyệt công","href":"duyet-cong.html","primary":true}]',
 'Duyệt công','tag-orange',false,false,false,'2026-04-18T10:00:00Z'),

('msg_att_NV000013','NV000013','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Có ca chấm công chờ duyệt từ nhân viên',
 'Hệ thống ghi nhận nhiều ca chấm công đang chờ phê duyệt từ nhân viên CH615 Nguyễn Trãi.',
 '<p>Kính gửi <strong>Thanh Hương</strong>,</p><p>Hệ thống ghi nhận có các ca chấm công đang chờ phê duyệt.</p><p>Vui lòng truy cập <a href="duyet-cong.html" style="color:#5D87FF;font-weight:600;">Duyệt công</a> để xử lý.</p>',
 '[{"label":"Đi đến Duyệt công","href":"duyet-cong.html","primary":true}]',
 'Duyệt công','tag-orange',false,false,false,'2026-04-18T10:00:00Z'),

('msg_att_NV000014','NV000014','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Có ca chấm công chờ duyệt từ nhân viên',
 'Hệ thống ghi nhận nhiều ca chấm công đang chờ phê duyệt từ toàn bộ nhân viên.',
 '<p>Kính gửi <strong>Admin</strong>,</p><p>Có nhiều ca chấm công đang chờ phê duyệt từ nhân viên toàn hệ thống.</p>',
 '[{"label":"Đi đến Duyệt công","href":"duyet-cong.html","primary":true}]',
 'Duyệt công','tag-orange',false,false,false,'2026-04-18T10:00:00Z'),

-- ── Thông báo đơn nghỉ phép chờ duyệt → manager ─────────────────
('msg_leave_NV000011','NV000011','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Có đơn nghỉ phép chờ duyệt',
 'Có 3 đơn xin nghỉ phép đang chờ phê duyệt từ nhân viên.',
 '<p>Kính gửi <strong>Tiểu Nhi</strong>,</p><p>Có <strong>3 đơn nghỉ phép</strong> đang chờ phê duyệt.</p><p>Vui lòng truy cập <a href="danh-sach-phieu-nghi.html" style="color:#5D87FF;font-weight:600;">Duyệt phép</a> để xử lý.</p>',
 '[{"label":"Đi đến Duyệt phép","href":"danh-sach-phieu-nghi.html","primary":true}]',
 'Nghỉ phép','tag-blue',false,false,false,'2026-04-17T09:00:00Z'),

('msg_leave_NV000012','NV000012','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Có đơn nghỉ phép chờ duyệt',
 'Có đơn xin nghỉ phép đang chờ phê duyệt từ nhân viên.',
 '<p>Kính gửi <strong>Minh Quang</strong>,</p><p>Có đơn nghỉ phép đang chờ phê duyệt.</p>',
 '[{"label":"Đi đến Duyệt phép","href":"danh-sach-phieu-nghi.html","primary":true}]',
 'Nghỉ phép','tag-blue',false,false,false,'2026-04-17T09:00:00Z'),

('msg_leave_NV000013','NV000013','SYSTEM','Hệ thống Humi',
 'https://i.pravatar.cc/36?img=12',
 'Có đơn nghỉ phép chờ duyệt',
 'Có đơn xin nghỉ phép đang chờ phê duyệt từ nhân viên.',
 '<p>Kính gửi <strong>Thanh Hương</strong>,</p><p>Có đơn nghỉ phép đang chờ phê duyệt.</p>',
 '[{"label":"Đi đến Duyệt phép","href":"danh-sach-phieu-nghi.html","primary":true}]',
 'Nghỉ phép','tag-blue',false,false,false,'2026-04-17T09:00:00Z'),

-- ── Tin nhắn từ nhân viên gửi quản lý ────────────────────────────
('msg_emp_001','NV000011','NV000001','Nguyễn Văn An',
 'https://i.pravatar.cc/36?img=31',
 'Đơn xin nghỉ phép ngày 07/04/2026',
 'Kính gửi quản lý, em xin phép được nghỉ phép năm vào ngày 07/04/2026.',
 '<p>Kính gửi <strong>Quản lý</strong>,</p><p>Em xin phép được nghỉ phép năm vào ngày <strong>07/04/2026</strong> để giải quyết việc cá nhân.</p><p>Kính mong quản lý xem xét và phê duyệt.</p><p>Trân trọng,<br/>Nguyễn Văn An</p>',
 '[{"label":"Phê duyệt","href":"danh-sach-phieu-nghi.html","primary":true}]',
 'Nghỉ phép','tag-blue',false,false,false,'2026-03-31T09:15:00Z'),

('msg_emp_002','NV000011','NV000002','Trần Thị Bích',
 'https://i.pravatar.cc/36?img=5',
 'Yêu cầu điều chỉnh ca làm việc tháng 4',
 'Em muốn đổi ca ngày 15/04 từ ca sáng sang ca chiều do có việc gia đình.',
 '<p>Kính gửi <strong>Quản lý</strong>,</p><p>Em muốn xin đổi ca ngày <strong>15/04/2026</strong> từ ca sáng sang ca chiều.</p><p>Lý do: Em có việc gia đình buổi sáng hôm đó.</p><p>Kính mong quản lý xem xét.</p>',
 '[{"label":"Phê duyệt","href":"duyet-yeu-cau.html","primary":true}]',
 'Đổi ca','tag-purple',false,false,false,'2026-03-30T15:40:00Z'),

('msg_emp_003','NV000012','NV000003','Lê Minh Quân',
 'https://i.pravatar.cc/36?img=20',
 'Báo cáo chấm công tháng 03/2026',
 'Gửi quản lý, kính gửi báo cáo chấm công tháng 3 của em.',
 '<p>Kính gửi <strong>Quản lý</strong>,</p><p>Em kính gửi báo cáo chấm công tháng 03/2026. Tổng số ngày công: 22/26 ngày.</p>',
 '[{"label":"Trả lời","href":"","primary":false}]',
 'Báo cáo','tag-green',true,false,false,'2026-03-28T17:00:00Z');


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 11 – SHIFT ASSIGNMENTS (tự động: ±30 ngày từ hôm nay)
-- Phân ca theo công thức hash để mỗi NV được ca khác nhau mỗi ngày
-- ───────────────────────────────────────────────────────────────────

with
emp as (
  select
    id as employee_id,
    coalesce(nullif(regexp_replace(id, '[^0-9]', '', 'g'), ''), '0')::int as emp_no
  from employees
  where status = 'active'
    and role_id in ('employee', 'manager')
),
day_range as (
  select gs::date as work_date
  from generate_series(
    current_date - interval '30 day',
    current_date + interval '30 day',
    interval '1 day'
  ) gs
  where extract(dow from gs) <> 0   -- bỏ Chủ nhật
),
assignments as (
  select
    'sa_' || e.employee_id || '_' || to_char(d.work_date, 'YYYYMMDD') as id,
    e.employee_id,
    (array['SH001','SH002','SH003','SH004','SH005'])
      [((e.emp_no + extract(day from d.work_date)::int) % 5) + 1]    as shift_id,
    d.work_date as date
  from emp e
  cross join day_range d
)
insert into shift_assignments (id, employee_id, shift_id, date)
select id, employee_id, shift_id, date
from assignments
on conflict (id) do update
  set employee_id = excluded.employee_id,
      shift_id    = excluded.shift_id,
      date        = excluded.date;


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 12 – ATTENDANCE  (tự động: 60 ngày lịch sử)
-- ~8% vắng mặt | giờ vào dao động 0–20 phút | approved/pending theo thời điểm
-- ───────────────────────────────────────────────────────────────────

with
emp as (
  select
    id as employee_id,
    coalesce(nullif(regexp_replace(id, '[^0-9]', '', 'g'), ''), '0')::int as emp_no
  from employees
  where status = 'active'
    and role_id in ('employee', 'manager')
),
day_range as (
  select gs::date as work_date
  from generate_series(
    current_date - interval '60 day',
    current_date - interval '1 day',
    interval '1 day'
  ) gs
  where extract(dow from gs) <> 0   -- bỏ Chủ nhật
),
raw as (
  select
    e.employee_id,
    d.work_date,
    (array['SH001','SH002','SH003','SH004','SH005'])
      [((e.emp_no + extract(day from d.work_date)::int) % 5) + 1]  as shift_id,
    (e.emp_no + extract(day from d.work_date)::int + extract(month from d.work_date)::int * 3) % 13 as seed
  from emp e
  cross join day_range d
),
present as (
  select * from raw where seed <> 0   -- ~8% vắng mặt
)
insert into attendance
  (id, employee_id, shift_id, date,
   check_in, check_out, status, approval_status, note)
select
  'att_' || p.employee_id || '_' || to_char(p.work_date, 'YYYYMMDD') as id,
  p.employee_id,
  p.shift_id,
  p.work_date,
  to_char(time '08:00' + ((p.seed % 4) * interval '5 minute'),  'HH24:MI') as check_in,
  to_char(time '17:00' + ((p.seed % 3) * interval '10 minute'), 'HH24:MI') as check_out,
  'present',
  case
    when p.work_date <= current_date - interval '3 day'
      then case when p.seed % 11 = 0 then 'rejected' else 'approved' end
    else 'pending'
  end,
  ''
from present p
on conflict (employee_id, date) do update
  set id              = excluded.id,
      shift_id        = excluded.shift_id,
      check_in        = excluded.check_in,
      check_out       = excluded.check_out,
      status          = excluded.status,
      approval_status = excluded.approval_status;


-- ───────────────────────────────────────────────────────────────────
-- BLOCK 13 – WORK SHIFTS  (mirror từ shift_assignments)
-- ───────────────────────────────────────────────────────────────────

insert into work_shifts (id, employee_id, work_date, start_time, end_time, shift_id, created_at)
select
  sa.id,
  sa.employee_id,
  sa.date       as work_date,
  s.start_time,
  s.end_time,
  sa.shift_id,
  now()
from shift_assignments sa
join shifts s on s.id = sa.shift_id
on conflict (id) do update
  set employee_id = excluded.employee_id,
      work_date   = excluded.work_date,
      start_time  = excluded.start_time,
      end_time    = excluded.end_time,
      shift_id    = excluded.shift_id;


-- ═══════════════════════════════════════════════════════════════════
-- XONG!  Kiểm tra nhanh số dòng mỗi bảng
-- ═══════════════════════════════════════════════════════════════════

select 'employees'      as tbl, count(*) as rows from employees
union all
select 'accounts',        count(*) from accounts
union all
select 'shifts',          count(*) from shifts
union all
select 'announcements',   count(*) from announcements
union all
select 'leave_requests',  count(*) from leave_requests
union all
select 'requests',        count(*) from requests
union all
select 'salary',          count(*) from salary
union all
select 'messages',        count(*) from messages
union all
select 'shift_assignments', count(*) from shift_assignments
union all
select 'attendance',      count(*) from attendance
union all
select 'work_shifts',     count(*) from work_shifts
order by tbl;
