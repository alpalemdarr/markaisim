import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Oylama ID gerekli' }, { status: 400 });
    }

    const [leaderboard, votes] = await Promise.all([
      db.getSessionLeaderboard(id),
      db.getVotesBySession(id),
    ]);

    return NextResponse.json({
      success: true,
      leaderboard,
      votes,
    });
  } catch (error) {
    console.error('Failed to get session leaderboard:', error);
    return NextResponse.json({ success: false, error: 'Oylama sonuçları alınamadı' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { winner_suggestion_id } = body;

    const completed = await db.completeVotingSession(id, winner_suggestion_id);
    if (!completed) {
      return NextResponse.json({ success: false, error: 'Oylama bulunamadı' }, { status: 404 });
    }

    const leaderboard = await db.getSessionLeaderboard(id);

    return NextResponse.json({
      success: true,
      session: completed,
      leaderboard,
    });
  } catch (error) {
    console.error('Failed to complete session:', error);
    return NextResponse.json({ success: false, error: 'Oylama sonlandırılamadı' }, { status: 500 });
  }
}
