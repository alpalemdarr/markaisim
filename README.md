# 🚀 İsimBulucu - Yeni Proje İsim Önerisi ve Oylama Platformu

Yeni projeniz için isim fikirlerinin toplandığı, anlam ve kökenlerinin detaylandırıldığı ve **3 eşit yetkili kurucu/ortak kullanıcının** oylama başlatıp 1-10 puan usulüyle kazanan ismi belirlediği modern web uygulaması.

---

## ✨ Temel Özellikler

1. **3 Eşit Yetkili Kullanıcı:**
   - 3 kullanıcı da aynı özellik ve yetkilere sahiptir.
   - Ekranın üst kısmındaki profil değiştiriciden anında geçiş yapılabilir.
   - Her kullanıcı kendi takma adını ve avatar emojisini düzenleyebilir (örn. Ahmet, Mehmet, Selin).

2. **İsim & Anlam Girişi:**
   - Proje / marka ismi
   - Ne anlama geldiği, dil kökeni ve projenin vizyonuyla uyumu
   - Slogan / Tagline
   - Etiketler (Teknoloji, Modern, Türkçe, Global, vb.)
   - .com alan adı müsaitlik durumu

3. **Oylama Oturumu Başlatma & Puanlama:**
   - **3 kullanıcıdan herhangi biri** istediği zaman oylama başlatabilir.
   - Canlı katılım takipçisi: Hangi kullanıcının oy verdiği, hangisinin beklendiği anlık gösterilir (örn: 2/3 tamamlandı).
   - İnteraktif oy pusulası: Her öneriye 1 ile 10 arasında puan ve isteğe bağlı görüş notu verilir.
   - Kazananı İlan Etme & Podyum: 1. (Altın 🥇), 2. (Gümüş 🥈) ve 3. (Bronz 🥉) derece alan isimler, toplam ve ortalama puanları, detaylı kullanıcı dökümleriyle listelenir ve konfeti patlatılır!

4. **Tartışma ve Yorumlaşma:**
   - Her önerinin altına ortaklar anlık görüş veya çekincelerini yorum olarak ekleyebilir.

---

## 🛠️ Vercel'e Dağıtım ve Veritabanı (PostgreSQL)

Bu proje Vercel sunucusuz (serverless) mimarisi için özel olarak optimize edilmiştir. Otomatik şema oluşturma (auto-migration) mekanizması sayesinde tablolar ve varsayılan 3 kullanıcı ilk çalıştırmada otomatik hazırlanır.

### Vercel'de Canlıya Alma Adımları:

1. Projeyi GitHub reponuza push edin:
   ```bash
   git add .
   git commit -m "feat: proje isim oylama uygulamasi"
   git push origin main
   ```

2. [Vercel](https://vercel.com) paneline gidin ve **"Add New Project"** diyerek deponuzu bağlayın.

3. **Veritabanı Bağlantısı (2 Seçenek):**
   - **Seçenek A (En Kolay - Vercel Postgres):**
     Vercel Dashboard'da projenize gidin > **Storage** sekmesine tıklayın > **Create Database: Postgres (Neon)** seçin. Vercel otomatik olarak bağlantı değişkenlerini projenize ekler!
   - **Seçenek B (Supabase / Neon / Railway):**
     Vercel Dashboard > **Settings** > **Environment Variables** bölümüne gidip şu değişkeni ekleyin:
     ```env
     DATABASE_URL="postgres://kullanici:sifre@host:port/veritabani?sslmode=require"
     ```

4. **Deploy** butonuna basın. Başka hiçbir SQL komutu çalıştırmanıza gerek yoktur!

---

## 💻 Yerel Geliştirme (Local Development)

Yerel ortamda PostgreSQL kurmadan da anında test edebilmeniz için sistem akıllı bir yerel depolama motoruna sahiptir (`.data/db.json`).

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.
