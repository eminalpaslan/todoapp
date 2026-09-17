# Aşama 6: Güvenlik Katmanı

## Ne yapıldı
- **Rate limiting**: `slowapi` kütüphanesi eklendi (bellek-içi, IP bazlı).
  `app/core/limiter.py`'de paylaşılan bir `Limiter` tanımlandı:
  - Genel varsayılan: her endpoint için `60/minute` (IP başına).
  - `/auth/register` ve `/auth/login`: ek olarak `5/minute` (brute-force /
    spam kayıt koruması). 6. denemede `429 Too Many Requests` dönüyor.
- **CORS sıkılaştırma**: `allow_methods` ve `allow_headers` artık `*`
  değil, gerçekten kullanılan değerlere (`GET, POST, PATCH, DELETE` /
  `Authorization, Content-Type`) daraltıldı. `allow_origins` zaten
  Aşama 2'den beri spesifikti.
- **Input validation sıkılaştırma** (Pydantic `Field` ile):
  - `UserCreate.password`: `min_length=8`, `max_length=72` (bcrypt 72
    bayttan uzun şifreleri desteklemiyor, sınır bilinçli seçildi).
  - `UserCreate`/`UserLogin.email`: `max_length=255` (DB kolonuyla eşleşiyor,
    aşırı uzun email 500 hatası yerine temiz bir 422 döner).
  - `TodoCreate`/`TodoUpdate.title`: `min_length=1, max_length=255` — boş
    başlık artık kabul edilmiyor.
  - `TodoCreate`/`TodoUpdate.description`: `max_length=2000`.
- **SQL injection koruması doğrulandı** (yeni bir kod değişikliği değil,
  zaten ORM sayesinde vardı — testle kanıtlandı):
  - `test_login_sql_injection_payload_is_rejected_safely`: `' OR '1'='1'`
    gibi bir payload, `EmailStr` formatı geçersiz olduğu için veritabanına
    hiç ulaşmadan 422 ile reddediliyor.
  - `test_title_with_sql_injection_payload_is_stored_as_plain_text`: todo
    başlığına `Robert'); DROP TABLE todos;--` yazılıp, tablonun hâlâ ayakta
    olduğu (bir sonraki `GET /todos`'un çalıştığı) doğrulandı. SQLAlchemy
    her zaman parametreli sorgu ürettiği için gönderilen metin asla SQL
    komutu olarak yorumlanmıyor.
- `backend/tests/conftest.py`: `reset_rate_limiter` fixture'ı — her testten
  önce rate limit sayaçlarını sıfırlar (bkz. aşağıda "Neden").
- Toplam 5 yeni test eklendi (16/16 geçiyor).

## Neden böyle yapıldı

**Rate limiting'in yeri: middleware + belirli endpoint'lerde ekstra sıkı**
Genel `60/minute` taban, tüm API'yi kaba kuvvet trafiğe karşı korur.
`/auth/*` özelinde daha sıkı `5/minute` eklendi çünkü şifre tahmin etme
(brute-force) ve otomatik spam kayıt saldırıları en çok bu iki uçtan gelir.

**Bellek-içi (in-memory), Redis değil**
Tek sunucu instance'ı çalışan bu projede Redis gibi ek bir servise gerek
yok — sunucu yeniden başlarsa sayaçlar sıfırlanır, bu kabul edilebilir bir
bedel. Birden fazla sunucu instance'ı (yatay ölçekleme) olsaydı Redis
gerekirdi çünkü her instance'ın kendi belleği ayrı olur, limit paylaşılmaz.

**`conftest.py`'de rate limit sıfırlama neden gerekli**
`TestClient` tüm testlerde aynı sahte IP'yi kullanıyor. Rate limiting IP
bazlı çalıştığı için, sıfırlama olmadan testler birbirinin sayacını
paylaşır ve ilgisiz bir test rate limit'e takılıp yanlış sebeple başarısız
olabilirdi. `autouse=True` fixture, her test fonksiyonundan önce otomatik
çalışıp sayaçları temizliyor — testler birbirinden bağımsız kalıyor.

**Şifre `max_length=72`**
bcrypt algoritması, 72 bayttan uzun şifrelerin fazlasını sessizce
görmezden gelir (ya da bazı sürümlerde hata fırlatır). Kullanıcıya "şifren
72 karakterden uzun olamaz" demek, sessizce kırpılan bir şifre yerine
net bir hata vermek için tercih edildi.

**SQL injection için yeni kod değil, kanıt (test) eklendi**
CLAUDE.md zaten "kullanıcı girdisi doğrudan SQL sorgusuna gömülmez (ORM
kullan)" diyor ve bu Aşama 3'ten beri (SQLAlchemy ORM ile) sağlanıyordu.
Burada yapılan, bunu varsayım olarak bırakmayıp bir testle **kanıtlamak**.

## Nasıl denenir
```
cd backend
docker compose up -d
venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
```
```
# 6. istekte 429 gormelisin
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "Deneme $i: %{http_code}\n" -X POST http://localhost:8001/auth/login -H "Content-Type: application/json" -d "{\"email\":\"a@a.com\",\"password\":\"sifre123\"}"
done
```

## Sıradaki adım
Aşama 7: Mobil uygulama iskeleti — Expo projesi kurulumu, navigasyon
yapısı (React Navigation), klasör mimarisi.
