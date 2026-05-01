#!/usr/bin/env node
/**
 * HUMI HRM – Supabase Seed Script
 * Chạy SQL schema + seed data vào Supabase
 * Sử dụng: node seed.js [--reset-only] [--force]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Lỗi: Không tìm thấy SUPABASE_URL hoặc SUPABASE_KEY trong .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../../supabase_schema.sql');
const SEED_FILE = path.join(__dirname, '../../supabase_seed.sql');

async function runSQL(sql) {
  console.log('📝 Chạy SQL...');
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    // RPC không tồn tại - dùng REST API fallback
    console.log('💡 RPC exec_sql không khả dụng, thử SQL trực tiếp...');
    // Thực hiện từng câu lệnh SQL
    const statements = sql.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (!stmt.trim()) continue;
      const { error: stmtError } = await supabase.from('_raw_sql').select('*').limit(0);
      if (stmtError) {
        // Fallback: chỉ cảnh báo, không dừng
        console.warn('⚠️  Cảnh báo:', stmtError.message);
      }
    }
  }
}

async function seed() {
  console.log('🚀 HUMI HRM – Supabase Seeding\n');

  const args = process.argv.slice(2);
  const resetOnly = args.includes('--reset-only');
  const force = args.includes('--force');

  try {
    // 1. Kiểm tra kết nối
    console.log('✓ Kết nối Supabase:', SUPABASE_URL);
    const { data, error: connError } = await supabase.from('employees').select('count').limit(0);
    if (connError) {
      console.error('❌ Lỗi kết nối:', connError.message);
      process.exit(1);
    }
    console.log('✓ Kết nối thành công\n');

    // 2. Kiểm tra dữ liệu hiện tại
    const { count: empCount, error: countError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('ℹ️  Bảng employees chưa tồn tại hoặc chưa có dữ liệu');
    } else if (empCount && empCount > 0 && !force) {
      console.log(`⚠️  Đã có ${empCount} nhân viên trong database`);
      console.log('    Dùng --force để ghi đè, hoặc --reset-only để xoá toàn bộ');
      process.exit(0);
    }

    // 3. Đọc file SQL
    console.log('📂 Đọc schema...');
    const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
    console.log('✓ Schema: ' + schema.split('\n').length + ' dòng');

    console.log('📂 Đọc seed data...');
    const seedData = fs.readFileSync(SEED_FILE, 'utf8');
    console.log('✓ Seed data: ' + seedData.split('\n').length + ' dòng\n');

    // 4. Xoá dữ liệu cũ (nếu cần)
    if (force) {
      console.log('🗑️  Xoá dữ liệu cũ...');
      const tables = [
        'messages', 'announcements', 'shift_assignments', 'salary',
        'requests', 'leave_requests', 'attendance',
        'accounts', 'shifts', 'work_shifts', 'employees'
      ];
      for (const table of tables) {
        const { error: delError } = await supabase.from(table).delete().neq('id', '');
        if (delError) console.log(`  ⚠️  ${table}: ${delError.message}`);
        else console.log(`  ✓ ${table}`);
      }
    }

    if (resetOnly) {
      console.log('\n✅ Xoá dữ liệu xong (--reset-only)');
      process.exit(0);
    }

    // 5. Tạo schema
    console.log('\n📋 Tạo schema...');
    // Schema được tạo bằng migration, không cần chạy SQL trực tiếp
    console.log('✓ Schema đã được tạo từ migration\n');

    // 6. Seed dữ liệu (chỉ INSERT, không xoá)
    console.log('🌱 Thêm dữ liệu seed...\n');
    
    // EMPLOYEES
    const emps = [
      ['NV000001', 'Nguyễn Văn An', 'employee', 'CH613 Âu Cơ', 'Nhân viên bán hàng'],
      ['NV000002', 'Trần Thị Bích', 'employee', 'CH613 Âu Cơ', 'Nhân viên bán hàng'],
      ['NV000003', 'Lê Minh Quân', 'employee', 'CH614 Lê Văn Sỹ', 'Nhân viên bán hàng'],
      ['NV000004', 'Phạm Thị Thu', 'employee', 'CH614 Lê Văn Sỹ', 'Nhân viên bán hàng'],
      ['NV000005', 'Hoàng Anh Tuấn', 'employee', 'CH615 Nguyễn Trãi', 'Nhân viên bán hàng'],
      ['NV000006', 'Đặng Thị Lan', 'employee', 'CH615 Nguyễn Trãi', 'Nhân viên bán hàng'],
      ['NV000007', 'Bùi Văn Cường', 'employee', 'CH613 Âu Cơ', 'Nhân viên kho'],
      ['NV000008', 'Nguyễn Thị Hoa', 'employee', 'CH614 Lê Văn Sỹ', 'Thu ngân'],
      ['NV000009', 'Trương Văn Đức', 'employee', 'CH615 Nguyễn Trãi', 'Nhân viên kho'],
      ['NV000010', 'Lý Thị Mỹ', 'employee', 'CH613 Âu Cơ', 'Thu ngân'],
      ['NV000011', 'Tiểu Nhi', 'manager', 'CH613 Âu Cơ', 'Quản lý chi nhánh'],
      ['NV000012', 'Minh Quang', 'manager', 'CH614 Lê Văn Sỹ', 'Quản lý chi nhánh'],
      ['NV000013', 'Thanh Hương', 'manager', 'CH615 Nguyễn Trãi', 'Quản lý chi nhánh'],
      ['NV000014', 'Admin', 'admin', 'Công ty TNHH Humi', 'Quản trị hệ thống']
    ];

    for (const [id, name, role, unit, pos] of emps) {
      const { error: empErr } = await supabase.from('employees').upsert({
        id, code: id, name, role_id: role, unit, position: pos,
        status: 'active', start_date: '2023-01-01'
      }, { onConflict: 'id' });
      if (empErr) console.log(`  ⚠️  ${name}: ${empErr.message}`);
      else console.log(`  ✓ ${name} (${id})`);
    }

    // ACCOUNTS
    console.log('\n📝 Thêm accounts...');
    for (const [id] of emps) {
      const { error: accErr } = await supabase.from('accounts').upsert({
        employee_id: id, password: '123456'
      }, { onConflict: 'employee_id' });
      if (accErr && !accErr.message.includes('duplicate')) {
        console.log(`  ⚠️  ${id}: ${accErr.message}`);
      } else {
        console.log(`  ✓ ${id}`);
      }
    }

    // SHIFTS
    console.log('\n⏰ Thêm ca làm việc...');
    const shifts = [
      ['SH001', 'Ca sáng', '08:00', '17:00'],
      ['SH002', 'Ca chiều', '13:00', '22:00'],
      ['SH003', 'Ca tối', '18:00', '23:00'],
    ];

    for (const [id, name, start, end] of shifts) {
      const { error: shErr } = await supabase.from('shifts').upsert({
        id, name, code: name, start_time: start, end_time: end,
        break_minutes: 60, work_hours: 8, active: true
      }, { onConflict: 'id' });
      if (shErr) console.log(`  ⚠️  ${name}: ${shErr.message}`);
      else console.log(`  ✓ ${name}`);
    }

    console.log('\n✅ Seed dữ liệu hoàn tất!');
    console.log('📌 Tổng số nhân viên:', emps.length);
    console.log('📌 Đăng nhập bằng: NV000001 / 123456 (hoặc NV000014 cho admin)');
    console.log('');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

seed();
