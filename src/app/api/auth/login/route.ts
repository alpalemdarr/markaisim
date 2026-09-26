import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı ve şifre zorunludur.' },
        { status: 400 }
      );
    }

    const user = await db.authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı veya şifre hatalı.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user,
    });

    // Set cookie for session persistence (30 days)
    response.cookies.set('isim_auth_id', user.id, {
      httpOnly: false, // accessible to client for smooth state hydration
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Giriş yapılırken sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
