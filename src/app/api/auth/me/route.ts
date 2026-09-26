import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authId = cookieStore.get('isim_auth_id')?.value;

    if (!authId) {
      return NextResponse.json({ success: false, user: null });
    }

    const users = await db.getUsers();
    const user = users.find((u) => u.id === authId);

    if (!user) {
      return NextResponse.json({ success: false, user: null });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ success: false, user: null });
  }
}
