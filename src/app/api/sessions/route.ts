import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [allSessions, activeSession] = await Promise.all([
      db.getVotingSessions(),
      db.getActiveVotingSession(),
    ]);

    return NextResponse.json({
      success: true,
      sessions: allSessions,
      activeSession,
    });
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return NextResponse.json({ success: false, error: 'Oylamalar alınamadı' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, created_by_id, created_by_name, max_score, included_suggestion_ids } = body;

    if (!title || !created_by_id) {
      return NextResponse.json(
        { success: false, error: 'Oylama başlığı ve başlatan kullanıcı bilgisi zorunludur' },
        { status: 400 }
      );
    }

    const session = await db.createVotingSession({
      title: title.trim(),
      description: description ? description.trim() : '',
      created_by_id,
      created_by_name: created_by_name || 'Kullanıcı',
      max_score: max_score ? Number(max_score) : 10,
      included_suggestion_ids,
    });

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error('Failed to create voting session:', error);
    return NextResponse.json({ success: false, error: 'Oylama başlatılamadı' }, { status: 500 });
  }
}
