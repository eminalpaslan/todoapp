# Aşama 1: Proje Temeli

## Ne yapıldı
- `backend/` ve `mobile/` klasörleri ayrıldı.
- Backend içinde `app/routers`, `app/models`, `app/schemas`, `app/core`, `alembic` klasörleri açıldı.
- Mobil içinde `screens`, `components`, `services`, `navigation` klasörleri açıldı.
- `backend/.env.example` ve `backend/.gitignore` eklendi.
- `mobile/.gitignore` eklendi.

## Neden böyle yapıldı

**Backend/mobile ayrımı**
İki farklı proje gibi çalışırlar (biri Python, biri JavaScript). Ayrı klasörde olmaları
bağımlılıkların (dependencies) karışmasını engeller.

**routers / models / schemas / core ayrımı**
- `routers`: API endpoint'leri (örn. `/todos`, `/auth`)
- `models`: veritabanı tablolarının Python karşılığı (SQLAlchemy)
- `schemas`: API'ye giren/çıkan verinin şekli (Pydantic) — model ile schema'yı
  ayırmak, veritabanı yapısını dışarıya olduğu gibi sızdırmamak için önemli.
- `core`: config, güvenlik fonksiyonları, db bağlantısı gibi ortak altyapı.

Bu ayrım olmasa her şey tek dosyaya yığılır, proje büyüdükçe okunmaz hale gelir.

**.env.example vs .env**
`.env` gerçek şifre/anahtar içerir, asla repoya girmemeli.
`.env.example` sadece hangi değişkenlerin gerektiğini gösterir, başka biri projeyi
klonladığında ne eklemesi gerektiğini buradan anlar.

**.gitignore**
`node_modules`, `__pycache__`, `.env` gibi dosyalar hem gereksiz yer kaplar hem de
(`.env` özelinde) güvenlik riski taşır. Git'e hiç girmemeleri gerekir.

## Sıradaki adım
Aşama 2: Backend iskeleti — FastAPI projesi kurulumu, health-check endpoint.
