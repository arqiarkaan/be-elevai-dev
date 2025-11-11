import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { env } from '../config/env.js';

/**
 * Generate a unique order ID
 */
export function generateOrderId(prefix: string = 'ORDER'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Verify Midtrans signature
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string
): string {
  const signatureString = orderId + statusCode + grossAmount + serverKey;
  return CryptoJS.SHA512(signatureString).toString();
}

/**
 * Calculate premium expiry date
 */
export function calculatePremiumExpiry(plan: 'monthly' | 'yearly'): Date {
  const now = new Date();
  if (plan === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  } else {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now;
}

/**
 * Format currency to IDR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse PDF file buffer
 * Note: Placeholder for PDF parsing. Will be implemented when CV upload feature is used.
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse (CommonJS module)
    const module = await import('pdf-parse');
    // @ts-ignore - pdf-parse has mixed module exports
    const pdfParse = module.default || module;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Validate MBTI type
 */
export function isValidMBTI(mbti: string): boolean {
  const mbtiPattern = /^[EI][NS][TF][JP]$/;
  return mbtiPattern.test(mbti.toUpperCase());
}

/**
 * Sanitize string for safe usage
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Generate session ID for interview simulation
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Calculate days until expiry
 */
export function daysUntilExpiry(expiryDate: string | Date): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry utility with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }

  throw lastError;
}

/**
 * Truncate text to max length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
