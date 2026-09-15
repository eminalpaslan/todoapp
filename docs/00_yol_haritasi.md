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

### 7. Mobil uygulama iskeleti
- Expo projesi kurulumu
- Navigasyon yapısı (React Navigation)
- Klasör mimarisi (screens, components, services)

### 8. Mobil — API bağlantısı
- Axios/fetch servis katmanı
- Token saklama (SecureStore)
- Login/Register ekranları

### 9. To-Do ekranları
- Liste ekranı
- Ekleme/düzenleme/silme UI
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
Aşama 1: Proje temeli — klasör yapısı ve git kurulumu.
