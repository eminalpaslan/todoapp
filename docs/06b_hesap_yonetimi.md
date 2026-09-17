# Aşama 6.5: Hesap Yönetimi ve Health-Check İyileştirmesi

> Orijinal yol haritasında yoktu, kullanıcının isteğiyle Aşama 6 ile 7
> arasına eklendi. Kararlar `AskUserQuestion` ile netleştirildi (aşağıda).

## Alınan kararlar
1. **Email gönderimi:** Mailpit (Docker, `axllent/mailpit`) — local'de
   gerçek bir SMTP hesabı gerektirmez, gönderilen mailler
   `http://localhost:8025` adresinden görülebilir.
2. **Email doğrulama zorunlu değil:** `is_verified` alanı DB'de tutulur
   ama login'i engellemez.
3. **Token mekanizması:** DB'siz, JWT tabanlı — mevcut JWT altyapısı
   `purpose`/`type` alanıyla genişletildi, yeni tablo eklenmedi.
4. **Logout:** `token_version` sayaç yaklaşımı — gerçek iptal sağlıyor
   ama seçici değil (tüm cihazlardan birden çıkış).

## Ne yapıldı

### Veritabanı
- `User` modeline iki alan eklendi: `is_verified` (bool), `token_version`
  (int, varsayılan 0).
- Migration otomatik üretilen haliyle **hatalıydı** — tabloda zaten satır
  olduğu için `NOT NULL` kolonları `server_default` olmadan eklemeye
  çalışıyordu, bu da mevcut satırlarda patlardı. Elle `server_default`
  eklenip sonra kaldırıldı (bkz. migration dosyasındaki yorum).

### JWT altyapısı (`security.py`)
- `create_access_token(user_id, token_version)`: artık payload'da `ver`
  (token_version) ve `type: "access"` de taşıyor.
- `create_purpose_token(user_id, purpose, expires_minutes)` /
  `decode_purpose_token(token, expected_purpose)`: email doğrulama ve
  şifre sıfırlama token'ları için genel amaçlı fonksiyonlar. `type` alanı
  sayesinde bir doğrulama token'ı asla access token yerine kullanılamıyor
  (`test_verify_email_token_cannot_be_used_as_access_token` ile kanıtlandı).
- `deps.py`'deki `get_current_user`, token'ın `ver` alanını kullanıcının
  DB'deki güncel `token_version`'ıyla karşılaştırıyor — uyuşmuyorsa token
  süresi dolmamış olsa bile reddediliyor.

### Yeni endpoint'ler (`routers/auth.py`)
| Endpoint | Ne yapar |
|---|---|
| `PATCH /auth/me` | Email ve/veya şifre günceller. Şifre değişimi mevcut şifre ister; her iki değişiklik de `token_version`'ı artırır (şifre) veya `is_verified`'ı sıfırlayıp yeni doğrulama maili yollar (email) |
| `POST /auth/logout` | `token_version`'ı artırır — o ana kadar üretilmiş tüm token'lar (tüm cihazlar) geçersiz olur |
| `POST /auth/verify-email` | Body'deki token'ı çözer, `is_verified = True` yapar |
| `POST /auth/resend-verification` | Zaten doğrulanmışsa mesaj döner, değilse yeni token'lı mail yollar (5/dk limit) |
| `POST /auth/forgot-password` | Email var/yok fark etmeksizin **aynı** cevabı döner (bilgi sızdırmama), varsa mail yollar (5/dk limit) |
| `POST /auth/reset-password` | Token'ı çözer, yeni şifreyi hash'ler, `token_version`'ı artırır (5/dk limit) |

### Email gönderimi (`core/email.py`)
- `smtplib` (stdlib, ekstra paket yok) ile Mailpit'e gönderiyor.
- `smtplib` senkron/bloklayıcı olduğu için `starlette.concurrency.run_in_threadpool`
  ile ayrı bir thread'de çalıştırılıyor — event loop kilitlenmiyor.
- Gönderim başarısız olursa (`OSError`, örn. Mailpit kapalıysa) hata
  yutuluyor — **kayıt/şifre değişimi email'e bağımlı değil**, sadece
  bildirim gönderilemiyor.

### Health-check (`routers/health.py`)
- Artık `SELECT 1` ile gerçek bir DB sorgusu çalıştırıyor.
- DB erişilemezse `503 Service Unavailable` + `{"status": "degraded",
  "database": "error"}` dönüyor; başarılıysa `200` + `{"status": "ok",
  "database": "ok"}`.

## Neden böyle yapıldı

**JWT tabanlı doğrulama/sıfırlama token'ı — bilinen sınırlama**
Yeni bir DB tablosu (`password_reset_tokens` gibi) eklemek yerine mevcut
JWT altyapısı `purpose` alanıyla genişletildi. Bunun bedeli: token'ı
"kullanıldı" olarak işaretleyemiyoruz — süresi (30 dk / 24 saat) dolana
kadar teorik olarak tekrar kullanılabilir. Linki kimseyle paylaşmadığın
sürece pratik risk düşük; daha üretim-sınıfı bir sistemde tek-kullanımlık
DB'de saklanan token tercih edilirdi.

**`token_version` ile logout — seçici değil**
Tek bir cihazdan çıkış yapıp diğerlerini açık bırakmak (`jti` bazlı
blacklist) gerektirirdi — ekstra bir tablo + temizlik görevi. Bu proje
için "çıkış yap" = "her yerden çıkış yap" kabul edilebilir bir basitlik.

**Email doğrulama login'i engellemiyor**
Mobil geliştirme/deneme akışını kolaylaştırıyor. `is_verified` alanı DB'de
zaten var, ileride "sadece doğrulananlar X yapabilir" kuralı eklemek
tek satırlık bir `if` ile mümkün.

**Şifre/email değişince `token_version` artırılıyor**
Güvenlik best-practice: şifre değiştiğinde (kendi isteğinle veya "şifremi
unuttum" ile) o ana kadar var olan tüm token'lar (çalınmış olabilecekler
dahil) geçersiz kılınmalı.

## Test hızı: email gönderimi testlerde mock'landı
İlk halde test paketi gerçekten Mailpit'e mail gönderiyordu (her
`register` çağrısında), bu da 27 testi ~35 saniyeye çıkarmıştı (öncesinde
~10 saniyeydi). `tests/conftest.py`'ye eklenen `disable_email_sending`
(autouse) fixture'ı, `monkeypatch` ile `app.routers.auth.send_email`'i
hiçbir şey yapmayan bir fonksiyonla değiştiriyor — production kodu hiç
değişmedi, sadece test ortamında gerçek SMTP bağlantısı kurulmuyor. Bu,
süreyi ~20 saniyeye indirdi ve testleri Mailpit'in ayakta olmasından
bağımsız hale getirdi (testler artık container kapalıyken de çalışır).

Kalan ~20 saniye kasıtlı: bcrypt hash'leme (güvenlik için yavaş olması
gerekiyor) ve her sorguda taze bağlantı açan `NullPool` (bkz.
`docs/04_auth.md`) katkı sağlıyor. Bunlara dokunmamaya karar verildi —
production davranışını testte de aynen görmek, ekstra hız kazancından
daha değerli bulundu.

## Nasıl denenir
```
cd backend
docker compose up -d    # Postgres + Mailpit
venv\Scripts\activate
alembic upgrade head
uvicorn app.main:app --reload --port 8001
```
- Gönderilen mailleri görmek için: http://localhost:8025
- `curl -X POST http://localhost:8001/auth/register -H "Content-Type: application/json" -d "{\"email\":\"a@a.com\",\"password\":\"sifre123\"}"`
- Mailpit'teki mailin içindeki token'ı `POST /auth/verify-email` body'sine koy.

## Sıradaki adım
Aşama 7: Mobil uygulama iskeleti.
