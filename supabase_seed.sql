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
