# Aşama 2: Backend İskeleti

## Ne yapıldı
- `backend/venv` altında Python sanal ortamı oluşturuldu.
- `fastapi`, `uvicorn`, `pydantic-settings`, `pytest`, `httpx` paketleri kuruldu
  ve `backend/requirements.txt` olarak dondu (freeze) edildi.
- `app/core/config.py`: `.env` dosyasından ayarları okuyan `Settings` sınıfı
  eklendi (şimdilik sadece app adı ve CORS origin listesi).
- `app/routers/health.py`: `GET /health` endpoint'i, `{"status": "ok"}` döner.
- `app/main.py`: FastAPI uygulaması oluşturuldu, CORS sadece local mobil
  geliştirme portlarına (`localhost:8081`, `localhost:19006`) açıldı, health
  router'ı bağlandı.
- `backend/pytest.ini` ve `backend/tests/test_health.py`: `/health`
  endpoint'inin 200 döndüğünü doğrulayan test eklendi.
- Artık dolu oldukları için `app/core/.gitkeep` ve `app/routers/.gitkeep`
  silindi.

## Neden böyle yapıldı

**Sanal ortam**
Paketler sisteme değil projeye özel kurulursa, başka projelerle versiyon
çakışması yaşanmaz. `venv/` klasörü `.gitignore`'da olduğu için repoya
girmiyor; `requirements.txt` sayesinde başka biri `pip install -r
requirements.txt` ile aynı ortamı kurabilir.

**Settings sınıfı, düz değer değil**
`.env` içeriğini kod içinde elle okumak yerine `pydantic-settings`
kullanmak, hem tip kontrolü sağlıyor hem de gizli değerlerin kod içine
sızmasını engelliyor (CLAUDE.md güvenlik kuralı). Şu an sadece kullanılan
alanlar (app adı, CORS origin) eklendi; DB ve JWT ayarları Aşama 3-4'te,
gerçekten kullanılacakları zaman eklenecek.

**CORS'ta `*` yerine belirli origin'ler**
Expo'nun local geliştirme sunucusu genelde `19006` (web) veya `8081`
portunda çalışır. Bu adresleri açık yazmak, production'da yanlışlıkla
her yere açık bir API bırakma riskini baştan ortadan kaldırıyor.

**Health-check endpoint**
Gerçek bir iş yapmıyor ama sunucunun ayakta olduğunu ve deploy'un
başarılı olduğunu hızlıca doğrulamak için standart bir pratik.

**8000 portu değil 8001**
Bu Windows makinesinde 8000 portu sistem tarafından ayrılmış
(`WinError` ile bağlanma reddedildi), bu yüzden geliştirme sırasında
`--port 8001` kullanıldı.

## Nasıl çalıştırılır
```
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
```
Test etmek için: `http://localhost:8001/health`

## Testler
```
cd backend
venv\Scripts\activate
pytest -v
```

## Sıradaki adım
Aşama 3: Veritabanı — PostgreSQL kurulumu, SQLAlchemy modelleri, Alembic
migration sistemi.
