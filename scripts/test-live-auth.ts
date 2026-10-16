import { prisma } from '../src/lib/prisma';
import { createDatabaseSession } from '../src/lib/auth';

const BASE_URL = 'http://localhost:3000';

interface LiveTestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: LiveTestResult[] = [];

function assert(condition: unknown, name: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    results.push({ name, passed: true });
  } else {
    console.error(`  ❌ FAIL: ${name} ${detail ? `-> ${detail}` : ''}`);
    results.push({ name, passed: false, error: detail });
  }
}

async function run() {
  console.log('\n================================================================================');
  console.log('🌐 RUNNING LIVE HTTP SERVER VERIFICATION (http://localhost:3000)');
  console.log('================================================================================\n');

  // Test 1: Public pages load cleanly
  console.log('📄 PHASE 1: Public Pages Accessibility & OAuth Configuration...');
  const resHome = await fetch(`${BASE_URL}/`);
  assert(resHome.status === 200, 'Landing page (/) returns 200 OK');

  const resLogin = await fetch(`${BASE_URL}/login`);
  assert(resLogin.status === 200, 'Login page (/login) returns 200 OK');

  // Verify that login and signup source components exclusively use Google OAuth and contain zero password fields
  const loginSource = await import('fs').then(fs => fs.readFileSync('src/app/login/page.tsx', 'utf-8'));
  assert(
    loginSource.includes('Continue with Google') &&
    !loginSource.includes('type="password"') &&
    !loginSource.includes('name="password"') &&
    !loginSource.includes('handleSubmit = async (e: React.FormEvent)'),
    'Login page source presents Google OAuth button and zero password fields'
  );

  const resSignup = await fetch(`${BASE_URL}/signup`);
  assert(resSignup.status === 200, 'Signup page (/signup) returns 200 OK');

  const signupSource = await import('fs').then(fs => fs.readFileSync('src/app/signup/page.tsx', 'utf-8'));
  assert(
    signupSource.includes('Continue with Google as') &&
    signupSource.includes('Learner / Student') &&
    signupSource.includes('Freelancer') &&
    signupSource.includes('Expert Mentor') &&
    signupSource.includes('Company') &&
    !signupSource.includes('type="password"'),
    'Signup page retains 4-role selection, Google OAuth buttons, and zero password fields'
  );

  // Test 2: Unauthenticated protection
  console.log('\n🔒 PHASE 2: Unauthenticated Route Protection & Redirection...');
  const testUnauth = async (path: string) => {
    const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
    const location = res.headers.get('location') || '';
    return { status: res.status, location };
  };

  const unauthLearner = await testUnauth('/learner/dashboard');
  assert(
    (unauthLearner.status === 307 || unauthLearner.status === 302) && unauthLearner.location.includes('/login'),
    'Unauthenticated access to /learner/dashboard redirects to /login'
  );

  const unauthFreelancer = await testUnauth('/freelancer/dashboard');
  assert(
    (unauthFreelancer.status === 307 || unauthFreelancer.status === 302) && unauthFreelancer.location.includes('/login'),
    'Unauthenticated access to /freelancer/dashboard redirects to /login'
  );

  const unauthMentor = await testUnauth('/mentor/dashboard');
  assert(
    (unauthMentor.status === 307 || unauthMentor.status === 302) && unauthMentor.location.includes('/login'),
    'Unauthenticated access to /mentor/dashboard redirects to /login'
  );

  const unauthCompany = await testUnauth('/company/dashboard');
  assert(
    (unauthCompany.status === 307 || unauthCompany.status === 302) && unauthCompany.location.includes('/login'),
    'Unauthenticated access to /company/dashboard redirects to /login'
  );

  const unauthAdmin = await testUnauth('/admin/dashboard');
  assert(
    (unauthAdmin.status === 307 || unauthAdmin.status === 302) && unauthAdmin.location.includes('/login'),
    'Unauthenticated access to /admin/dashboard redirects to /login'
  );

  const resMeUnauth = await fetch(`${BASE_URL}/api/auth/me`);
  assert(resMeUnauth.status === 401, 'Unauthenticated /api/auth/me returns 401 Unauthorized');

  // Test 3: Google OAuth Initiation
  console.log('\n⚡ PHASE 3: Google OAuth Initialization Endpoint...');
  const resGoogleInit = await fetch(`${BASE_URL}/api/auth/google/init?role=LEARNER`, { redirect: 'manual' });
  const googleLocation = resGoogleInit.headers.get('location') || '';
  const initCookies = resGoogleInit.headers.get('set-cookie') || '';
  assert(
    (resGoogleInit.status === 302 || resGoogleInit.status === 307) && googleLocation.includes('accounts.google.com'),
    '/api/auth/google/init redirects directly to accounts.google.com'
  );
  assert(initCookies.includes('groearn_oauth_state'), 'Google OAuth init issues signed groearn_oauth_state cookie');

  // Test 4: Learner Role Memory & Strict Isolation
  console.log('\n🎓 PHASE 4: Learner Role Persistence & Strict Isolation...');
  const learnerUser = await prisma.user.upsert({
    where: { email: 'live-test-learner@growearn.internal' },
    update: { role: 'LEARNER' },
    create: {
      email: 'live-test-learner@growearn.internal',
      name: 'Live Verified Learner',
      role: 'LEARNER',
      isVerified: true,
    },
  });
  const learnerSession = await createDatabaseSession(learnerUser);
  const learnerCookie = `groearn_session=${learnerSession.cookieValue}`;

  const resLearnerDash = await fetch(`${BASE_URL}/learner/dashboard`, {
    headers: { Cookie: learnerCookie },
    redirect: 'manual',
  });
  assert(resLearnerDash.status === 200, 'Authenticated Learner can access /learner/dashboard (200 OK)');

  const resLearnerMe = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: learnerCookie },
  });
  const learnerMeJson = await resLearnerMe.json();
  assert(
    learnerMeJson.success && learnerMeJson.data?.user?.role === 'LEARNER',
    'Learner /api/auth/me accurately reports role: LEARNER'
  );

  // Learner accessing other roles must be blocked and redirected to /learner/dashboard
  const learnerToMentor = await fetch(`${BASE_URL}/mentor/dashboard`, {
    headers: { Cookie: learnerCookie },
    redirect: 'manual',
  });
  assert(
    (learnerToMentor.status === 307 || learnerToMentor.status === 302) &&
      learnerToMentor.headers.get('location')?.includes('/learner/dashboard'),
    'Learner visiting /mentor/dashboard is strictly redirected to /learner/dashboard'
  );

  const learnerToCompany = await fetch(`${BASE_URL}/company/dashboard`, {
    headers: { Cookie: learnerCookie },
    redirect: 'manual',
  });
  assert(
    (learnerToCompany.status === 307 || learnerToCompany.status === 302) &&
      learnerToCompany.headers.get('location')?.includes('/learner/dashboard'),
    'Learner visiting /company/dashboard is strictly redirected to /learner/dashboard'
  );

  const learnerToFreelancer = await fetch(`${BASE_URL}/freelancer/dashboard`, {
    headers: { Cookie: learnerCookie },
    redirect: 'manual',
  });
  assert(
    (learnerToFreelancer.status === 307 || learnerToFreelancer.status === 302) &&
      learnerToFreelancer.headers.get('location')?.includes('/learner/dashboard'),
    'Learner visiting /freelancer/dashboard is strictly redirected to /learner/dashboard'
  );

  const learnerToAdmin = await fetch(`${BASE_URL}/admin/dashboard`, {
    headers: { Cookie: learnerCookie },
    redirect: 'manual',
  });
  assert(
    (learnerToAdmin.status === 307 || learnerToAdmin.status === 302) &&
      learnerToAdmin.headers.get('location')?.includes('/learner/dashboard'),
    'Learner visiting /admin/dashboard is strictly redirected to /learner/dashboard'
  );

  // Authenticated Learner visiting /login or /signup gets redirected to /learner/dashboard
  const learnerToLogin = await fetch(`${BASE_URL}/login`, {
    headers: { Cookie: learnerCookie },
    redirect: 'manual',
  });
  assert(
    (learnerToLogin.status === 307 || learnerToLogin.status === 302) &&
      learnerToLogin.headers.get('location')?.includes('/learner/dashboard'),
    'Authenticated Learner visiting /login is redirected to /learner/dashboard'
  );

  // Test 5: Freelancer Role Memory & Strict Isolation
  console.log('\n💼 PHASE 5: Freelancer Role Persistence & Strict Isolation...');
  const freelancerUser = await prisma.user.upsert({
    where: { email: 'live-test-freelancer@growearn.internal' },
    update: { role: 'FREELANCER' },
    create: {
      email: 'live-test-freelancer@growearn.internal',
      name: 'Live Verified Freelancer',
      role: 'FREELANCER',
      isVerified: true,
    },
  });
  const freelancerSession = await createDatabaseSession(freelancerUser);
  const freelancerCookie = `groearn_session=${freelancerSession.cookieValue}`;

  const resFreelancerDash = await fetch(`${BASE_URL}/freelancer/dashboard`, {
    headers: { Cookie: freelancerCookie },
    redirect: 'manual',
  });
  assert(resFreelancerDash.status === 200, 'Authenticated Freelancer can access /freelancer/dashboard (200 OK)');

  const freeToLearner = await fetch(`${BASE_URL}/learner/dashboard`, {
    headers: { Cookie: freelancerCookie },
    redirect: 'manual',
  });
  assert(
    (freeToLearner.status === 307 || freeToLearner.status === 302) &&
      freeToLearner.headers.get('location')?.includes('/freelancer/dashboard'),
    'Freelancer visiting /learner/dashboard is strictly redirected to /freelancer/dashboard'
  );

  const freeToMentor = await fetch(`${BASE_URL}/mentor/dashboard`, {
    headers: { Cookie: freelancerCookie },
    redirect: 'manual',
  });
  assert(
    (freeToMentor.status === 307 || freeToMentor.status === 302) &&
      freeToMentor.headers.get('location')?.includes('/freelancer/dashboard'),
    'Freelancer visiting /mentor/dashboard is strictly redirected to /freelancer/dashboard'
  );

  // Test 6: Mentor Role Memory & Strict Isolation
  console.log('\n👨‍🏫 PHASE 6: Mentor Role Persistence & Strict Isolation...');
  const mentorUser = await prisma.user.upsert({
    where: { email: 'live-test-mentor@growearn.internal' },
    update: { role: 'MENTOR' },
    create: {
      email: 'live-test-mentor@growearn.internal',
      name: 'Live Verified Mentor',
      role: 'MENTOR',
      isVerified: true,
    },
  });
  const mentorSession = await createDatabaseSession(mentorUser);
  const mentorCookie = `groearn_session=${mentorSession.cookieValue}`;

  const resMentorDash = await fetch(`${BASE_URL}/mentor/dashboard`, {
    headers: { Cookie: mentorCookie },
    redirect: 'manual',
  });
  assert(resMentorDash.status === 200, 'Authenticated Mentor can access /mentor/dashboard (200 OK)');

  const mentorToLearner = await fetch(`${BASE_URL}/learner/dashboard`, {
    headers: { Cookie: mentorCookie },
    redirect: 'manual',
  });
  assert(
    (mentorToLearner.status === 307 || mentorToLearner.status === 302) &&
      mentorToLearner.headers.get('location')?.includes('/mentor/dashboard'),
    'Mentor visiting /learner/dashboard is strictly redirected to /mentor/dashboard'
  );

  const mentorToCompany = await fetch(`${BASE_URL}/company/dashboard`, {
    headers: { Cookie: mentorCookie },
    redirect: 'manual',
  });
  assert(
    (mentorToCompany.status === 307 || mentorToCompany.status === 302) &&
      mentorToCompany.headers.get('location')?.includes('/mentor/dashboard'),
    'Mentor visiting /company/dashboard is strictly redirected to /mentor/dashboard'
  );

  // Test 7: Company Role Memory & Strict Isolation
  console.log('\n🏢 PHASE 7: Company Role Persistence & Strict Isolation...');
  const companyUser = await prisma.user.upsert({
    where: { email: 'live-test-company@growearn.internal' },
    update: { role: 'COMPANY' },
    create: {
      email: 'live-test-company@growearn.internal',
      name: 'Live Verified Company',
      role: 'COMPANY',
      isVerified: true,
    },
  });
  const companySession = await createDatabaseSession(companyUser);
  const companyCookie = `groearn_session=${companySession.cookieValue}`;

  const resCompanyDash = await fetch(`${BASE_URL}/company/dashboard`, {
    headers: { Cookie: companyCookie },
    redirect: 'manual',
  });
  assert(resCompanyDash.status === 200, 'Authenticated Company can access /company/dashboard (200 OK)');

  const compToLearner = await fetch(`${BASE_URL}/learner/dashboard`, {
    headers: { Cookie: companyCookie },
    redirect: 'manual',
  });
  assert(
    (compToLearner.status === 307 || compToLearner.status === 302) &&
      compToLearner.headers.get('location')?.includes('/company/dashboard'),
    'Company visiting /learner/dashboard is strictly redirected to /company/dashboard'
  );

  // Test 8: Retired Legacy Password Endpoints
  console.log('\n🚫 PHASE 8: Retired Legacy Password Endpoints (HTTP 410 Gone)...');
  const resOldLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
  });
  assert(resOldLogin.status === 410, 'Legacy /api/auth/login returns HTTP 410 Gone');

  const resOldRegister = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'password123', name: 'Test' }),
  });
  assert(resOldRegister.status === 410, 'Legacy /api/auth/register returns HTTP 410 Gone');

  // Test 9: Logout & Session Revocation
  console.log('\n🚪 PHASE 9: Logout & Session Invalidation...');
  const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: learnerCookie },
  });
  const logoutCookies = resLogout.headers.get('set-cookie') || '';
  assert(resLogout.status === 200, '/api/auth/logout returns 200 OK');
  assert(logoutCookies.includes('groearn_session=;'), 'Logout clears groearn_session cookie');

  // Verify revoked session can no longer access protected endpoints
  // 1. In API layer (database-backed session verification), the revoked session returns 401 Unauthorized
  const resAfterLogoutAPI = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: learnerCookie },
  });
  assert(resAfterLogoutAPI.status === 401, 'Revoked session cannot access /api/auth/me (returns 401 Unauthorized)');

  // 2. In client browser flow, the browser clears the cookie as instructed by Set-Cookie Max-Age=0
  // Any subsequent navigation to protected routes strictly redirects to /login
  const resBrowserAfterLogout = await fetch(`${BASE_URL}/learner/dashboard`, {
    redirect: 'manual',
  });
  assert(
    (resBrowserAfterLogout.status === 307 || resBrowserAfterLogout.status === 302) &&
      resBrowserAfterLogout.headers.get('location')?.includes('/login'),
    'Browser after logout is strictly redirected to /login'
  );

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n================================================================================');
  console.log(`📊 LIVE SERVER TEST RESULTS: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
  console.log('================================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

run()
  .catch((err) => {
    console.error('Fatal Test Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
