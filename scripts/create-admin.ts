import crypto from 'crypto';
import { db, UserRecord } from '../server/db';
import { hashPassword } from '../server/auth';

async function bootstrapAdmin() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith('--email='))?.split('=')[1];
  const passwordArg = args.find((a) => a.startsWith('--password='))?.split('=')[1];
  const nameArg = args.find((a) => a.startsWith('--name='))?.split('=')[1];

  console.log('--- LTI Tech EduTech LMS: Administrator Provisioning Utility ---');

  const existingAdmins = db.read().users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
  if (existingAdmins.length > 0 && !args.includes('--force')) {
    console.error(`[SECURITY ALERT] Administrator already exists in database (${existingAdmins[0].email}).`);
    console.error('Initial bootstrap is locked. Use the admin portal to manage additional administrators or pass --force.');
    process.exit(1);
  }

  const email = (emailArg || 'system.admin@ltitech.internal').trim().toLowerCase();
  const password = passwordArg || 'LTIAdminSecure#2026';
  const name = nameArg || 'Primary LMS Administrator';

  if (password.length < 8) {
    console.error('[ERROR] Administrator password must be at least 8 characters long.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const adminId = `usr-admin-${crypto.randomUUID()}`;

  const adminUser: UserRecord = {
    id: adminId,
    email,
    passwordHash,
    name,
    role: 'ADMIN',
    status: 'ACTIVE',
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  db.update((draft) => {
    // If updating existing with force or adding new
    const idx = draft.users.findIndex((u) => u.email === email);
    if (idx >= 0) {
      draft.users[idx] = adminUser;
    } else {
      draft.users.push(adminUser);
    }
  });

  db.addAuditLog(
    'CLI_ADMIN_PROVISIONED',
    `Administrator '${email}' provisioned via secure CLI script.`,
    '127.0.0.1',
    'SUCCESS',
    adminId,
    'CLI-SYSTEM'
  );

  console.log('[SUCCESS] Primary administrator provisioned successfully!');
  console.log(`Email:    ${email}`);
  console.log(`Role:     ADMIN`);
  console.log(`Portal:   /admin/login`);
  console.log('-------------------------------------------------------------');
}

bootstrapAdmin().catch((err) => {
  console.error('[FATAL] Failed to provision administrator:', err);
  process.exit(1);
});
