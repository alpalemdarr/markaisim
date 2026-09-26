import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = await db.getUsers();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Failed to get users:', error);
    return NextResponse.json({ success: false, error: 'Kullanıcılar alınamadı' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, avatar, color } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Kullanıcı ID gerekli' }, { status: 400 });
    }

    const updated = await db.updateUser(id, { name, avatar, color });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ success: false, error: 'Kullanıcı güncellenemedi' }, { status: 500 });
  }
}
