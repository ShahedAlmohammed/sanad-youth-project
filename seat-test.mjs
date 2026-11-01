const BASE = 'http://localhost:3000';
const APPLY_URL = (programId) => `${BASE}/applications/${programId}`; // تأكدي منه (الخطوة 2)
const [email, password] = process.argv.slice(2);
const N = 10;

async function call(method, path, body, token) {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
}

const login = async (e, p) => {
  const r = await call('POST', '/auth/login', { email: e, password: p });
  return r.data?.accessToken ?? r.data?.access_token;
};

// 1) برنامج جديد بمقعد وحيد
const supToken = await login(email, password);
if (!supToken) throw new Error('Supervisor login failed');
const created = await call('POST', '/programs', {
  title: 'Last Seat Test',
  description: 'Concurrency demo',
  totalSeats: 1,
}, supToken);
console.log('create program:', created.status);
const programId = created.data.id;

// 2) 10 شباب
const stamp = Date.now();
const tokens = [];
for (let i = 1; i <= N; i++) {
  const e = `race${stamp}_${i}@test.com`;
  await call('POST', '/auth/register', { name: `Race ${i}`, email: e, password: '123456' });
  tokens.push(await login(e, '123456'));
  await new Promise((r) => setTimeout(r, 13000));
}

// 3) كلهم يقدّموا بنفس اللحظة
const results = await Promise.all(
  tokens.map((t) => fetch(APPLY_URL(programId), {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}` },
  }).then((r) => r.status)),
);
console.log('apply statuses:', results.join(', '));

// 4) المقاعد بعد السباق
const after = await call('GET', `/programs/${programId}`, null, supToken);
console.log('availableSeats after:', after.data.availableSeats);