import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID gerekli' }, { status: 400 });
    }

    // Determine user ID from cookies or request body
    const cookieStore = await cookies();
    let userId = cookieStore.get('isim_auth_id')?.value;

    try {
      const body = await request.json().catch(() => null);
      if (body?.userId) {
        userId = body.userId;
      }
    } catch {
      // Body may be empty on standard DELETE
    }

    const result = await db.deleteSuggestion(id, userId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Öneri başarıyla silindi' });
  } catch (error) {
    console.error('Failed to delete suggestion:', error);
    return NextResponse.json({ success: false, error: 'Öneri silinemedi' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID gerekli' }, { status: 400 });
    }

    const body = await request.json();
    const cookieStore = await cookies();
    const userId = body.userId || cookieStore.get('isim_auth_id')?.value;

    if (!body.name || !body.meaning) {
      return NextResponse.json(
        { success: false, error: 'İsim ve açıklama zorunludur.' },
        { status: 400 }
      );
    }

    const result = await db.updateSuggestion(
      id,
      {
        name: body.name,
        meaning: body.meaning,
        tagline: body.tagline,
        domain_status: body.domain_status,
        tags: body.tags,
      },
      userId
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, suggestion: result.suggestion });
  } catch (error) {
    console.error('Failed to update suggestion:', error);
    return NextResponse.json({ success: false, error: 'Öneri güncellenemedi' }, { status: 500 });
  }
}
