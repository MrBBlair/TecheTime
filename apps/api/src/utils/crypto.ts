/**
 * Cryptographic utilities for PIN and secret hashing
 */

import crypto from 'crypto';

/**
 * Hash a PIN or secret using SHA-256
 */
export function hashSecret(plainText: string): string {
  return crypto.createHash('sha256').update(plainText).digest('hex');
}

/**
 * Generate a random secret for device sessions
 */
export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
