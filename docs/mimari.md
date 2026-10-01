# Mimari — Genel Bakış

> Bu dosya, `docs/0X_...md` dosyalarından farklı: onlar her aşamanın "o anki"
> özetiyken, bu dosya projenin **güncel** mimarisini anlatır. Mimari
> değiştikçe (yeni klasör, yeni katman, yeni model) bu dosya güncellenir.
>
> Son güncelleme: Aşama 9b (Mobil — sekme navigasyonu, Hedefler, Alışkanlıklar) sonrası.

## Büyük resim

```
mobile (React Native / Expo)  ⇄  HTTP/JSON  ⇄  backend (FastAPI)  ⇄  PostgreSQL (Docker)
                                                        ↓
                                                  Mailpit (Docker) — doğrulama/sıfırlama mailleri
```

- **mobile/**: Kullanıcının gördüğü uygulama (Expo/React Native). Giriş/
  kayıt gerçek backend'e bağlı, token cihazda şifreli saklanıyor. Giriş
  sonrası 4 sekmeli ana yapı: Ana Sayfa (ilerleme özeti), Hedefler
  (periyot bazlı todo/goal listesi), Alışkanlıklar, Yapay Zeka
  (placeholder). Profil/ayarlar her sekmenin header'ındaki ikonla erişiliyor.
- **backend/**: Tüm iş mantığı, veri doğrulama, kimlik doğrulama ve
  veritabanı erişimi burada. Mobil uygulama sadece bu API'ye HTTP isteği atar.
- **docs/**: Kod değil ama projenin "neden böyle" tarihçesi.

## Bir isteğin backend içindeki yolculuğu

Örnek: mobil uygulama `POST /auth/login` isteği atıyor.

```
1. main.py          → istek FastAPI app'ine düşer, CORS kontrolünden geçer
2. routers/auth.py  → hangi fonksiyonun çalışacağına URL+metoda göre karar verilir
3. schemas/user.py  → gövdedeki JSON, UserLogin şemasına göre doğrulanır
                       (email formatı yanlışsa burada otomatik 422 döner)
4. core/database.py → get_db() ile bir veritabanı oturumu (session) açılır
5. models/user.py   → User tablosunda email'e göre satır aranır (SQLAlchemy)
6. core/security.py → bulunan kullanıcının hash'lenmiş şifresiyle
                       gönderilen şifre karşılaştırılır (verify_password)
                       doğruysa yeni bir JWT üretilir (create_access_token)
7. schemas/user.py  → cevap, Token şemasına göre JSON'a çevrilip döner
```

Korumalı bir endpoint'te (örn. `GET /auth/me`) araya bir adım daha girer:

```
routers/auth.py → core/deps.py (get_current_user) → gelen Authorization
header'ındaki token'ı core/security.py ile çözer, geçerliyse DB'den o
kullanıcıyı çeker ve endpoint fonksiyonuna parametre olarak verir.
```

Veri izolasyonu gereken bir endpoint'te (örn. `GET /todos/{id}`) bu ikisi
birleşiyor: önce `get_current_user` ile "sen kimsin" belirleniyor, sonra
`routers/todo.py`'deki sorgu `WHERE id = ? AND owner_id = <current_user.id>`
şeklinde çalışıyor — yani veritabanı sorgusunun kendisi, başkasının
verisini zaten hiç sonuç olarak döndürmüyor (kod içinde ayrıca bir
"yasaklama" if'i yok, sorgu seviyesinde engelleniyor).

## Klasör ve dosyalar

### Kök dizin

| Yol | Ne işe yarar |
|---|---|
| `CLAUDE.md` | Projenin kural/çerçeve dosyası — kodlama, güvenlik, git, test kuralları |
| `.gitignore` | Kök seviyede hangi dosyaların git'e girmeyeceği (`.env` dosyaları) |
| `docs/` | Her aşamanın özeti + bu mimari dosyası |
| `backend/` | FastAPI + PostgreSQL API'si |
| `mobile/` | Expo (React Native) mobil uygulaması — giriş/kayıt + 4 sekmeli ana yapı çalışıyor |

### `backend/` — üst seviye

| Yol | Ne işe yarar |
|---|---|
| `.env` | **Gerçek** gizli değerler (DB şifresi, JWT secret). Git'e girmez. |
| `.env.example` | `.env`'in şablonu, gerçek değer yok. Git'e girer, başka biri projeyi klonlayınca neye ihtiyaç olduğunu buradan anlar. |
| `.gitignore` | `venv/`, `__pycache__/`, `.env`, `.pytest_cache/` gibi backend'e özel ignore kuralları |
| `docker-compose.yml` | PostgreSQL ve Mailpit container'larının tanımı. Postgres şifresi/kullanıcı adı `.env`'den okunur (`${POSTGRES_USER}` gibi), kod içine yazılı değil. Mailpit gerçek email göndermez, `localhost:8025`'te web arayüzü sunar |
| `requirements.txt` | Kurulu Python paketlerinin tam listesi (`pip freeze` çıktısı) — başka bir makinede `pip install -r requirements.txt` ile aynı ortam kurulur |
| `pytest.ini` | Pytest ayarı: `app` paketinin testlerden import edilebilmesi için `pythonpath = .` |
| `venv/` | Python sanal ortamı (gitignore'da, elle oluşturulur, repoya girmez) |

### `backend/app/` — asıl uygulama kodu

FastAPI uygulamasının kendisi burada. Alt klasörler, CLAUDE.md'nin
belirlediği katman ayrımını izliyor:

| Yol | Ne işe yarar |
|---|---|
| `main.py` | Uygulamanın giriş noktası. `FastAPI()` nesnesini oluşturur, rate limiter'ı ve CORS'u (spesifik origin/method/header — `*` yok) middleware olarak ekler, tüm router'ları (`health`, `auth`, `todo`, `habit`) buraya bağlar |

#### `app/core/` — ortak altyapı

Hiçbir endpoint'e özel olmayan, her yerden kullanılan kod burada.

| Dosya | Ne içerir | Kim kullanır |
|---|---|---|
| `config.py` | `Settings` sınıfı — `.env`'den okunan tüm ayarlar (app adı, CORS origin'leri, `DATABASE_URL`, JWT ayarları). Uygulama genelinde `from app.core.config import settings` ile import edilir. | Her yer |
| `database.py` | Async SQLAlchemy `engine`, `AsyncSessionLocal` (oturum üretici), `Base` (tüm modellerin türediği sınıf), `get_db()` (endpoint'lere DB oturumu enjekte eden FastAPI dependency'si) | `models/*`, `routers/*`, `alembic/env.py` |
| `security.py` | `hash_password` / `verify_password` (bcrypt); `create_access_token`/`decode_access_token` (login token'ı — `sub`, `ver`=token_version, `type: "access"` taşır); `create_purpose_token`/`decode_purpose_token` (email doğrulama ve şifre sıfırlama için genel amaçlı, `type` alanıyla birbirine karışmaz) | `routers/auth.py`, `core/deps.py` |
| `deps.py` | `get_current_user` — `Authorization: Bearer <token>` header'ını doğrular, `type` alanının `"access"` olduğunu VE token'daki `ver`'in kullanıcının DB'deki güncel `token_version`'ıyla eşleştiğini kontrol eder (eşleşmezse logout/şifre değişimi sonrası eski token demektir) | Korumalı endpoint'ler (`auth.py`'deki `/me`, `/logout`; `todo.py`'nin tamamı) |
| `limiter.py` | Paylaşılan `slowapi` `Limiter` nesnesi (IP bazlı, bellek-içi). Genel varsayılan: `60/minute`. | `main.py` (middleware olarak), `routers/auth.py` (`@limiter.limit` ile ekstra sıkı limit) |
| `email.py` | `send_email(to, subject, body)` — Mailpit'e `smtplib` (stdlib) ile gönderir, bloklamaması için `run_in_threadpool` içinde çalışır. Gönderim hatası (`OSError`) çağıran tarafta yutulur, işlemi (register/reset) başarısız kılmaz | `routers/auth.py` |

#### `app/models/` — veritabanı tabloları (SQLAlchemy)

Python sınıfı = veritabanı tablosu. `core/database.py`'deki `Base`'den türerler.

| Dosya | İçerik |
|---|---|
| `user.py` | `User` tablosu: `id`, `email` (unique), `hashed_password`, `is_verified`, `token_version` (logout/şifre değişiminde artar), `created_at` |
| `todo.py` | `Todo` tablosu ("hedef"): `id`, `title`, `description` (opsiyonel), `is_done`, `period` (`daily`/`weekly`/`monthly`/`yearly`, varsayılan `daily`), `owner_id` (`users.id`'ye foreign key, index'li), `created_at` |
| `habit.py` | `Habit` tablosu: `id`, `name`, `period` (`daily`/`weekly`/`monthly`), `owner_id`, `created_at`. `HabitCheckIn` tablosu: `id`, `habit_id` (foreign key), `period_key` (örn. `"2026-10-01"`, `"2026-W40"`, `"2026-10"` — hangi periyot için işaretlendiği), `created_at`. `(habit_id, period_key)` üzerinde benzersizlik kısıtı var — aynı periyot iki kez işaretlenemez |

> Yeni bir tablo eklerken: burada yeni bir dosya/sınıf açılır, ardından
> `alembic revision --autogenerate` ile migration üretilip `alembic upgrade
> head` ile veritabanına uygulanır (bkz. `docs/03_veritabani.md`).

#### `app/schemas/` — API'ye giren/çıkan veri şekli (Pydantic)

Modellerle karıştırılmamalı: model = veritabanı satırı, şema = API sözleşmesi.
Örn. `User` modelinde `hashed_password` var ama hiçbir şema onu dışarı vermez.

| Dosya | İçerik |
|---|---|
| `user.py` | `UserCreate`, `UserLogin`, `UserResponse` (şifre yok, `is_verified` var), `Token`, `UserUpdate` (profil güncelleme — şifre değişimi mevcut şifre ister), `ForgotPasswordRequest`, `ResetPasswordRequest`, `VerifyEmailRequest`, `MessageResponse` (generic `{"message": "..."}` cevabı) |
| `todo.py` | `Period` (`Literal["daily","weekly","monthly","yearly"]`), `TodoCreate`, `TodoUpdate` (tüm alanlar opsiyonel — kısmi güncelleme için), `TodoResponse` (`owner_id` yok — cevap zaten hep giriş yapmış kullanıcının verisi) |
| `habit.py` | `HabitPeriod` (`Literal["daily","weekly","monthly"]`), `HabitCreate`, `HabitResponse`, `HabitCheckInCreate` (`period_key`), `HabitCheckInResponse` |

#### `app/routers/` — endpoint tanımları

Her router, ilgili bir konudaki endpoint'leri gruplar; `main.py`'de
`include_router` ile bağlanır.

| Dosya | Endpoint'ler |
|---|---|
| `health.py` | `GET /health` — sunucu VE veritabanı bağlantısı ayakta mı (`SELECT 1` çalıştırır, DB erişilemezse 503) |
| `auth.py` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me`, `POST /auth/logout`, `POST /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| `todo.py` | `POST /todos`, `GET /todos` (opsiyonel `?period=` filtresi), `GET /todos/{id}`, `PATCH /todos/{id}`, `DELETE /todos/{id}` — hepsi `get_current_user` ile korunuyor, sorgular her zaman `owner_id == current_user.id` filtresiyle çalışıyor |
| `habit.py` | `POST /habits`, `GET /habits`, `DELETE /habits/{id}`, `GET /habits/{id}/checkins`, `POST /habits/{id}/checkins` (aynı `period_key` ile tekrar çağrılırsa var olanı döner — idempotent), `DELETE /habits/{id}/checkins/{period_key}` — sahiplik `todo.py`'deki aynı desenle kontrol ediliyor |

### `backend/alembic/` — veritabanı migration sistemi

Bkz. `docs/03_veritabani.md` için detaylı anlatım. Kısaca:

| Yol | Ne işe yarar |
|---|---|
| `alembic.ini` | Alembic ayar dosyası. `sqlalchemy.url` bilerek boş — gerçek URL `.env`'den `env.py` içinde okunuyor, secret repoya girmiyor |
| `env.py` | Migration çalıştırılırken hangi veritabanına bağlanılacağını (`app.core.config.settings`) ve hangi modellerin takip edileceğini (`Base.metadata`) tanımlar |
| `versions/` | Her biri bir şema değişikliğini temsil eden migration dosyaları (örn. `..._create_users_table.py`). Sıralı bir zincir oluştururlar (`down_revision` ile) |
| `script.py.mako` | Yeni migration dosyaları üretilirken kullanılan şablon |

### `backend/tests/`

| Dosya | Neyi test ediyor |
|---|---|
| `test_health.py` | `/health` 200 dönüyor mu |
| `test_auth.py` | register/login/`/me`, rate limit, SQL injection, email doğrulama (geçerli/geçersiz token, purpose token'ın access olarak kullanılamaması), logout (eski token'ın geçersizleşmesi), profil güncelleme (yanlış mevcut şifre, şifre değişince eski token'ın düşmesi, email değişince `is_verified`'ın sıfırlanması), şifremi unuttum (var/yok email için aynı cevap), şifre sıfırlama |
| `test_todo.py` | create/list, kısmi güncelleme, silme, **kullanıcı izolasyonu** (başkasının todo'suna erişememe → 404), auth zorunluluğu, boş başlık reddi, SQL injection payload'ının düz metin olarak saklanması, periyot (varsayılan, özel, geçersiz değer reddi, `?period=` ile filtreleme) |
| `test_habit.py` | create/list/silme, varsayılan periyot, kullanıcı izolasyonu (habit ve check-in seviyesinde), auth zorunluluğu, check-in oluşturma/listeleme, aynı periyodu iki kez işaretlemenin idempotent olması, check-in silme ve var olmayanı silmenin 404 dönmesi |
| `conftest.py` | `reset_rate_limiter` (autouse) — her testten önce rate limit sayaçlarını sıfırlar, testler `TestClient`'ın paylaştığı sahte IP yüzünden birbirini etkilemesin diye |

> Not: Testler ayrı bir test veritabanı değil, gerçek geliştirme
> veritabanına karşı çalışıyor (bkz. `docs/04_auth.md` "Bilinen sınırlama").

### `mobile/` — Expo (React Native) projesi

| Yol | Ne işe yarar |
|---|---|
| `App.js` | Giriş noktası — sadece `AppNavigator`'ı render eder |
| `app.json` | Expo proje ayarları (isim, slug, icon, platform ayarları) |
| `package.json` | Bağımlılıklar (`expo`, `react-native`, `@react-navigation/*`) |
| `index.js` | Expo'nun native tarafa uygulamayı kaydettiği dosya (elle değiştirilmez) |
| `assets/` | İkon/splash görselleri |
| `navigation/AppNavigator.js` | `NavigationContainer` + `Stack.Navigator` — `isLoggedIn`'e göre ya `Login`/`Register`, ya da `MainTabs` + `Profile` gösterilir (iki ayrı stack, biri diğerine "geri" ile dönülemez) |
| `navigation/MainTabs.js` | `createBottomTabNavigator` — 4 sekme: Ana Sayfa, Hedefler, Alışkanlıklar, Yapay Zeka. `headerShown: false` — her ekran kendi başlığını `ScreenHeader` ile çiziyor |
| `components/ScreenHeader.js` | Başlık + sağ üstte profil ikonu (basınca `Profile` ekranına gider) — tab ekranlarının ortak başlığı |
| `screens/LoginScreen.js`, `RegisterScreen.js` | Gerçek form (email/şifre), backend hatalarını kullanıcıya gösterir |
| `screens/HomeScreen.js` | Bugünün ilerleme yüzdesi (günlük hedef+alışkanlık tamamlanma oranı), bugünün/haftanın hedef özeti. `useFocusEffect` ile sekmeye her dönüşte yeniden veri çeker (diğer sekmelerdeki değişiklikler yansısın diye) |
| `screens/GoalsScreen.js` | "Hedefler" — üstte periyot chip'leri (günlük/haftalık/aylık/yıllık), arama, ekleme formu, liste (tamamlama/silme) |
| `screens/HabitsScreen.js` | "Alışkanlıklar" — arama, ekleme formu (isim+periyot), her satırda "bu periyot için yaptım" tek dokunuşluk kutucuk |
| `screens/AIScreen.js` | Placeholder ("Yakında") |
| `screens/ProfileScreen.js` | Korumalı `/auth/me` ile kullanıcı bilgisini gösterir, çıkış butonu var |
| `screens/__tests__/` | `LoginScreen.test.js`, `GoalsScreen.test.js` (`jest-expo` + `@testing-library/react-native`) |
| `services/storage.js` | Token'ı `expo-secure-store` ile cihazın şifreli deposunda saklar (`getToken`/`setToken`/`deleteToken`) |
| `services/api.js` | Paylaşılan `axios` instance'ı — `baseURL` `.env`'den (`EXPO_PUBLIC_API_URL`), request interceptor token'ı otomatik `Authorization` header'ına ekler; `getErrorMessage()` backend hata formatını kullanıcıya gösterilecek metne çevirir |
| `services/auth.js` | `register`, `login`, `getCurrentUser`, `logout` — backend `/auth/*`'a ince bir katman |
| `services/todo.js` | `listTodos(period)`, `createTodo`, `updateTodo`, `deleteTodo` — backend `/todos`'a ince bir katman |
| `services/habit.js` | `listHabits`, `createHabit`, `deleteHabit`, `listCheckIns`, `createCheckIn`, `deleteCheckIn` — backend `/habits`'e ince bir katman |
| `services/periods.js` | `currentPeriodKey(period)` — backend'in beklediği `period_key` formatını (günlük/haftalık ISO hafta/aylık) client'ta hesaplar |
| `services/AuthContext.js` | React Context — `isLoggedIn`/`isLoading`/`signIn`/`signOut`; `AppNavigator` hangi stack'i göstereceğine bununla karar verir |
| `.env` / `.env.example` | `EXPO_PUBLIC_API_URL` — backend adresi, koda gömülü değil. `.env` gitignore'da. **Android emülatöründe** `10.0.2.2`, **web'de** `localhost`, **fiziksel cihazda** bilgisayarın LAN IP'si gerekir (bkz. `docs/08b_gelistirme_ortami.md`) |

> Not: `node_modules/` ve `.expo/` gitignore'da; proje klonlandığında
> `cd mobile && npm install` ile bağımlılıklar yeniden kurulur. Testler
> `cd mobile && npm test` ile çalışır.

## Katman kuralı (neden bu ayrım var)

```
routers  → HTTP ile ilgilenir (URL, status code, request/response)
schemas  → veri şeklini/doğrulamasını tanımlar, DB'yi dışarı sızdırmaz
models   → veritabanı şemasını tanımlar
core     → hiçbirine özel olmayan ortak altyapı (config, db bağlantısı, güvenlik)
```

Bir endpoint asla doğrudan `Base` metadata'sını dışarı döndürmez, her zaman
bir şemadan geçer. Bir model asla HTTP'den (status code, header vb.)
haberdar değildir. Bu ayrım sayesinde örn. veritabanı şeması değişse bile
API sözleşmesi (şema) bilinçli olarak güncellenmeden dışarıya sızmaz.

## Aşama ilerledikçe burada değişecekler (öngörü, henüz yok)

- Yapay Zeka sekmesinin kapsamı netleşince: yeni bir backend endpoint'i,
  bir API anahtarı (`.env`), gerçek bir ekran.
- Alışkanlıklar için geçmiş/takvim görünümü (şu an sadece "bu periyot
  için yaptım" var, `HabitCheckIn` kayıtları zaten sorgulanabilir).
