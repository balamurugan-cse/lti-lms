import readline from 'readline';
import crypto from 'crypto';
import { db, UserRecord, ADMIN_PERMISSIONS } from '../server/db';
import { hashPassword } from '../server/auth';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function bootstrapAdmin() {
  const args = process.argv.slice(2);
  let emailArg = args.find((a) => a.startsWith('--email='))?.split('=')[1];
  let passwordArg = args.find((a) => a.startsWith('--password='))?.split('=')[1];
  let nameArg = args.find((a) => a.startsWith('--name='))?.split('=')[1];

  console.log('=============================================================');
  console.log('  LTI TECH / EDUTECH LMS: SECURE ADMINISTRATOR PROVISIONING  ');
  console.log('=============================================================');

  const existingAdmins = db.read().users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
  if (existingAdmins.length > 0 && !args.includes('--force')) {
    console.error(`\n[SECURITY LOCKOUT] An administrator already exists in the system: ${existingAdmins[0].email}`);
    console.error('CLI direct bootstrap is locked once an admin exists.');
    console.error('To manage administrators, log in at /admin/login or pass --force explicitly.');
    process.exit(1);
  }

  // Interactive input if not passed via flags
  let name = nameArg;
  if (!name) {
    name = await askQuestion('Enter Administrator Full Name: ');
  }

  let email = emailArg;
  if (!email) {
    email = await askQuestion('Enter Administrator Email: ');
  }

  let password = passwordArg;
  if (!password) {
    password = await askQuestion('Enter Administrator Password (min 8 chars, strong): ');
  }

  if (!name || !email || !password) {
    console.error('\n[ERROR] Name, email, and password are strictly required to provision an administrator.');
    process.exit(1);
  }

  email = email.trim().toLowerCase();
  if (!email.includes('@') || !email.includes('.')) {
    console.error('\n[ERROR] Please provide a valid email format.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('\n[ERROR] Administrator password must be at least 8 characters long for security.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const adminId = `usr-admin-${crypto.randomUUID()}`;

  const adminUser: UserRecord = {
    id: adminId,
    email,
    passwordHash,
    name: name.trim(),
    role: 'ADMIN',
    status: 'ACTIVE',
    permissions: [...ADMIN_PERMISSIONS],
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  db.update((draft) => {
    const idx = draft.users.findIndex((u) => u.email === email);
    if (idx >= 0) {
      draft.users[idx] = adminUser;
    } else {
      draft.users.push(adminUser);
    }
  });

  db.addAuditLog(
    'CLI_ADMIN_PROVISIONED',
    `Administrator '${email}' provisioned via secure CLI utility with full permissions.`,
    '127.0.0.1',
    'SUCCESS',
    adminId,
    'CLI-ADMIN'
  );

  console.log('\n[SUCCESS] Administrator successfully provisioned!');
  console.log(`Email:       ${email}`);
  console.log(`Role:        ADMIN`);
  console.log(`Permissions: ${ADMIN_PERMISSIONS.length} administrative permissions granted`);
  console.log(`Login URL:   /admin/login`);
  console.log('=============================================================\n');
}

bootstrapAdmin().catch((err) => {
  console.error('[FATAL] Failed to provision administrator:', err);
  process.exit(1);
});
