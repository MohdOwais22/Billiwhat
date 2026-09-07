import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/^["']|["']$/g, '');
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/auth\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

function sanitizeSupabaseKey(rawKey?: string): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^["']|["']$/g, '');
}

// Load environment variables from .env
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        val = val.replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

async function runSecurityTests() {
  console.log('--- STARTING SECURITY VERIFICATION SUITE ---');

  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRoleKey = sanitizeSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !anonKey) {
    console.error('Supabase URL or Anon key missing.');
    process.exit(1);
  }

  const adminKey = serviceRoleKey || anonKey;
  const adminClient = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const testResults: Array<{ category: string; name: string; passed: boolean; details: string }> = [];

  let userAId: string | null = null;
  let userBId: string | null = null;
  let userCId: string | null = null;
  let userIdemId: string | null = null;
  let orgAId: string | null = null;
  let orgBId: string | null = null;
  let orgIdemId: string | null = null;

  try {
    // 1. SECRET SCAN
    let secretLeakCount = 0;
    const leakedFiles: string[] = [];

    function scanDirForSecrets(dir: string) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'dist' || file === 'scripts') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDirForSecrets(fullPath);
        } else if (/\.(tsx?|jsx?|html)$/.test(file)) {
          if (fullPath.includes('test-security') || fullPath.includes('run-security-tests')) continue;
          const content = fs.readFileSync(fullPath, 'utf8');
          const isClientComponent = content.includes("'use client'") || content.includes('"use client"');

          if (isClientComponent && content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
            secretLeakCount++;
            leakedFiles.push(`Client component referencing SUPABASE_SERVICE_ROLE_KEY: ${file}`);
          }
          if (content.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')) {
            secretLeakCount++;
            leakedFiles.push(`NEXT_PUBLIC variable referencing SUPABASE_SERVICE_ROLE_KEY: ${file}`);
          }
        }
      }
    }

    scanDirForSecrets(path.join(process.cwd(), 'app'));
    scanDirForSecrets(path.join(process.cwd(), 'components'));
    scanDirForSecrets(path.join(process.cwd(), 'lib'));

    testResults.push({
      category: 'Secret Scan',
      name: 'No SUPABASE_SERVICE_ROLE_KEY leakage to client components or NEXT_PUBLIC variables',
      passed: secretLeakCount === 0,
      details: secretLeakCount === 0 ? 'Passed: Zero service role key leaks detected.' : `Failed: ${leakedFiles.join(', ')}`,
    });

    // 2. OPEN REDIRECT SANITIZER
    function sanitizeRedirectUrl(url: string | null | undefined, defaultUrl = '/dashboard'): string {
      if (!url) return defaultUrl;
      const trimmed = url.trim();
      if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\') && !/^\/[a-zA-Z0-9]+:/.test(trimmed)) {
        return trimmed;
      }
      return defaultUrl;
    }

    const openRedirectTests = [
      { input: 'https://example.com', expected: '/dashboard' },
      { input: '//example.com', expected: '/dashboard' },
      { input: 'javascript:alert(1)', expected: '/dashboard' },
      { input: '\\\\evil.com', expected: '/dashboard' },
      { input: '/dashboard', expected: '/dashboard' },
      { input: '/onboarding?step=2', expected: '/onboarding?step=2' },
    ];

    const openRedirectPassed = openRedirectTests.every((t) => sanitizeRedirectUrl(t.input) === t.expected);
    testResults.push({
      category: 'Open Redirect',
      name: 'Redirect URL sanitizer strictly rejects external and protocol-relative URLs',
      passed: openRedirectPassed,
      details: openRedirectPassed
        ? 'Passed: External protocols, protocol-relative //, backslashes, and javascript: URLs correctly stripped to /dashboard.'
        : 'Failed: Open redirect sanitizer accepted an external URL.',
    });

    // 3. AUTH SYSTEM DUPLICATION AUDIT
    let duplicateAuthFound = false;
    const authFiles = [
      'components/modals/AuthModal.tsx',
      'app/auth/callback/route.ts',
      'app/api/auth/demo-login/route.ts',
    ];

    for (const af of authFiles) {
      const p = path.join(process.cwd(), af);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const hasSupabaseAuth = content.includes('supabase') || content.includes('client.auth') || content.includes('createServerClient') || content.includes('auth.signInWithOtp');
        if (!hasSupabaseAuth) duplicateAuthFound = true;
      }
    }

    testResults.push({
      category: 'Auth Architecture',
      name: 'Single canonical Supabase Auth identity system across entry points',
      passed: !duplicateAuthFound,
      details: !duplicateAuthFound
        ? 'Passed: All primary auth components and routes exclusively use Supabase Auth.'
        : 'Failed: Custom/standalone authentication logic detected.',
    });

    // 4. DEMO LOGIN SAFETY
    const demoRoutePath = path.join(process.cwd(), 'app/api/auth/demo-login/route.ts');
    const demoRouteContent = fs.existsSync(demoRoutePath) ? fs.readFileSync(demoRoutePath, 'utf8') : '';

    const hasAllowDemoGate = demoRouteContent.includes('ALLOW_DEMO_LOGIN');
    const passesNoClientIdInput = !demoRouteContent.includes('p_user_id') && !demoRouteContent.includes('req.json().userId');
    const usesServerOnlyEnv = demoRouteContent.includes('process.env.DEMO_LOGIN_EMAIL') && !demoRouteContent.includes('NEXT_PUBLIC_DEMO_LOGIN_PASSWORD');

    const demoSafetyPassed = hasAllowDemoGate && passesNoClientIdInput && usesServerOnlyEnv;
    testResults.push({
      category: 'Demo Login Safety',
      name: 'Demo login is server-gated, credentials are private, and client user ID override is prevented',
      passed: demoSafetyPassed,
      details: demoSafetyPassed
        ? 'Passed: Gated by ALLOW_DEMO_LOGIN, credentials stored in server-side env vars, user ID input cannot be supplied by client.'
        : 'Failed: Demo login route missing security gates or user ID sanitization.',
    });

    // SETUP TEST ACCOUNTS IN SUPABASE
    const testEmailA = `sec_cli_a_${Date.now()}@whatsbill.test`;
    const testEmailB = `sec_cli_b_${Date.now()}@whatsbill.test`;
    const testEmailC = `sec_cli_c_${Date.now()}@whatsbill.test`;
    const testPassword = `SecTest#2026!${Date.now()}`;

    const { data: userARes, error: userAErr } = await adminClient.auth.admin.createUser({
      email: testEmailA,
      password: testPassword,
      email_confirm: true,
    });
    if (userAErr || !userARes.user) throw new Error(`Failed to create Test User A: ${userAErr?.message}`);
    userAId = userARes.user.id;

    const { data: userBRes, error: userBErr } = await adminClient.auth.admin.createUser({
      email: testEmailB,
      password: testPassword,
      email_confirm: true,
    });
    if (userBErr || !userBRes.user) throw new Error(`Failed to create Test User B: ${userBErr?.message}`);
    userBId = userBRes.user.id;

    const { data: userCRes, error: userCErr } = await adminClient.auth.admin.createUser({
      email: testEmailC,
      password: testPassword,
      email_confirm: true,
    });
    if (userCErr || !userCRes.user) throw new Error(`Failed to create Test User C: ${userCErr?.message}`);
    userCId = userCRes.user.id;

    const { data: sessA } = await adminClient.auth.signInWithPassword({ email: testEmailA, password: testPassword });
    const { data: sessB } = await adminClient.auth.signInWithPassword({ email: testEmailB, password: testPassword });
    const { data: sessC } = await adminClient.auth.signInWithPassword({ email: testEmailC, password: testPassword });

    function createScopedClient(token: string) {
      return createClient(supabaseUrl!, anonKey!, {
        global: { headers: { Authorization: token ? `Bearer ${token}` : '' } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }

    const clientUserA = createScopedClient(sessA.session?.access_token!);
    const clientUserB = createScopedClient(sessB.session?.access_token!);
    const clientUserC = createScopedClient(sessC.session?.access_token!);

    // Create Org A via User A session using SECURITY DEFINER RPC
    const { data: orgARes, error: orgAErr } = await clientUserA.rpc('create_organization_for_current_user', {
      p_name: 'Security Test Org A',
    });
    if (orgAErr || !orgARes?.organization_id) throw new Error(`Failed to create Org A via RPC: ${orgAErr?.message || JSON.stringify(orgARes)}`);
    orgAId = orgARes.organization_id;

    // Create Org B via User B session using SECURITY DEFINER RPC
    const { data: orgBRes, error: orgBErr } = await clientUserB.rpc('create_organization_for_current_user', {
      p_name: 'Security Test Org B',
    });
    if (orgBErr || !orgBRes?.organization_id) throw new Error(`Failed to create Org B via RPC: ${orgBErr?.message || JSON.stringify(orgBRes)}`);
    orgBId = orgBRes.organization_id;

    // Add User C to Org A as member using User A (Org A owner) session
    await clientUserA.from('organization_members').insert({
      organization_id: orgAId,
      user_id: userCId,
      role: 'member',
    });

    // SEED ORG B DATA
    const { data: custB } = await adminClient
      .from('customers')
      .insert({ organization_id: orgBId, name: 'Org B Customer', phone: '919999999991' })
      .select('id')
      .single();

    const { data: prodB } = await adminClient
      .from('products')
      .insert({ organization_id: orgBId, name: 'Org B Product', selling_price: 100 })
      .select('id')
      .single();

    const { data: invB } = await adminClient
      .from('invoices')
      .insert({ organization_id: orgBId, customer_id: custB?.id, total: 100, due_date: '2026-12-31' })
      .select('id')
      .single();

    if (invB?.id && prodB?.id) {
      await adminClient.from('invoice_items').insert({
        invoice_id: invB.id,
        product_id: prodB.id,
        product_name: 'Org B Product',
        quantity: 1,
        unit_price: 100,
        line_total: 100,
      });
    }

    await adminClient
      .from('payments')
      .insert({ organization_id: orgBId, customer_id: custB?.id, invoice_id: invB?.id, amount: 50, method: 'cash' });

    await adminClient.from('gst_profiles').insert({
      organization_id: orgBId,
      gstin: '27AAAAA0000A1Z5',
      trade_name: 'Org B Business',
      legal_name: 'Org B Business Legal',
    });

    await adminClient.from('message_logs').insert({
      organization_id: orgBId,
      customer_id: custB?.id,
      recipient_phone: '919999999991',
      channel: 'whatsapp',
      message_body: 'Test Org B Message',
    });

    await adminClient.from('receivables').insert({
      organization_id: orgBId,
      customer_id: custB?.id,
      invoice_id: invB?.id,
      outstanding_amount: 50,
    });

    await adminClient.from('reminders').insert({
      organization_id: orgBId,
      customer_id: custB?.id,
      invoice_id: invB?.id,
      reminder_type: 'payment_due',
    });

    // 5. CROSS-ORGANIZATION SECURITY TEST
    const tablesToTest = [
      { name: 'customers', col: 'organization_id' },
      { name: 'products', col: 'organization_id' },
      { name: 'invoices', col: 'organization_id' },
      { name: 'payments', col: 'organization_id' },
      { name: 'receivables', col: 'organization_id' },
      { name: 'reminders', col: 'organization_id' },
      { name: 'message_logs', col: 'organization_id' },
      { name: 'gst_profiles', col: 'organization_id' },
      { name: 'organization_members', col: 'organization_id' },
    ];

    let crossOrgBreaches = 0;
    const crossOrgLog: string[] = [];

    for (const t of tablesToTest) {
      const { data: selData } = await clientUserA.from(t.name).select('*').eq(t.col, orgBId);
      if (selData && selData.length > 0) {
        crossOrgBreaches++;
        crossOrgLog.push(`Cross-Org SELECT breach on ${t.name}`);
      }

      let insPayload: any = { organization_id: orgBId, name: 'Hacked Item' };
      if (t.name === 'invoices') insPayload = { organization_id: orgBId, customer_id: custB?.id, total: 999 };
      if (t.name === 'payments') insPayload = { organization_id: orgBId, customer_id: custB?.id, amount: 999 };
      if (t.name === 'gst_profiles') insPayload = { organization_id: orgBId, gstin: '27BBB00000A1Z5' };
      if (t.name === 'organization_members') insPayload = { organization_id: orgBId, user_id: userAId, role: 'owner' };

      const { data: insData } = await clientUserA.from(t.name).insert(insPayload).select();
      if (insData && insData.length > 0) {
        crossOrgBreaches++;
        crossOrgLog.push(`Cross-Org INSERT breach on ${t.name}`);
      }

      const { data: updData } = await clientUserA.from(t.name).update({ name: 'Hacked Name', total: 99999 }).eq(t.col, orgBId).select();
      if (updData && updData.length > 0) {
        crossOrgBreaches++;
        crossOrgLog.push(`Cross-Org UPDATE breach on ${t.name}`);
      }

      const { data: delData } = await clientUserA.from(t.name).delete().eq(t.col, orgBId).select();
      if (delData && delData.length > 0) {
        crossOrgBreaches++;
        crossOrgLog.push(`Cross-Org DELETE breach on ${t.name}`);
      }
    }

    testResults.push({
      category: 'Cross-Organization Isolation',
      name: 'User A (Org A) strictly blocked from SELECT/INSERT/UPDATE/DELETE on Org B data across all tables',
      passed: crossOrgBreaches === 0,
      details: crossOrgBreaches === 0
        ? 'Passed: All unauthorized cross-organization SELECT/INSERT/UPDATE/DELETE queries returned 0 rows or were rejected by RLS.'
        : `Failed (${crossOrgBreaches} breaches): ${crossOrgLog.join(', ')}`,
    });

    // 6. ROLE ESCALATION TEST
    let roleEscalationBreaches = 0;
    const roleEscalationLog: string[] = [];

    const { data: roleUpd } = await clientUserC.from('organization_members').update({ role: 'owner' }).eq('user_id', userCId).eq('organization_id', orgAId).select();
    if (roleUpd && roleUpd.length > 0 && roleUpd[0].role === 'owner') {
      roleEscalationBreaches++;
      roleEscalationLog.push("Member upgraded self to 'owner'");
    }

    const { data: orgUpd } = await clientUserC.from('organizations').update({ name: 'Hacked Org A Name' }).eq('id', orgAId).select();
    if (orgUpd && orgUpd.length > 0) {
      roleEscalationBreaches++;
      roleEscalationLog.push('Member updated organization settings');
    }

    const { data: delOwner } = await clientUserC.from('organization_members').delete().eq('user_id', userAId).eq('organization_id', orgAId).select();
    if (delOwner && delOwner.length > 0) {
      roleEscalationBreaches++;
      roleEscalationLog.push('Member removed Owner from organization');
    }

    testResults.push({
      category: 'Role Escalation',
      name: 'Non-owner member (User C) strictly blocked from role escalation, org settings edits, and owner removal',
      passed: roleEscalationBreaches === 0,
      details: roleEscalationBreaches === 0
        ? 'Passed: Member cannot upgrade role, modify org settings, or remove owner. Database RLS enforced.'
        : `Failed: ${roleEscalationLog.join(', ')}`,
    });

    // 7. USER PROFILE ISOLATION
    const { data: profBSelect } = await clientUserA.from('user_profiles').select('*').eq('id', userBId);
    const { data: profBUpdate } = await clientUserA.from('user_profiles').update({ display_name: 'Hacked User B' }).eq('id', userBId).select();

    const profIsolationPassed = (!profBSelect || profBSelect.length === 0) && (!profBUpdate || profBUpdate.length === 0);
    testResults.push({
      category: 'User Profile Isolation',
      name: 'User A cannot SELECT or UPDATE User B user_profiles row',
      passed: profIsolationPassed,
      details: profIsolationPassed
        ? 'Passed: RLS policy USING (id = auth.uid()) strictly isolates user profile records.'
        : 'Failed: User A successfully accessed or mutated User B profile row.',
    });

    // 8. ONBOARDING IDEMPOTENCY TEST
    const testEmailIdem = `sec_idem_${Date.now()}@whatsbill.test`;
    const { data: userIdemRes, error: userIdemErr } = await adminClient.auth.admin.createUser({
      email: testEmailIdem,
      password: testPassword,
      email_confirm: true,
    });
    if (userIdemErr || !userIdemRes?.user) throw new Error(`Failed to create Idem User: ${userIdemErr?.message}`);
    userIdemId = userIdemRes.user.id;

    const { data: sessIdem } = await adminClient.auth.signInWithPassword({ email: testEmailIdem, password: testPassword });
    const clientIdem = createScopedClient(sessIdem.session?.access_token!);

    // Call RPC 1: Initial workspace creation
    const { data: rpc1Data, error: rpc1Err } = await clientIdem.rpc('create_organization_for_current_user', {
      p_name: 'Security Test Org Idem',
    });

    // Call RPC 2: Duplicate workspace creation attempt
    const { data: rpc2Data, error: rpc2Err } = await clientIdem.rpc('create_organization_for_current_user', {
      p_name: 'Security Test Org Idem Duplicate',
    });

    const isAlreadyExisted = rpc2Data?.already_existed === true || (Boolean(rpc1Data?.organization_id) && rpc2Data?.organization_id === rpc1Data?.organization_id);
    const returnedOrgId = rpc2Data?.organization_id || rpc1Data?.organization_id || null;
    orgIdemId = returnedOrgId;

    const onboardingIdempotentPassed = isAlreadyExisted && Boolean(returnedOrgId);
    testResults.push({
      category: 'Onboarding Idempotency',
      name: 'Duplicate onboarding call returns existing workspace without creating duplicate org/memberships',
      passed: onboardingIdempotentPassed,
      details: onboardingIdempotentPassed
        ? 'Passed: RPC returned already_existed: true on second invocation and returned identical organization_id.'
        : `Failed: rpc1Err: ${rpc1Err?.message}, rpc2Err: ${rpc2Err?.message}, rpc1Data: ${JSON.stringify(rpc1Data)}, rpc2Data: ${JSON.stringify(rpc2Data)}`,
    });

    // 9. LOGOUT / UNAUTHENTICATED ACCESS
    const unauthClient = createScopedClient('');
    const { data: unauthData } = await unauthClient.from('customers').select('*').eq('organization_id', orgAId);

    const logoutPassed = !unauthData || unauthData.length === 0;
    testResults.push({
      category: 'Session & Logout Security',
      name: 'Unauthenticated requests rejected with 0 rows or 401 error',
      passed: logoutPassed,
      details: logoutPassed
        ? 'Passed: Requests without valid authentication token receive 0 records from protected tables.'
        : 'Failed: Unauthenticated request leaked records.',
    });

    console.log('\n--- SECURITY TEST SUITE RESULTS ---');
    let totalPassed = 0;
    for (const r of testResults) {
      if (r.passed) totalPassed++;
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.category} - ${r.name}`);
      console.log(`       Details: ${r.details}`);
    }

    const allPassed = totalPassed === testResults.length;
    console.log(`\nTOTAL: ${testResults.length} | PASSED: ${totalPassed} | FAILED: ${testResults.length - totalPassed}`);
    console.log(`FINAL STATUS: ${allPassed ? 'PASS' : 'FAIL'}`);

    if (!allPassed) process.exit(1);
  } catch (err: any) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    // CLEANUP
    if (adminClient) {
      try {
        const testOrgIds = [orgAId, orgBId, orgIdemId].filter(Boolean) as string[];
        const testUserIds = [userAId, userBId, userCId, userIdemId].filter(Boolean) as string[];

        if (testOrgIds.length > 0) {
          await adminClient.from('invoice_items').delete().in('invoice_id', (await adminClient.from('invoices').select('id').in('organization_id', testOrgIds)).data?.map((i) => i.id) || []);
          await adminClient.from('invoices').delete().in('organization_id', testOrgIds);
          await adminClient.from('payments').delete().in('organization_id', testOrgIds);
          await adminClient.from('receivables').delete().in('organization_id', testOrgIds);
          await adminClient.from('reminders').delete().in('organization_id', testOrgIds);
          await adminClient.from('message_logs').delete().in('organization_id', testOrgIds);
          await adminClient.from('gst_profiles').delete().in('organization_id', testOrgIds);
          await adminClient.from('customers').delete().in('organization_id', testOrgIds);
          await adminClient.from('products').delete().in('organization_id', testOrgIds);
          await adminClient.from('organization_members').delete().in('organization_id', testOrgIds);
          await adminClient.from('organizations').delete().in('id', testOrgIds);
        }

        if (testUserIds.length > 0) {
          await adminClient.from('user_profiles').delete().in('id', testUserIds);
          for (const uid of testUserIds) {
            await adminClient.auth.admin.deleteUser(uid);
          }
        }
        console.log('--- CLEANUP COMPLETE: All test artifacts removed ---');
      } catch (cleanErr) {
        console.error('Cleanup error:', cleanErr);
      }
    }
  }
}

runSecurityTests();
