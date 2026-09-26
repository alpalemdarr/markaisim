import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const status = await db.getStatus();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Failed to get DB status:', error);
    return NextResponse.json({ success: false, error: 'DB durumu alınamadı' }, { status: 500 });
  }
}
