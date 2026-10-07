/**
 * Security and Cryptographic Hardening Utilities
 * Tour 360 Crisis Management Platform
 * 
 * Includes:
 * 1. Standard SHA-256 (FIPS 180-4) password hashing with cryptographic salt
 * 2. Constant-time string comparison (timing attack resistance)
 * 3. Cryptographically secure session token generation
 * 4. XSS & HTML input sanitization
 * 5. Safe URL validator (prevents javascript:, vbscript:, and data: XSS)
 * 6. Account brute-force rate limiter with temporary cooldown
 */

// --- Pure TypeScript SHA-256 Implementation (FIPS 180-4 compliant) ---
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  // Initial hash value: first 32 bits of fractional parts of square roots of first 8 primes
  let hash: number[] = [];
  // Round constants: first 32 bits of fractional parts of cube roots of first 64 primes
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime: { [key: number]: boolean } = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isPrime[i] = true;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  // Pre-processing
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << ((3 - (i % 4)) * 8);
  }

  // Process the message in successive 512-bit chunks
  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w: number[] = words.slice(j, j + 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = i >= 16 ? rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3) : 0;
      const s1 = i >= 16 ? rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10) : 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);

      const sigma0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const sigma1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);

      const temp1 =
        hash[7] +
        sigma1 +
        ch +
        k[i] +
        (i < 16 ? (w[i] = w[i] | 0) : ((w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0) | 0));
      const temp2 = sigma0 + maj;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >> (j * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

// --- Constant-Time String Comparison (Timing-Attack Resistant) ---
export function constantTimeEquals(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// --- Salted Password Hashing & Verification ---
const DEFAULT_GLOBAL_SALT = 'tour360_crisis_sec_v2';

export function hashPassword(password: string, customSalt?: string): string {
  const salt = customSalt || generateRandomSalt(12);
  const digest = sha256(`${salt}:${password}:${DEFAULT_GLOBAL_SALT}`);
  return `sha256$${salt}$${digest}`;
}

export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!password || !storedHashOrPlain) return false;

  // Stored in salted sha256 format: sha256$<salt>$<hash>
  if (storedHashOrPlain.startsWith('sha256$')) {
    const parts = storedHashOrPlain.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedDigest = parts[2];
      const actualDigest = sha256(`${salt}:${password}:${DEFAULT_GLOBAL_SALT}`);
      return constantTimeEquals(actualDigest, expectedDigest);
    }
  }

  // Backward compatibility with legacy plain text (automatically converted upon login)
  return constantTimeEquals(password, storedHashOrPlain);
}

function generateRandomSalt(length = 12): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, length);
  }
  return Math.random().toString(36).substring(2, 2 + length);
}

// --- Secure Session Token Generation ---
export function generateSecureToken(length = 32): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
}

// --- XSS & HTML Input Sanitization ---
export function sanitizeText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/\0/g, '') // strip null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // strip iframes
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // strip styles
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // strip event handlers (onload, onerror)
    .replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;')) // encode dangerous brackets
    .trim();
}

// --- Safe URL Validator (Protects against javascript: and data: XSS) ---
export function sanitizeUrl(url: string | undefined | null, fallback = ''): string {
  if (!url) return fallback;
  const trimmed = url.trim();

  // Allow relative URLs starting with / or ./ or ../
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }

  // Reject dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    (lower.startsWith('data:') && !lower.startsWith('data:image/'))
  ) {
    console.warn('[Security] Blocked potentially malicious URL scheme:', trimmed);
    return fallback;
  }

  // Allow standard protocols (http, https, blob, data:image/)
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('blob:') ||
    lower.startsWith('data:image/')
  ) {
    return trimmed;
  }

  return fallback;
}

// --- Validation Helpers ---
export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  if (!phone) return true; // phone can be optional in some contexts
  const cleaned = phone.replace(/[\s-]/g, '');
  // Iranian mobile (09...) or standard 10-14 digit phone numbers
  return /^(?:(?:\+?98)|0)?9\d{9}$/.test(cleaned) || /^\d{7,14}$/.test(cleaned);
}

// --- Brute-Force Rate Limiter ---
interface AttemptRecord {
  count: number;
  lastAttemptTime: number;
  lockedUntil: number;
}

class LoginRateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();
  private maxAttempts = 5;
  private lockoutDurationMs = 180 * 1000; // 3 minutes lockout

  public isLocked(identifier: string): { locked: boolean; remainingSeconds: number } {
    const key = identifier.trim().toLowerCase();
    const record = this.attempts.get(key);
    if (!record) return { locked: false, remainingSeconds: 0 };

    const now = Date.now();
    if (record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    // Lockout expired, reset counter if older than 15 minutes
    if (now - record.lastAttemptTime > 15 * 60 * 1000) {
      this.attempts.delete(key);
    }

    return { locked: false, remainingSeconds: 0 };
  }

  public recordFailedAttempt(identifier: string): {
    locked: boolean;
    remainingAttempts: number;
    remainingSeconds: number;
  } {
    const key = identifier.trim().toLowerCase();
    const now = Date.now();
    const record = this.attempts.get(key) || {
      count: 0,
      lastAttemptTime: now,
      lockedUntil: 0,
    };

    record.count += 1;
    record.lastAttemptTime = now;

    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockoutDurationMs;
      this.attempts.set(key, record);
      return {
        locked: true,
        remainingAttempts: 0,
        remainingSeconds: Math.ceil(this.lockoutDurationMs / 1000),
      };
    }

    this.attempts.set(key, record);
    return {
      locked: false,
      remainingAttempts: Math.max(0, this.maxAttempts - record.count),
      remainingSeconds: 0,
    };
  }

  public resetAttempts(identifier: string): void {
    const key = identifier.trim().toLowerCase();
    this.attempts.delete(key);
  }
}

export const rateLimiter = new LoginRateLimiter();
