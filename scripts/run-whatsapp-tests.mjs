import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

async function runTests() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing in env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('--- WhatsApp Backend Test Suite Runner ---');
  // Fetch dev server response from /api/test-whatsapp
  try {
    const res = await fetch('http://localhost:3000/api/test-whatsapp');
    if (!res.ok) {
      console.error('Test endpoint returned HTTP error:', res.status, await res.text());
      process.exit(1);
    }
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    if (data.summary?.allPassed) {
      console.log('SUCCESS: All 15 WhatsApp backend tests passed!');
    } else {
      console.error('FAILURE: Some tests failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error invoking test runner:', err);
    process.exit(1);
  }
}

runTests();
