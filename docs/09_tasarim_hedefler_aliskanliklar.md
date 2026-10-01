# Aşama 9 — Tasarım: Hedefler, Alışkanlıklar, Sekme Yapısı

> Bu dosya, kullanıcıyla yapılan tasarım görüşmesinin kararlarını ve
> bundan sonraki alt-aşamaların planını içerir. Uygulama artık sade bir
> "to-do list" olmaktan çıkıp hedef takibi + alışkanlık takibi içeren bir
> kişisel üretkenlik uygulamasına dönüşüyor.

## Sekme yapısı (mobil, alt tab bar)

4 sekme + sağ üstte profil butonu (sekme değil, her ekranın header'ında):

1. **Ana Sayfa** — genel ilerleme yüzdesi (bugünün hedef+alışkanlık
   tamamlanma oranı) + bugünün hedef/alışkanlık özetinin hızlı görünümü.
2. **Hedefler** — tek sayfa, üstte periyot seçme kutucukları (Bugün / Bu
   Hafta / Bu Ay / Bu Yıl). Seçilen periyoda göre liste filtrelenir. Yeni
   hedef eklerken periyot seçilir. Sayfanın üstünde arama/filtre kutusu
   var (sayfa bazlı arama — bkz. aşağıda).
3. **Alışkanlıklar** — her alışkanlık bir satır. Satırda "bu periyot için
   yaptım" kutucuğu (tek dokunuş, anlık işaretleme). Periyot (günlük/
   haftalık/aylık) alışkanlık oluşturulurken seçilir.
4. **Yapay Zeka** — şimdilik **placeholder** ("Yakında"). Kapsamı
   (sohbet mi, öneri mi, özet mi), bir API anahtarı gerektirmesi ve
   per-call maliyeti nedeniyle ayrı bir aşamada netleştirilip
   kurulacak.

**Profil/Ayarlar**: her sekmenin header'ında sağ üstte bir ikon —
zaten var olan `/auth/me`, `/auth/me` PATCH, `/auth/logout`
endpoint'lerine bağlanacak, yeni backend işi gerekmiyor.

## Netleşen kararlar

- **Hedefler = var olan Todo kavramının genişletilmesi.** Sıfırdan yeni
  bir backend kavramı kurmak yerine, mevcut `Todo` modeline bir `period`
  alanı eklenir (`daily` / `weekly` / `monthly` / `yearly`). Aşama 5'teki
  CRUD endpoint'leri (`/todos`) büyük ölçüde aynen kullanılır, sadece
  listelemeye periyot filtresi eklenir. **v1 kapsamı**: periyot sadece
  kullanıcının elle seçtiği bir sınıflandırma etiketidir — "bugünün
  hedefi" gece yarısı otomatik sıfırlanmaz/kaybolmaz, bu tür tarih
  bazlı otomasyon sonraki bir iyileştirme.
- **Alışkanlıklar yeni bir kavram**, Todo'dan ayrı: `Habit` (isim,
  periyot) + `HabitCheckIn` (hangi periyot için işaretlendiği,
  `period_key` ile — örn. günlük için `"2026-10-01"`, haftalık için
  `"2026-W40"`, aylık için `"2026-10"`). Bu `period_key` yaklaşımı,
  ileride (v1 sonrası) her alışkanlık için geçmiş/takvim görünümü
  eklemeyi de kolaylaştırıyor (tüm check-in'ler zaten sorgulanabilir).
- **Alışkanlık detay/geçmiş görünümü v1'de yok.** Listede sadece
  "bu periyot için yaptım" tek dokunuşluk kutucuk var. Geçmiş takvimi
  sonraki bir iyileştirme olarak bırakıldı.
- **Arama sayfa bazlı**, genel/uygulama geneli değil. Her sekme kendi
  içeriğine göre kendi arama kutusunu barındırır.
- **Genel ilerleme yüzdesi** (v1): bugün için planlanan hedef + alışkanlık
  sayısı içinde tamamlanan oranı. Daha karmaşık ağırlıklı skorlar
  (haftalık/aylık karışık) sonraki bir iyileştirme.
- **Yapay zeka şimdilik yok**, sadece navigasyonda yer tutuyor.

## Backend değişiklikleri (bu aşamada yapılacak)

- `Todo` modeline `period: str` alanı (`daily` varsayılan), migration.
- `GET /todos?period=weekly` gibi bir query parametresiyle filtreleme.
- Yeni `Habit` modeli: `id`, `name`, `period`, `owner_id`, `created_at`.
- Yeni `HabitCheckIn` modeli: `id`, `habit_id` (FK), `period_key`,
  `created_at`. Benzersizlik: `(habit_id, period_key)` — aynı periyot
  için iki kez işaretlenemez (idempotent toggle).
- Yeni router `app/routers/habit.py`: `/habits` CRUD (create/list/delete)
  + `/habits/{id}/checkins` (list/create/delete-by-period_key).
- Her yeni endpoint için pytest testi (CLAUDE.md kuralı).

## Mobil değişiklikleri (bu aşamadan sonraki adımlar)

- Navigasyon: `Stack.Navigator` yerine, girişten sonraki ana akış
  `@react-navigation/bottom-tabs` ile 4 sekmeye dönüşür (Login/Register
  stack'i aynen kalır, TodoList ekranı yerini bu tab navigator'a bırakır).
- `services/todo.js` → periyot filtresi destekleyecek şekilde genişler
  (fonksiyon adı `todo` kalıyor, kavramsal olarak "hedef" UI'da
  kullanılacak).
- `services/habit.js` (yeni) — habit CRUD + checkin toggle çağrıları.
- Ekranlar: `HomeScreen`, `GoalsScreen` (periyot chip'leri), `HabitsScreen`,
  `AIScreen` (placeholder), `ProfileScreen`.

## Sıradaki adım

Backend: `period` alanı + `Habit`/`HabitCheckIn` modelleri ve
endpoint'leri (bu oturumda yapılıyor) → ardından mobil tab navigasyonu
ve ekranlar.
