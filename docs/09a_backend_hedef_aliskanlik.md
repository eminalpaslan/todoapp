# Aşama 9a — Backend: Hedef Periyotları ve Alışkanlıklar

## Ne yapıldı

- `Todo` modeline `period` alanı eklendi (`daily` / `weekly` / `monthly` /
  `yearly`, varsayılan `daily`). `TodoCreate`/`TodoUpdate`/`TodoResponse`
  şemaları `Period` (Pydantic `Literal`) ile güncellendi — geçersiz bir
  periyot gönderilirse 422 döner.
- `GET /todos?period=weekly` gibi bir query parametresiyle filtreleme
  eklendi (`period` verilmezse hepsi döner, eski davranış korunuyor).
- Yeni `Habit` modeli (`id`, `name`, `period`, `owner_id`, `created_at`)
  ve `HabitCheckIn` modeli (`id`, `habit_id`, `period_key`, `created_at`,
  `(habit_id, period_key)` üzerinde benzersizlik kısıtı).
- Yeni router `app/routers/habit.py`:
  - `POST /habits`, `GET /habits`, `DELETE /habits/{id}`
  - `GET /habits/{id}/checkins`, `POST /habits/{id}/checkins`
    (aynı `period_key` için tekrar çağrılırsa var olanı döner —
    idempotent, "işaretle/kaldır" UI'ı için uygun),
    `DELETE /habits/{id}/checkins/{period_key}`
  - Hepsi `get_current_user` ile korunuyor, sahiplik `_get_owned_habit`
    ile `todo.py`'deki aynı desenle kontrol ediliyor (başkasının
    alışkanlığına erişim → 404).
- Migration: `4edd159a9fd3_add_period_to_todos_add_habits_and_.py`.
  `todos.period` için `server_default='daily'` kullanılıp sonra
  kaldırıldı (var olan satırları doldurmak için — `users` tablosuna
  `is_verified` eklerken kullanılan aynı desen, bkz.
  `9e352ccb5f8c_...py`).

## Neden yapıldı

`docs/09_tasarim_hedefler_aliskanliklar.md`'de kullanıcıyla netleşen
tasarım kararlarının backend tarafı. "Hedefler" kavramı sıfırdan
kurulmadı, var olan Todo CRUD'u genişletildi (period alanı) — Aşama 5'te
yazılan kod, testler, kullanıcı izolasyonu büyük ölçüde aynen kullanıldı.

## Test

- `tests/test_todo.py`'ye 4 yeni test: varsayılan periyot, özel periyotla
  oluşturma, geçersiz periyot reddi, periyot filtresiyle listeleme.
- Yeni `tests/test_habit.py`: oluşturma/listeleme/silme, varsayılan
  periyot, kullanıcı izolasyonu (hem habit hem checkin seviyesinde),
  auth zorunluluğu, check-in oluşturma/listeleme, aynı periyodu iki kez
  işaretlemenin idempotent olması, check-in silme, var olmayan periyodu
  silmenin 404 dönmesi.
- `pytest -q` → **41/41 geçti**.
- Canlı sunucuda (`uvicorn`, port 8001) curl ile de doğrulandı: habit
  oluşturma → check-in → listeleme, ve `period=monthly` filtresiyle
  todo listeleme beklendiği gibi çalıştı.

## Değişen dosyalar

- `app/models/todo.py` (period alanı)
- `app/models/habit.py` (yeni)
- `app/schemas/todo.py` (Period, period alanları)
- `app/schemas/habit.py` (yeni)
- `app/routers/todo.py` (period filtresi)
- `app/routers/habit.py` (yeni)
- `app/main.py` (habit router bağlandı)
- `alembic/env.py` (habit modeli metadata'ya eklendi)
- `alembic/versions/4edd159a9fd3_...py` (yeni migration)
- `tests/test_todo.py`, `tests/test_habit.py` (yeni/güncellendi)

## Sıradaki adım

Mobil: alt sekme navigasyonu (`@react-navigation/bottom-tabs`) ve
Ana Sayfa / Hedefler / Alışkanlıklar / Yapay Zeka (placeholder) ekranları.
