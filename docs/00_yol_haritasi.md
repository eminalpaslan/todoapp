# To-Do List Uygulaması — Yol Haritası

Stack: React Native (Expo) + FastAPI + PostgreSQL

## Aşamalar

### 1. Proje temeli
- Klasör yapısı (backend / mobile / docs)
- Git repo kurulumu
- .gitignore, .env.example

### 2. Backend iskeleti
- FastAPI projesi kurulumu
- Klasör mimarisi (routers, models, schemas, core)
- Health-check endpoint

### 3. Veritabanı
- PostgreSQL kurulumu (local + sonra cloud)
- SQLAlchemy modelleri
- Alembic ile migration sistemi

### 4. Kimlik doğrulama (Auth)
- Kullanıcı modeli
- Şifre hashleme (bcrypt)
- JWT ile login/register
- Token doğrulama middleware

### 5. To-Do CRUD API
- Create / Read / Update / Delete endpointleri
- Kullanıcıya özel veri izolasyonu
- Pydantic ile veri doğrulama

### 6. Güvenlik katmanı
- .env ile secret/API key yönetimi
- CORS ayarları
- Rate limiting
- Input validation / SQL injection koruması (ORM zaten sağlıyor ama bilinçli olacağız)

### 6.5. Hesap yönetimi (ek kapsam)
- Email doğrulama (Mailpit ile, login'i engellemez)
- Şifremi unuttum / şifre sıfırlama
- Kullanıcı profili güncelleme (email, şifre)
- Logout (token_version ile gerçek iptal)
- Health-check'in veritabanı bağlantısını da kontrol etmesi

### 7. Mobil uygulama iskeleti
- Expo projesi kurulumu
- Navigasyon yapısı (React Navigation)
- Klasör mimarisi (screens, components, services)

### 8. Mobil — API bağlantısı
- Axios/fetch servis katmanı
- Token saklama (SecureStore)
- Login/Register ekranları

### 9. Hedefler, alışkanlıklar ve sekme yapısı (genişletilmiş kapsam)
- Kapsam, basit bir to-do listesinden hedef+alışkanlık takibi yapan bir
  uygulamaya genişledi — detaylı tasarım kararları için bkz.
  `docs/09_tasarim_hedefler_aliskanliklar.md`.
- Backend: Todo'ya `period` alanı (günlük/haftalık/aylık/yıllık),
  yeni `Habit` + `HabitCheckIn` modelleri/endpoint'leri.
- Mobil: alt sekme navigasyonu (Ana Sayfa, Hedefler, Alışkanlıklar,
  Yapay Zeka-placeholder) + Profil butonu.
- State yönetimi (Context API veya Zustand)

### 10. UX iyileştirme
- Loading/error state'leri
- Boş liste durumu
- Basit animasyonlar

### 11. Test
- Backend: pytest ile unit test
- Mobil: temel component testleri

### 12. Deployment
- Backend hosting (Render/Railway gibi)
- PostgreSQL hosting
- Mobil build (EAS Build)

### 13. Yayın
- App Store / Play Store hazırlığı
- Son güvenlik kontrolü

## Kural
Her aşamada:
1. Ne yapıyoruz, neden yapıyoruz → önce açıklama
2. Kod → sonra yazılır, birlikte incelenir
3. O aşamanın özeti bu docs klasörüne dosya olarak eklenir

## Sıradaki adım
Aşama 9 tamamlandı (backend: `docs/09a_backend_hedef_aliskanlik.md`,
mobil: `docs/09b_mobil_sekmeler.md`). Sırada Aşama 10: UX iyileştirme
(loading/error state'leri, boş liste durumu, basit animasyonlar) — ya da
kullanıcı başka bir önceliği (Yapay Zeka kapsamı, alışkanlık geçmişi gibi)
işaret ederse önce o ele alınır.
