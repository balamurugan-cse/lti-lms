import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db, UserRecord } from './db';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'lti_edutech_production_access_key_sec_91823';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'lti_edutech_production_refresh_key_sec_48921';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Password hashing
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// Issue JWTs
export function generateAccessToken(user: UserRecord): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(user: UserRecord, familyId: string): string {
  const payload = {
    userId: user.id,
    familyId,
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string): { userId: string; familyId: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; familyId: string };
  } catch {
    return null;
  }
}

// In-memory rate limiting for login attempts
interface RateLimitBucket {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}
const loginRateLimits = new Map<string, RateLimitBucket>();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; remainingSec?: number } {
  const now = Date.now();
  const bucket = loginRateLimits.get(identifier);

  if (!bucket) {
    loginRateLimits.set(identifier, {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: 0,
    });
    return { allowed: true };
  }

  if (bucket.lockedUntil > now) {
    const remainingSec = Math.ceil((bucket.lockedUntil - now) / 1000);
    return { allowed: false, remainingSec };
  }

  // Reset window after 15 minutes of inactivity
  if (now - bucket.firstAttemptAt > 15 * 60 * 1000) {
    bucket.attempts = 1;
    bucket.firstAttemptAt = now;
    bucket.lockedUntil = 0;
    return { allowed: true };
  }

  bucket.attempts += 1;
  if (bucket.attempts > 5) {
    bucket.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
    return { allowed: false, remainingSec: 15 * 60 };
  }

  return { allowed: true };
}

export function clearLoginRateLimit(identifier: string) {
  loginRateLimits.delete(identifier);
}

// Authentication Middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Bearer token missing.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
    // Verify user exists and is active in database
    const user = db.read().users.find((u) => u.id === decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User session invalid. Account not found.' });
      return;
    }
    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: `Account is ${user.status.toLowerCase()}. Access restricted.` });
      return;
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Access token expired.', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(403).json({ error: 'Invalid authentication token.' });
  }
}

// Role-Based Authorization Guard
export function requireRole(allowedRoles: Array<'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // Always fetch authoritative role from database, never trust request payload!
    const user = db.read().users.find((u) => u.id === req.user?.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found in system.' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      db.addAuditLog(
        'RBAC_ACCESS_DENIED',
        `User ${user.email} (Role: ${user.role}) attempted unauthorized access to route requiring ${allowedRoles.join(', ')}`,
        (req.ip || req.socket.remoteAddress || 'unknown') as string,
        'WARNING',
        user.id,
        user.email
      );
      res.status(403).json({
        error: `Forbidden. Role '${user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
}

// Sanitize user for public/client responses
export function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
