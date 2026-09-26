import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Çıkış yapıldı' });
  response.cookies.delete('isim_auth_id');
  return response;
}
