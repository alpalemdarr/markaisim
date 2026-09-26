import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const suggestionId = searchParams.get('suggestion_id');
    if (!suggestionId) {
      return NextResponse.json({ success: false, error: 'suggestion_id parametresi gerekli' }, { status: 400 });
    }

    const comments = await db.getComments(suggestionId);
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Failed to get comments:', error);
    return NextResponse.json({ success: false, error: 'Yorumlar alınamadı' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { suggestion_id, user_id, user_name, text } = body;

    if (!suggestion_id || !user_id || !text) {
      return NextResponse.json(
        { success: false, error: 'Öneri ID, kullanıcı ve yorum metni zorunludur' },
        { status: 400 }
      );
    }

    const comment = await db.addComment({
      suggestion_id,
      user_id,
      user_name: user_name || 'Kullanıcı',
      text: text.trim(),
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ success: false, error: 'Yorum eklenemedi' }, { status: 500 });
  }
}
