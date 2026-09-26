import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, user_id, user_name, votes } = body;

    if (!session_id || !user_id || !Array.isArray(votes)) {
      return NextResponse.json(
        { success: false, error: 'Oylama ID, kullanıcı ve oy listesi zorunludur' },
        { status: 400 }
      );
    }

    const savedVotes = await db.submitUserVotes(
      session_id,
      user_id,
      user_name || 'Kullanıcı',
      votes
    );

    // Check if all 3 users have voted now
    const allUsers = await db.getUsers();
    const sessionVotes = await db.getVotesBySession(session_id);
    const uniqueVoters = Array.from(new Set(sessionVotes.map((v) => v.user_id)));

    return NextResponse.json({
      success: true,
      votes: savedVotes,
      voter_count: uniqueVoters.length,
      all_voted: uniqueVoters.length >= allUsers.length,
    });
  } catch (error) {
    console.error('Failed to submit votes:', error);
    return NextResponse.json({ success: false, error: 'Oylar kaydedilemedi' }, { status: 500 });
  }
}
