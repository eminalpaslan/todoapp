# CLAUDE.md

Bu dosya Claude Code'un her oturum başında okuduğu proje kural dosyasıdır.
Buradaki kurallar talimat değil, çalışma çerçevesidir. Claude Code kod yazarken buna uymalı.

## Proje

To-Do List mobil uygulaması.
Stack: React Native (Expo) + FastAPI (Python) + PostgreSQL.

Amaç: Öğrenerek geliştirmek. Kod üretilirken kısa açıklama da istenir.
Her büyük adımdan sonra `docs/` klasörüne o adımı özetleyen bir `.md` dosyası eklenir.

## Klasör yapısı

```
/backend
  /app
    /routers
    /models
    /schemas
    /core       -> config, security, db bağlantısı
  /alembic      -> migration dosyaları
  .env          -> gitignore'da, asla commit edilmez
  .env.example  -> gerçek değer yok, sadece key isimleri

/mobile
  /screens
  /components
  /services     -> API çağrıları
  /navigation

/docs
  00_yol_haritasi.md
  01_..., 02_... -> her aşamanın özeti
```

## Kodlama kuralları

- Backend: FastAPI + Pydantic + SQLAlchemy. Async endpoint tercih edilir.
- Mobil: Fonksiyonel component + hooks. Class component kullanılmaz.
- Değişken/fonksiyon isimleri İngilizce, açıklamalar Türkçe olabilir.
- Her yeni endpoint için: request/response şeması + hata durumu tanımlanır.
- Karmaşık fonksiyonlarda kısa yorum satırı zorunlu, gereksiz yorum yok.

## Güvenlik kuralları (kritik)

- API anahtarı, şifre, secret, connection string KOD İÇİNE YAZILMAZ.
- Tüm gizli değerler `.env` dosyasında tutulur, `.gitignore`'da olmalı.
- `.env.example` dosyası gerçek değerler olmadan repoya eklenir.
- Şifreler her zaman hashlenir (bcrypt), asla düz metin saklanmaz.
- JWT secret key en az 32 karakter, rastgele üretilir.
- Kullanıcı girdisi doğrudan SQL sorgusuna gömülmez (ORM kullan).
- CORS sadece gerekli origin'lere açılır, `*` production'da kullanılmaz.
- Her API endpoint'i, isteği yapan kullanıcının kendi verisine eriştiğini kontrol eder.

## Git kuralları

- `main` branch her zaman çalışır durumda olmalı.
- Her özellik ayrı branch: `feature/auth`, `feature/todo-crud` gibi.
- Commit mesajı kısa ve açıklayıcı: `feat: add login endpoint`, `fix: token expiry bug`.
- `.env`, `node_modules`, `__pycache__`, `.expo` gitignore'da.

## Test kuralları

- Backend: yeni endpoint yazılınca en az 1 pytest testi eklenir.
- Mobil: kritik ekranlar için (login, todo ekleme) temel test yazılır.

## Claude Code'dan beklenen davranış

- Bir görev verildiğinde önce ne yapacağını kısaca özetle.
- Dosya oluşturduktan/değiştirdikten sonra ne değiştiğini kısaca söyle.
- Güvenlikle ilgili bir karar varsa (auth, veri saklama, key yönetimi) açıkça belirt.
- Emin olmadığın büyük mimari kararlarda (örn. yeni kütüphane ekleme) önce sor.
- Bir aşama bitince `docs/` klasörüne o aşamayı özetleyen kısa bir dosya ekle:
  ne yapıldı, neden yapıldı, hangi dosyalar değişti.

## Şu anki aşama

Aşama 1: Proje temeli — klasör yapısı ve git kurulumu.
