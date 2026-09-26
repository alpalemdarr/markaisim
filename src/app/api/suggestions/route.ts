import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const suggestions = await db.getSuggestions();
    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('Failed to get suggestions:', error);
    return NextResponse.json({ success: false, error: 'İsim önerileri alınamadı' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, meaning, tagline, domain_status, tags, created_by_id, created_by_name } = body;

    if (!name || !meaning || !created_by_id) {
      return NextResponse.json(
        { success: false, error: 'İsim, anlam/açıklama ve kullanıcı bilgisi zorunludur.' },
        { status: 400 }
      );
    }

    const created = await db.createSuggestion({
      name: name.trim(),
      meaning: meaning.trim(),
      tagline: tagline ? tagline.trim() : '',
      domain_status: domain_status || 'unknown',
      tags: Array.isArray(tags) ? tags : [],
      created_by_id,
      created_by_name: created_by_name || 'Kullanıcı',
    });

    return NextResponse.json({ success: true, suggestion: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to create suggestion:', error);
    return NextResponse.json({ success: false, error: 'Öneri kaydedilemedi' }, { status: 500 });
  }
}
