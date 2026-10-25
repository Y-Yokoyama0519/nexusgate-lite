import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('🌱 Starting minimal database seed...');

  // 1. profiles (admin_super を固定IDで投入)
  await supabase.from('profiles').upsert({
    id: '00000000-0000-0000-0000-000000000000',
    role: 'admin_super',
    display_name: '管理者',
  });

  // 2. customers (初期顧客)
  await supabase.from('customers').upsert({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'サンプル企業 株式会社',
    address1: '東京都千代田区丸の内1-1-1',
    address2: 'パシフィックタワー 10F',
    phone: '03-1234-5678',
  });

  // 3. partner_workers (初期パートナー)
  await supabase.from('partner_workers').upsert({
    id: '22222222-2222-2222-2222-222222222222',
    name: '東京サポート パートナーA',
    phone: '090-0000-0001',
    address1: '東京都港区新橋1-1-1',
    address2: '',
    base_location: 'POINT(139.7583 35.6664)',
  });

  // 4. projects (初期案件 1件)
  await supabase.from('projects').upsert({
    id: '33333333-3333-3333-3333-333333333333',
    customer_id: '11111111-1111-1111-1111-111111111111',
    title: '定期点検・現場サポート案件',
    status: 'pending',
    address1: '東京都千代田区有楽町1-2-2',
    address2: '',
    location: 'POINT(139.7612 35.6748)',
    scheduled_at: new Date().toISOString(),
  });

  console.log('✅ Minimal seed completed.');
}

runSeed();