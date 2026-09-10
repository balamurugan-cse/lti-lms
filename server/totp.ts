import crypto from 'crypto';

// Standard RFC 4648 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(byteLength: number = 20): string {
  const buffer = crypto.randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32ToBuffer(base32: string): Buffer {
  const clean = base32.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue; // Ignore whitespace or unexpected chars
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

// Generate RFC 6238 TOTP Code for a given timestamp
export function generateTOTP(secret: string, timestampMs: number = Date.now()): string {
  const secretBuffer = base32ToBuffer(secret);
  const timeStep = Math.floor(timestampMs / 1000 / 30);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', secretBuffer).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

// Verify TOTP token with +/- 1 step (30 sec) skew tolerance
export function verifyTOTP(token: string, secret: string, timestampMs: number = Date.now()): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim().replace(/\s/g, '');
  if (cleanToken.length !== 6) return false;

  const currentStep = Math.floor(timestampMs / 1000 / 30);
  for (let stepOffset = -1; stepOffset <= 1; stepOffset++) {
    const stepTime = (currentStep + stepOffset) * 30 * 1000;
    const expected = generateTOTP(secret, stepTime);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

// Generate 8 alphanumeric recovery codes (8 chars formatted as XXXX-XXXX)
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${rand.slice(0, 4)}-${rand.slice(4, 8)}`);
  }
  return codes;
}

// Generate standard otpauth URI for QR codes and authenticator apps
export function getOtpAuthUri(accountName: string, issuer: string, secret: string): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
