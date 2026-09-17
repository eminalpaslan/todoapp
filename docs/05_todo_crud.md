# Aşama 5: To-Do CRUD API

## Ne yapıldı
- `app/models/todo.py`: `Todo` tablosu — `id`, `title`, `description`
  (opsiyonel), `is_done`, `owner_id` (`users.id`'ye foreign key, index'li),
  `created_at`.
- Migration üretilip uygulandı (`create todos table`).
- `app/schemas/todo.py`: `TodoCreate`, `TodoUpdate` (tüm alanlar opsiyonel —
  kısmi güncelleme için), `TodoResponse`.
- `app/routers/todo.py`:
  - `POST /todos` — yeni todo oluşturur (`owner_id` = giriş yapmış kullanıcı)
  - `GET /todos` — sadece giriş yapmış kullanıcının todo'larını listeler
  - `GET /todos/{id}` — tek todo getirir
  - `PATCH /todos/{id}` — kısmi günceller (örn. sadece `is_done`)
  - `DELETE /todos/{id}` — siler (204 No Content)
  - Hepsi `get_current_user` dependency'siyle korunuyor.
- `backend/tests/test_todo.py`: create/list, partial update, delete,
  **kullanıcı izolasyonu** (başka kullanıcının todo'suna erişememe),
  auth zorunluluğu testleri (5 test).

## Neden böyle yapıldı

**`_get_owned_todo` yardımcı fonksiyonu**
`get`, `patch`, `delete` endpoint'lerinin üçü de "bu todo var mı VE bana mı
ait" kontrolünü yapıyor. Bunu tek bir yerde toplamak, aynı güvenlik
kontrolünü üç kez yazıp birini unutma riskini ortadan kaldırıyor.

**404, 403 değil**
Bir kullanıcı başka birinin todo id'sini tahmin edip istek atarsa `403
Forbidden` yerine `404 Not Found` dönüyoruz. `403` "bu kaynak var ama sana
yasak" der — yani o id'nin var olduğunu (başkasına ait bir todo olduğunu)
sızdırır. `404` "böyle bir şey yok" der, saldırgana hiçbir bilgi vermez.
Sorgu zaten `WHERE id = ? AND owner_id = ?` şeklinde, başkasının todo'su
zaten sonuçta hiç görünmüyor — kod seviyesinde "yasaklamıyoruz", "bulamıyoruz".

**PATCH, PUT değil**
Mobil uygulamada en sık senaryo "sadece işaretle/işareti kaldır"
(`is_done` değiştir) olacak. `PUT` tüm alanların gönderilmesini
gerektirirdi; `PATCH` + `exclude_unset=True` sayesinde sadece
gönderilen alan güncelleniyor, geri kalanı olduğu gibi kalıyor.

**`TodoResponse`'ta `owner_id` yok**
Cevap zaten her zaman "giriş yapmış kullanıcının kendi verisi" — bu bilgiyi
tekrar dışarı vermenin bir faydası yok, gereksiz veri sızdırmamak için
şemaya hiç eklenmedi.

## Manuel test (yapıldı, sonuç doğrulandı)
İki farklı kullanıcı (A, B) ile: A todo oluşturdu, listeledi, güncelledi;
B, A'nın todo'sunu görmeye çalıştığında 404 aldı ve kendi listesi boştu;
A todo'yu sildi, tekrar istediğinde 404 aldı; token'sız istek 401 döndü.

## Nasıl denenir
```
cd backend
docker compose up -d
venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
```
```
TOKEN=<login'den alinan access_token>
curl -X POST http://localhost:8001/todos -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Sut al\"}"
curl http://localhost:8001/todos -H "Authorization: Bearer $TOKEN"
curl -X PATCH http://localhost:8001/todos/1 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"is_done\":true}"
curl -X DELETE http://localhost:8001/todos/1 -H "Authorization: Bearer $TOKEN"
```

## Sıradaki adım
Aşama 6: Güvenlik katmanı — CORS'un gözden geçirilmesi, rate limiting,
ek input validation.
