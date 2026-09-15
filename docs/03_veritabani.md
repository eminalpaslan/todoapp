# Aşama 3: Veritabanı

## Ne yapıldı
- `backend/docker-compose.yml`: PostgreSQL 16 (alpine) container'ı tanımlandı.
  Kullanıcı adı/şifre/db adı `.env`'den okunuyor (`${POSTGRES_USER}` vb.),
  dosyanın kendisinde düz metin secret yok.
- `backend/.env` (gitignore'da): gerçek `POSTGRES_*`, `DATABASE_URL`,
  `JWT_SECRET_KEY` değerleri rastgele üretilip eklendi.
- `backend/.env.example` güncellendi: yeni `POSTGRES_*` ve `DATABASE_URL`
  alanları örnek (sahte) değerlerle eklendi.
- `sqlalchemy[asyncio]`, `asyncpg`, `alembic` paketleri kuruldu,
  `requirements.txt` güncellendi.
- `app/core/config.py`: `database_url` alanı eklendi; `.env`'deki
  kullanılmayan alanlara (`POSTGRES_*`, `JWT_*`) takılmaması için
  `extra="ignore"` ayarlandı (bu alanları docker-compose kendi okuyor,
  JWT alanları Aşama 4'te Settings'e eklenecek).
- `app/core/database.py`: async SQLAlchemy engine, `AsyncSessionLocal`,
  `Base` (tüm modellerin türeyeceği sınıf) ve endpoint'lerde kullanılacak
  `get_db` dependency'si eklendi.
- `app/models/user.py`: ilk tablo — `User` modeli (`id`, `email` (unique),
  `hashed_password`, `created_at`).
- Alembic **async template** ile kuruldu (`alembic init -t async alembic`).
  `alembic.ini`'de `sqlalchemy.url` boş bırakıldı (secret repoya girmesin
  diye); `alembic/env.py` gerçek URL'i `app.core.config.settings`'ten okuyor
  ve `target_metadata`'yı `Base.metadata`'ya bağladı (autogenerate için).
- İlk migration üretildi (`create users table`) ve Docker'daki Postgres'e
  uygulandı; `users` tablosu doğrulandı.

## Neden böyle yapıldı

**Docker container, local kurulum değil**
Postgres'i doğrudan Windows'a kurmak yerine container kullanmak, sistemi
kirletmiyor ve `docker compose down -v` ile tamamen temizlenebiliyor.

**docker-compose.yml'de `${VAR}` kullanımı**
Docker Compose, yanındaki `.env` dosyasını otomatik okur. Böylece hem
uygulama hem container aynı `.env`'i paylaşıyor, şifre hiçbir git'e giren
dosyada düz yazılı durmuyor (CLAUDE.md güvenlik kuralı).

**Async SQLAlchemy + asyncpg**
CLAUDE.md "async endpoint tercih edilir" diyor; endpoint'ler async olacaksa
DB çağrıları da async olmalı, yoksa event loop bloklanır. Bu yüzden sync
`psycopg2` yerine `asyncpg` + SQLAlchemy'nin async engine'i seçildi.

**Alembic'in async template'i**
Alembic varsayılan olarak sync çalışır. `-t async` template'i, migration
çalıştırırken bizim async engine'imizle uyumlu bir `env.py` üretiyor;
böylece migration ve uygulama aynı bağlantı şeklini kullanıyor.

**`alembic.ini`'de URL boş, `env.py`'de dolduruluyor**
`alembic.ini` git'e giren bir dosya. İçine gerçek connection string
yazmak, `.env`'i gitignore'da tutmanın anlamını boşa çıkarırdı. Bunun
yerine `env.py` (kod, secret değil) çalışma anında `.env`'den okuyor.

**User modeli şimdi eklendi**
Alembic'in "autogenerate" özelliğini test edebilmek için en az bir tablo
gerekiyordu. `User` zaten Aşama 4'te (auth) kullanılacağı için burada
oluşturmak tekrar iş yapmayı önledi. Şifre hashleme (bcrypt) henüz
eklenmedi — `hashed_password` kolonu var ama hash'leyen kod Aşama 4'te.

## Nasıl çalıştırılır
```
cd backend
docker compose up -d          # Postgres container'ı başlat
venv\Scripts\activate
alembic upgrade head          # migration'ları uygula
uvicorn app.main:app --reload --port 8001
```
Container'ı durdurmak: `docker compose down` (veriyi de silmek için `-v`)

## Yeni migration eklemek
```
alembic revision --autogenerate -m "aciklama"
alembic upgrade head
```

## Sıradaki adım
Aşama 4: Kimlik doğrulama (Auth) — şifre hashleme (bcrypt), JWT ile
login/register, token doğrulama middleware.
