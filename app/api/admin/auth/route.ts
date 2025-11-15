import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, createSession, clearSession, validateSession } from '@/lib/admin-auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, password } = body;

    if (action === 'login') {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      const isValid = await validatePassword(password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }

      await createSession();
      return NextResponse.json({ success: true });
    }

    if (action === 'logout') {
      await clearSession();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isValid = await validateSession();
  return NextResponse.json({ authenticated: isValid });
}

