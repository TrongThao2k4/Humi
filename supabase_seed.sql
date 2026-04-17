-- =========================================
-- HUMI HRM – Supabase Seed Data
-- Run AFTER supabase_schema.sql
-- =========================================

-- ---- EMPLOYEES ----
insert into employees (id,code,name,avatar,unit,position,role_id,status,gender,phone,email,dob,start_date,contract_status,contract_type,work_mode,manager_name,leave_balance,id_card) values
('NV000001','NV000001','Nguyễn Văn An',  'https://i.pravatar.cc/80?img=11','CH613 Âu Cơ',       'Nhân viên bán hàng','employee','active','Nam','0901234567','an.nv@humi.vn',     '1998-03-15','2023-01-10','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','Tiểu Nhi',  '{"annual":10,"sick":28,"maternity":180,"unpaid":99}','012345678901'),
('NV000002','NV000002','Trần Thị Bích',  'https://i.pravatar.cc/80?img=32','CH613 Âu Cơ',       'Nhân viên bán hàng','employee','active','Nữ', '0912345678','bich.tt@humi.vn',   '1999-07-22','2023-03-01','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','Tiểu Nhi',  '{"annual":10,"sick":30,"maternity":180,"unpaid":99}','012345678902'),
('NV000003','NV000003','Lê Minh Quân',   'https://i.pravatar.cc/80?img=13','CH614 Lê Văn Sỹ',   'Nhân viên bán hàng','employee','active','Nam','0923456789','quan.lm@humi.vn',   '1997-11-05','2022-06-15','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','Minh Quang','{"annual":12,"sick":30,"maternity":180,"unpaid":99}','012345678903'),
('NV000004','NV000004','Phạm Thị Thu',   'https://i.pravatar.cc/80?img=45','CH614 Lê Văn Sỹ',   'Nhân viên bán hàng','employee','active','Nữ', '0934567890','thu.pt@humi.vn',    '2000-02-28','2023-08-01','Đã có hợp đồng','Hợp đồng thử việc','Toàn thời gian','Minh Quang','{"annual":8,"sick":30,"maternity":180,"unpaid":99}', '012345678904'),
('NV000005','NV000005','Hoàng Anh Tuấn', 'https://i.pravatar.cc/80?img=15','CH615 Nguyễn Trãi', 'Nhân viên bán hàng','employee','active','Nam','0945678901','tuan.ha@humi.vn',   '1996-08-19','2021-11-20','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','Thanh Hương','{"annual":12,"sick":27,"maternity":180,"unpaid":99}','012345678905'),
('NV000006','NV000006','Đặng Thị Lan',   'https://i.pravatar.cc/80?img=16','CH615 Nguyễn Trãi', 'Nhân viên bán hàng','employee','active','Nữ', '0956789012','lan.dt@humi.vn',    '2001-04-12','2024-02-01','Đã có hợp đồng','Hợp đồng thử việc','Bán thời gian', 'Thanh Hương','{"annual":6,"sick":30,"maternity":180,"unpaid":99}', '012345678906'),
('NV000007','NV000007','Bùi Văn Cường',  'https://i.pravatar.cc/80?img=17','CH613 Âu Cơ',       'Nhân viên kho',     'employee','active','Nam','0967890123','cuong.bv@humi.vn',  '1995-09-30','2020-05-15','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','Tiểu Nhi',  '{"annual":12,"sick":30,"maternity":180,"unpaid":99}','012345678907'),
('NV000008','NV000008','Nguyễn Thị Hoa', 'https://i.pravatar.cc/80?img=18','CH614 Lê Văn Sỹ',   'Thu ngân',          'employee','active','Nữ', '0978901234','hoa.nt@humi.vn',    '1999-12-25','2023-04-10','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','Minh Quang','{"annual":11,"sick":30,"maternity":180,"unpaid":99}','012345678908'),
('NV000009','NV000009','Trương Văn Đức', 'https://i.pravatar.cc/80?img=19','CH615 Nguyễn Trãi', 'Nhân viên kho',     'employee','active','Nam','0989012345','duc.tv@humi.vn',    '1997-06-14','2022-09-01','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','Thanh Hương','{"annual":12,"sick":30,"maternity":180,"unpaid":99}','012345678909'),
('NV000010','NV000010','Lý Thị Mỹ',      'https://i.pravatar.cc/80?img=20','CH613 Âu Cơ',       'Thu ngân',          'employee','active','Nữ', '0990123456','my.lt@humi.vn',     '2000-10-08','2024-01-15','Đã có hợp đồng','Hợp đồng thử việc','Toàn thời gian','Tiểu Nhi',  '{"annual":5,"sick":30,"maternity":180,"unpaid":99}', '012345678910'),
('NV000011','NV000011','Tiểu Nhi',        'https://i.pravatar.cc/80?img=47','CH613 Âu Cơ',       'Quản lý chi nhánh', 'manager', 'active','Nữ', '0901111111','nhi.t@humi.vn',     '1992-05-20','2019-03-01','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','—',         '{"annual":15,"sick":30,"maternity":180,"unpaid":99}','012345678911'),
('NV000012','NV000012','Minh Quang',       'https://i.pravatar.cc/80?img=12','CH614 Lê Văn Sỹ',   'Quản lý chi nhánh', 'manager', 'active','Nam','0902222222','quang.m@humi.vn',   '1990-01-10','2018-07-15','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','—',         '{"annual":15,"sick":30,"maternity":180,"unpaid":99}','012345678912'),
('NV000013','NV000013','Thanh Hương',      'https://i.pravatar.cc/80?img=23','CH615 Nguyễn Trãi', 'Quản lý chi nhánh', 'manager', 'active','Nữ', '0903333333','huong.t@humi.vn',   '1991-08-30','2019-01-20','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','—',         '{"annual":15,"sick":30,"maternity":180,"unpaid":99}','012345678913'),
('NV000014','NV000014','Admin',             'https://i.pravatar.cc/80?img=7', 'Công ty TNHH Humi', 'Quản trị hệ thống', 'admin',   'active','Nam','0904444444','admin@humi.vn',     '1985-12-01','2015-01-01','Đã có hợp đồng','Hợp đồng dài hạn',  'Toàn thời gian','—',         '{"annual":20,"sick":30,"maternity":180,"unpaid":99}','012345678914')
on conflict (id) do nothing;

-- ---- ACCOUNTS ----
insert into accounts (employee_id, password) values
('NV000001','123456'),('NV000002','123456'),('NV000003','123456'),('NV000004','123456'),
('NV000005','123456'),('NV000006','123456'),('NV000007','123456'),('NV000008','123456'),
('NV000009','123456'),('NV000010','123456'),('NV000011','123456'),('NV000012','123456'),
('NV000013','123456'),('NV000014','123456')
on conflict (employee_id) do nothing;

-- ---- SHIFTS ----
insert into shifts (id,name,code,start_time,end_time,break_minutes,work_hours,quota,active,color,apply_days) values
('SH001','Ca sáng',      'CS', '08:00','17:00',60,8,5,true,'var(--primary)','{1,2,3,4,5,6}'),
('SH002','Ca chiều',     'CC', '13:00','22:00',60,8,4,true,'#22c55e',       '{1,2,3,4,5,6}'),
('SH003','Ca tối',       'CT', '18:00','23:00',30,5,3,true,'#a855f7',       '{5,6,0}'),
('SH004','Ca ngắn sáng', 'CNS','08:00','13:00',0, 5,3,true,'#f59e0b',       '{1,2,3,4,5,6}'),
('SH005','Ca ngắn chiều','CNC','15:00','22:00',30,7,3,true,'#ea580c',       '{1,2,3,4,5,6}')
on conflict (id) do nothing;

-- ---- LEAVE REQUESTS ----
insert into leave_requests (id,employee_id,leave_type,leave_type_name,start_date,end_date,total_days,status,reason,approver_id,created_at) values
('LV001','NV000001','annual',   'Nghỉ phép năm',   '2026-03-10','2026-03-11',2,'approved','Việc gia đình',  'NV000011','2026-03-05'),
('LV002','NV000002','sick',     'Nghỉ ốm',         '2026-03-15','2026-03-15',1,'approved','Ốm',            'NV000011','2026-03-14'),
('LV003','NV000003','annual',   'Nghỉ phép năm',   '2026-04-07','2026-04-07',1,'pending', 'Việc cá nhân',  null,       '2026-03-31'),
('LV004','NV000004','sick',     'Nghỉ ốm',         '2026-03-20','2026-03-21',2,'rejected','Ốm đột ngột',   'NV000012','2026-03-19'),
('LV005','NV000005','annual',   'Nghỉ phép năm',   '2026-04-10','2026-04-12',3,'pending', 'Du lịch',       null,       '2026-04-01'),
('LV006','NV000007','unpaid',   'Nghỉ không lương','2026-03-25','2026-03-26',2,'approved','Việc cá nhân',  'NV000011','2026-03-20'),
('LV007','NV000011','annual',   'Nghỉ phép năm',   '2026-04-15','2026-04-17',3,'pending', 'Nghỉ dưỡng',    null,       '2026-04-02'),
('LV008','NV000008','maternity','Nghỉ thai sản',   '2026-02-01','2026-07-31',180,'approved','Sinh con',     'NV000012','2026-01-25')
on conflict (id) do nothing;

-- ---- REQUESTS ----
insert into requests (id,employee_id,type,type_label,content,status,approver_id,created_at) values
('REQ001','NV000002','shift_change','Đổi ca',        'Xin đổi ca ngày 15/04 từ ca sáng sang ca chiều','pending', null,       '2026-03-30'),
('REQ002','NV000005','overtime',   'Tăng ca',        'Xin tăng ca ngày 20/03 thêm 2 tiếng',           'approved','NV000013','2026-03-18'),
('REQ003','NV000001','attendance', 'Điều chỉnh công','Xin điều chỉnh giờ vào ngày 05/03',              'pending', null,       '2026-03-06'),
('REQ004','NV000003','shift_change','Đổi ca',        'Xin đổi ca ngày 22/03',                         'rejected','NV000012','2026-03-15')
on conflict (id) do nothing;

-- ---- SALARY ----
insert into salary (id,employee_id,period,base_salary,gross_salary,net_salary,work_days,actual_work_days,allowances,deductions,bonus,overtime_pay) values
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
('SAL_NV000011_2026-02','NV000011','2026-02',12000000,13230000,12730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000011_2026-03','NV000011','2026-03',12000000,13230000,12730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000012_2026-02','NV000012','2026-02',12000000,13230000,12730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000012_2026-03','NV000012','2026-03',12000000,13230000,12730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000013_2026-02','NV000013','2026-02',12000000,13230000,12730000,24,24,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0),
('SAL_NV000013_2026-03','NV000013','2026-03',12000000,13230000,12730000,26,22,'{"meal":730000,"transport":500000}','{"thueTNCN":500000}',0,0)
on conflict (id) do nothing;

-- ---- ANNOUNCEMENTS ----
insert into announcements (id,department,title,preview,creator,approver,status,start_date,end_date) values
('ann_001','Phòng hành chính nhân sự','THÔNG BÁO NGHỈ TẾT ÂM LỊCH NĂM 2026','Phòng Hành chính Nhân sự trân trọng thông báo lịch nghỉ Tết Âm Lịch 2026 tới toàn thể CBNV như sau:','Nguyễn Hoàng Kim Phụng','Cao Thị Hà Như','active','2026-02-05','2026-02-25'),
('ann_002','Phòng hành chính nhân sự','THÔNG BÁO TỔ CHỨC TIỆC TẤT NIÊN (YEAR END PARTY) 2025','Ban Tổ chức trân trọng kính mời toàn thể CBNV tham dự buổi tiệc tất niên năm 2025...','Nguyễn Hoàng Kim Phụng','Võ Lê Hoàng Văn','expired','2026-01-01','2026-01-31'),
('ann_003','Ban Giám đốc','THÔNG BÁO ĐIỀU CHỈNH GIỜ LÀM VIỆC THÁNG 04/2026','Kính thông báo về điều chỉnh giờ làm việc trong tháng 04/2026 áp dụng cho tất cả chi nhánh.','Tiểu Nhi','Cao Thị Hà Như','active','2026-04-01','2026-04-30')
on conflict (id) do nothing;

-- ---- MESSAGES ----
insert into messages (id,to_id,sender,avatar,subject,preview,body,actions,tag,tag_class,is_read,timestamp) values
('msg_0001','NV000011','Hệ thống Humi','https://i.pravatar.cc/36?img=12','Yêu cầu duyệt công – Tuần 09–15/03','Có 5 nhân viên đang chờ duyệt công trong tuần này...','<p>Kính gửi <strong>Quản lý</strong>,</p><p>Hệ thống ghi nhận có <strong>5 nhân viên</strong> đang chờ duyệt công.</p>','[{"label":"Đi đến Duyệt công","href":"duyet-cong.html","primary":true}]','Duyệt công','tag-orange',false,'2026-03-31T10:32:00'),
('msg_0002','NV000011','Nguyễn Văn An', 'https://i.pravatar.cc/36?img=31','Đơn xin nghỉ phép ngày 07/04/2026',   'Kính gửi quản lý, tôi xin phép được nghỉ phép năm vào...', '<p>Kính gửi quản lý,</p><p>Em xin phép nghỉ ngày 07/04/2026.</p>','[{"label":"Phê duyệt","href":"danh-sach-phieu-nghi.html","primary":true}]','Nghỉ phép','tag-blue',  false,'2026-03-31T09:15:00'),
('msg_0003','NV000011','Trần Thị Bích', 'https://i.pravatar.cc/36?img=5', 'Yêu cầu điều chỉnh ca làm việc tháng 4','Em muốn đổi ca ngày 15/04 từ ca sáng sang ca chiều...', '<p>Kính gửi quản lý,</p><p>Em muốn xin đổi ca ngày 15/04/2026.</p>','[{"label":"Phê duyệt","href":"duyet-yeu-cau.html","primary":true}]','Đổi ca',   'tag-purple',false,'2026-03-30T15:40:00'),
('msg_0004','NV000011','Lê Minh Quân',  'https://i.pravatar.cc/36?img=20','Báo cáo chấm công tháng 03/2026',       'Gửi quản lý, kính gửi báo cáo chấm công tháng 3...',    '<p>Kính gửi quản lý,</p><p>Báo cáo chấm công tháng 03/2026.</p>','[{"label":"Trả lời","href":"","primary":false}]','Báo cáo',  'tag-green', true, '2026-03-28T17:00:00'),
('msg_0005','NV000011','Hệ thống Humi', 'https://i.pravatar.cc/36?img=12','Thông báo: Cập nhật bảng lương tháng 03','Bảng lương tháng 03/2026 đã được phê duyệt và sẵn sàng...','<p>Bảng lương tháng 03/2026 đã sẵn sàng.</p>','[{"label":"Xem bảng lương","href":"xem-thu-nhap.html","primary":true}]','Lương',    'tag-green', true, '2026-03-25T08:00:00')
on conflict (id) do nothing;

-- =========================================
-- Compatibility patch (match columns used in js/db.js)
-- =========================================
create extension if not exists pgcrypto;

alter table attendance add column if not exists shift_id text;
do $$
begin
	alter table attendance
		add constraint attendance_shift_fk
		foreign key (shift_id) references shifts(id) on delete set null;
exception
	when duplicate_object then null;
end $$;

alter table attendance add column if not exists face_image_in text;
alter table attendance add column if not exists face_image_out text;
alter table attendance add column if not exists approver_id text;
alter table attendance add column if not exists approved_at timestamptz;
alter table attendance add column if not exists approved_check_in text;
alter table attendance add column if not exists approved_check_out text;
alter table attendance add column if not exists approver_note text;

alter table leave_requests add column if not exists approved_at timestamptz;
alter table leave_requests add column if not exists rejected_at timestamptz;
alter table leave_requests add column if not exists reject_reason text;

alter table messages add column if not exists from_id text;
alter table messages add column if not exists from_name text;
alter table messages add column if not exists tags text[] default '{}';
alter table messages add column if not exists important boolean default false;
alter table messages add column if not exists deleted boolean default false;
alter table messages add column if not exists created_at timestamptz default now();

create table if not exists work_shifts (
	id         text primary key,
	employee_id text references employees(id) on delete cascade,
	work_date  date not null,
	start_time text,
	end_time   text,
	shift_id   text references shifts(id) on delete set null,
	created_at timestamptz default now()
);

-- =========================================
-- SHIFT ASSIGNMENTS (auto-generate 29 days)
-- =========================================
with emp as (
	select id as employee_id,
				 coalesce(nullif(regexp_replace(id,'[^0-9]','','g'),''),'0')::int as emp_no
	from employees
	where status = 'active' and role_id in ('employee','manager')
), d as (
	select gs::date as work_date
	from generate_series(current_date - interval '14 day', current_date + interval '14 day', interval '1 day') as gs
	where extract(dow from gs) <> 0 -- skip sunday
), expanded as (
	select
		'sa_' || e.employee_id || '_' || to_char(d.work_date,'YYYYMMDD') as id,
		e.employee_id,
		case ((e.emp_no + extract(day from d.work_date)::int) % 5)
			when 0 then 'SH001'
			when 1 then 'SH002'
			when 2 then 'SH003'
			when 3 then 'SH004'
			else 'SH005'
		end as shift_id,
		d.work_date as date
	from emp e
	cross join d
)
insert into shift_assignments (id, employee_id, shift_id, date)
select id, employee_id, shift_id, date
from expanded
on conflict (id) do update
set employee_id = excluded.employee_id,
		shift_id = excluded.shift_id,
		date = excluded.date;

-- =========================================
-- ATTENDANCE (auto-generate 45 days history)
-- =========================================
with emp as (
	select id as employee_id,
				 coalesce(nullif(regexp_replace(id,'[^0-9]','','g'),''),'0')::int as emp_no
	from employees
	where status = 'active' and role_id in ('employee','manager')
), d as (
	select gs::date as work_date
	from generate_series(current_date - interval '45 day', current_date - interval '1 day', interval '1 day') as gs
	where extract(dow from gs) <> 0 -- skip sunday
), expanded as (
	select
		e.employee_id,
		d.work_date,
		case ((e.emp_no + extract(day from d.work_date)::int) % 5)
			when 0 then 'SH001'
			when 1 then 'SH002'
			when 2 then 'SH003'
			when 3 then 'SH004'
			else 'SH005'
		end as shift_id,
		((e.emp_no + extract(day from d.work_date)::int) % 12) as seed
	from emp e
	cross join d
), present_rows as (
	select *
	from expanded
	where seed <> 0 -- leave some days without attendance
)
insert into attendance (id, employee_id, shift_id, date, check_in, check_out, status, approval_status, note)
select
	'att_' || p.employee_id || '_' || to_char(p.work_date,'YYYYMMDD') || '_' || p.shift_id as id,
	p.employee_id,
	p.shift_id,
	p.work_date as date,
	to_char(time '08:00' + ((p.seed % 4) * interval '5 minute'), 'HH24:MI') as check_in,
	to_char(time '17:00' + ((p.seed % 3) * interval '10 minute'), 'HH24:MI') as check_out,
	'present' as status,
	case
		when p.work_date <= current_date - interval '2 day' then
			case when p.seed % 9 = 0 then 'rejected' else 'approved' end
		else 'pending'
	end as approval_status,
	'' as note
from present_rows p
on conflict (employee_id, date) do update
set id = excluded.id,
		shift_id = excluded.shift_id,
		check_in = excluded.check_in,
		check_out = excluded.check_out,
		status = excluded.status,
		approval_status = excluded.approval_status,
		note = excluded.note;

-- =========================================
-- WORK SHIFTS (for lich-lam-viec and setup pages)
-- =========================================
insert into work_shifts (id, employee_id, work_date, start_time, end_time, shift_id, created_at)
select
	sa.id,
	sa.employee_id,
	sa.date as work_date,
	s.start_time,
	s.end_time,
	sa.shift_id,
	now()
from shift_assignments sa
join shifts s on s.id = sa.shift_id
where sa.date between current_date - interval '14 day' and current_date + interval '14 day'
on conflict (id) do update
set employee_id = excluded.employee_id,
		work_date = excluded.work_date,
		start_time = excluded.start_time,
		end_time = excluded.end_time,
		shift_id = excluded.shift_id;

-- ---- MANAGER MESSAGES (cover all manager accounts) ----
insert into messages (id,to_id,sender,avatar,subject,preview,body,actions,tag,tag_class,is_read,timestamp) values
('msg_1001','NV000012','Hệ thống Humi','https://i.pravatar.cc/36?img=12','Yêu cầu duyệt công tuần này','Có nhân viên đang chờ duyệt công...','<p>Hệ thống ghi nhận có nhân viên đang chờ duyệt công.</p>','[{"label":"Đi đến Duyệt công","href":"duyet-cong.html","primary":true}]','Duyệt công','tag-orange',false,now()),
('msg_1002','NV000013','Hệ thống Humi','https://i.pravatar.cc/36?img=12','Yêu cầu duyệt phép tuần này','Có đơn nghỉ phép đang chờ xử lý...','<p>Vui lòng kiểm tra và duyệt các đơn nghỉ phép mới.</p>','[{"label":"Đi đến Danh sách phiếu nghỉ","href":"danh-sach-phieu-nghi.html","primary":true}]','Nghỉ phép','tag-blue',false,now())
on conflict (id) do nothing;
