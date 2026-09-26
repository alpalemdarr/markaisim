import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    await db.deleteSuggestion(id);
    return NextResponse.json({ success: true, message: 'Öneri başarıyla silindi' });
  } catch (error) {
    console.error('Failed to delete suggestion:', error);
    return NextResponse.json({ success: false, error: 'Öneri silinemedi' }, { status: 500 });
  }
}
