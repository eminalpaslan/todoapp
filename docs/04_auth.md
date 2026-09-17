# Aşama 4: Kimlik Doğrulama (Auth)

## Ne yapıldı
- `bcrypt` ve `pyjwt` paketleri kuruldu (`passlib` yerine `bcrypt` doğrudan
  kullanıldı — `passlib` artık bakımsız ve yeni bcrypt sürümleriyle uyum
  sorunu çıkarıyor).
- `app/core/config.py`: `jwt_secret_key`, `jwt_algorithm`,
  `access_token_expire_minutes` alanları `Settings`'e eklendi.
- `app/core/security.py`: `hash_password`, `verify_password` (bcrypt) ve
  `create_access_token`, `decode_access_token` (JWT) fonksiyonları.
- `app/schemas/user.py`: `UserCreate`, `UserLogin`, `UserResponse`
  (şifre asla dönmez), `Token`.
- `app/routers/auth.py`:
  - `POST /auth/register` — yeni kullanıcı oluşturur, aynı email varsa 409.
  - `POST /auth/login` — email/şifre doğrularsa JWT access token döner,
    yanlışsa 401.
  - `GET /auth/me` — geçerli token ile giriş yapmış kullanıcının bilgisini
    döner (korumalı endpoint örneği).
- `app/core/deps.py`: `get_current_user` — `Authorization: Bearer <token>`
  header'ını okuyup doğrulayan, korumalı endpoint'lerde kullanılacak
  dependency ("token doğrulama middleware").
- `app/core/database.py`: engine'e `poolclass=NullPool` eklendi (bkz. aşağıda
  "Karşılaşılan sorun").
- `backend/tests/test_auth.py`: register/login/me akışını ve hata
  durumlarını (409, 401) test eden 5 test.

## Neden böyle yapıldı

**Sadece access token (refresh token yok)**
Basitlik tercih edildi — kullanıcı bilinçli olarak bu seçeneği seçti.
Token süresi dolunca (varsayılan 60 dk) kullanıcı tekrar login olur.

**Şifre asla API cevabında dönmez**
`UserResponse` şemasında `hashed_password` alanı hiç yok — `User` modelinden
`UserResponse`'a çevrilirken (`from_attributes=True`) sadece şemada
tanımlı alanlar aktarılır, geri kalanı otomatik elenir. Bu, model/schema
ayrımının tam olarak koruduğu şeydir.

**JSON body login (form-data değil)**
FastAPI'nin standart `OAuth2PasswordRequestForm`'u form-data bekler; mobil
uygulama (Expo) JSON gönderdiği için `UserLogin` şemasıyla düz JSON body
kullanıldı. Bunun bedeli: Swagger dokümantasyonundaki kilit simgesi
("Authorize") bizim login'imizle otomatik çalışmaz, ama gerçek kullanım
(mobil uygulama) için doğru tercih bu.

**`HTTPBearer` (OAuth2PasswordBearer değil)**
`OAuth2PasswordBearer`, Swagger'ın OAuth2 form akışı için tasarlanmış.
Bizim akışımız düz JSON login olduğu için `HTTPBearer` kullanıldı — bu,
Swagger'da token'ı doğrudan yapıştırarak test etmeyi kolaylaştırıyor.

## Karşılaşılan sorun ve çözümü: `NullPool`

Testlerde art arda iki istek (örn. register sonra login) aynı testte
çalışınca şu hata alındı:
```
asyncpg.exceptions._base.InterfaceError: cannot perform operation:
another operation is in progress
```
Sebep: `create_async_engine` varsayılan olarak bağlantıları bir havuzda
tutup tekrar kullanıyor. `TestClient`, uygulamayı ayrı bir thread/event
loop üzerinden çalıştırdığı için, bir önceki isteğin bağlantısı havuza tam
temiz dönmeden bir sonraki istek aynı bağlantıyı alabiliyor ve asyncpg bunu
reddediyor. Çözüm: `engine`'e `poolclass=NullPool` eklendi — her işlem için
taze bir bağlantı açılıyor, havuzlama yok. Bu projenin trafiği (kişisel
to-do uygulaması) için performans maliyeti önemsiz.

## Bilinen sınırlama
Testler gerçek geliştirme veritabanına (Docker'daki Postgres) karşı
çalışıyor, ayrı bir test veritabanı yok. Bu yüzden her test rastgele bir
email (`uuid4`) üretiyor ki testler birbirini veya önceki çalıştırmaları
etkilemesin. Test verileri veritabanında birikir — ileride ayrı bir test
veritabanı/temizlik mekanizması eklenebilir, şimdilik öğrenme aşaması için
yeterli görüldü.

## Nasıl denenir
```
cd backend
docker compose up -d
venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
```
```
curl -X POST http://localhost:8001/auth/register -H "Content-Type: application/json" -d "{\"email\":\"a@a.com\",\"password\":\"sifre123\"}"
curl -X POST http://localhost:8001/auth/login -H "Content-Type: application/json" -d "{\"email\":\"a@a.com\",\"password\":\"sifre123\"}"
curl http://localhost:8001/auth/me -H "Authorization: Bearer <TOKEN>"
```

## Sıradaki adım
Aşama 5: To-Do CRUD API — Create/Read/Update/Delete endpointleri,
kullanıcıya özel veri izolasyonu, Pydantic ile veri doğrulama.
