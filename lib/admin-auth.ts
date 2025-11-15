import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'default-secret-change-in-production';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function getHmacKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SESSION_SECRET);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signToken(payload: string): Promise<string> {
  const timestamp = Date.now().toString();
  const data = `${payload}:${timestamp}`;
  const encoder = new TextEncoder();
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${data}:${signatureHex}`;
}

async function verifyToken(token: string): Promise<boolean> {
  const parts = token.split(':');
  if (parts.length !== 3) {
    return false;
  }
  
  const [payload, timestamp, signature] = parts;
  const data = `${payload}:${timestamp}`;
  const encoder = new TextEncoder();
  const key = await getHmacKey();
  
  const signatureBytes = new Uint8Array(
    signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(data)
  );
  
  if (!isValid) {
    return false;
  }
  
  const tokenTimestamp = parseInt(timestamp, 10);
  const now = Date.now();
  if (now - tokenTimestamp > SESSION_DURATION) {
    return false;
  }
  
  return true;
}

export async function validatePassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is not set');
  }
  return constantTimeEquals(password, adminPassword);
}

export async function createSession(): Promise<void> {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const token = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const signedToken = await signToken(token);
  const expires = new Date(Date.now() + SESSION_DURATION);
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  });
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return false;
  }
  
  return await verifyToken(sessionCookie.value);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<NextResponse | null> {
  const isValid = await validateSession();
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return null;
}

