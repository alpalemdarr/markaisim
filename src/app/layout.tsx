import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'İsimBulucu | Yeni Proje İsim Önerisi ve Oylama Platformu',
  description:
    'Yeni projemiz için isim önerilerinin girildiği, açıklamaların incelendiği ve 3 eşit yetkili kullanıcının oylama başlatıp puanladığı modern platform.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
