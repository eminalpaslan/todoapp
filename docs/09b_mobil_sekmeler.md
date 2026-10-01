# Aşama 9b — Mobil: Sekme Navigasyonu, Hedefler, Alışkanlıklar

## Ne yapıldı

- `@react-navigation/bottom-tabs` kuruldu. Giriş yapmış kullanıcı artık tek
  bir `TodoListScreen` yerine 4 sekmeli (`MainTabs`) bir yapı görüyor:
  Ana Sayfa, Hedefler, Alışkanlıklar, Yapay Zeka.
- `components/ScreenHeader.js`: başlık + sağ üstte profil ikonu (her
  sekmenin kendi header'ı — tab navigator `headerShown: false`, her ekran
  kendi başlığını çiziyor). Profil ikonuna basınca `AppNavigator`'daki
  `Profile` ekranına gidiliyor (eski `TodoListScreen`'in içeriği buraya
  taşındı: `/auth/me` ile kullanıcı bilgisi + çıkış yap).
- `services/todo.js`, `services/habit.js`: backend'deki `/todos` (period
  filtresiyle) ve `/habits` + `/habits/{id}/checkins` endpoint'lerine
  karşılık gelen ince servis katmanı.
- `services/periods.js`: `currentPeriodKey(period)` — backend'in beklediği
  `period_key` formatını (günlük `"2026-10-01"`, haftalık ISO hafta
  `"2026-W40"`, aylık `"2026-10"`) client'ta hesaplıyor.
- `screens/GoalsScreen.js` ("Hedefler"): üstte periyot chip'leri (Günlük/
  Haftalık/Aylık/Yıllık), sayfa-bazlı arama kutusu, ekleme formu, liste
  (checkbox ile tamamlama, silme).
- `screens/HabitsScreen.js` ("Alışkanlıklar"): arama, ekleme formu (isim +
  periyot), her satırda "bu periyot için yaptım" tek dokunuşluk kutucuk
  (check-in oluşturur/siler).
- `screens/HomeScreen.js` ("Ana Sayfa"): bugünün ilerleme yüzdesi
  (`tamamlanan / toplam` — bugünkü günlük hedefler + günlük
  alışkanlıklar), bugünün hedefleri ve haftalık hedefler özet listesi.
- `screens/AIScreen.js`: placeholder ("Yakında").

## Yol boyunca bulunan ve düzeltilen bir hata

`HomeScreen` ilk sürümde sadece `useEffect` ile mount'ta veri çekiyordu.
React Navigation'ın bottom tab'leri varsayılan olarak ziyaret edilen
ekranları canlı/mount'lu tutuyor — yani Hedefler sekmesinde yeni bir
hedef ekleyip Ana Sayfa'ya dönünce, Ana Sayfa yeniden mount olmadığı için
eski (bayat) veriyi göstermeye devam ediyordu. Android emülatöründe
uçtan uca test ederken bu fark edildi (ilerleme hep `%0 (0/0)`
kalıyordu). Düzeltme: `useEffect` yerine `@react-navigation/native`'in
`useFocusEffect`'i kullanıldı — artık sekmeye her dönüşte veri yeniden
çekiliyor.

## Test

- `screens/__tests__/GoalsScreen.test.js` (yeni): boş periyotta mesaj
  gösterimi, yeni hedef eklemenin backend çağrısı + listeye yansıması
  (CLAUDE.md'nin "todo ekleme" için test zorunluluğu kuralı).
- `npm test` → 5/5 geçti (LoginScreen 3 + GoalsScreen 2).
- **Android emülatöründe uçtan uca manuel doğrulama** (ekran görüntüleriyle
  adım adım izlendi): giriş yap → Ana Sayfa boş durumda doğru render →
  Hedefler sekmesinde "Su iç" (günlük) hedefi oluşturuldu ve işaretlendi
  → Alışkanlıklar sekmesinde "Spor yap" (günlük) alışkanlığı oluşturuldu
  ve check-in yapıldı → Ana Sayfa'ya dönünce **%100 (2/2)** doğru
  gösterildi (`useFocusEffect` düzeltmesinden sonra) → Profil ekranı
  kullanıcı bilgisini gösterdi.
- Bu test sırasında dokunma koordinatlarını ilk denemede yanlış hesapladım
  (ScreenHeader'ın üst boşluğu + boş içerik alanı yüzünden sekme çubuğunun
  ekranda tahmin ettiğimden çok daha aşağıda olduğunu fark etmedim) —
  `uiautomator dump` ile gerçek koordinatları alıp düzelttim. Uygulamanın
  kendisinde bir sorun değildi.

## Değişen/yeni dosyalar

- `navigation/MainTabs.js` (yeni), `navigation/AppNavigator.js` (güncellendi)
- `components/ScreenHeader.js` (yeni)
- `screens/HomeScreen.js`, `GoalsScreen.js`, `HabitsScreen.js`, `AIScreen.js`, `ProfileScreen.js` (yeni)
- `screens/TodoListScreen.js` (silindi — yerini `ProfileScreen` + `HomeScreen` aldı)
- `services/todo.js`, `habit.js`, `periods.js` (yeni)
- `screens/__tests__/GoalsScreen.test.js` (yeni)

## Bilinen sınırlıklar / sonraya bırakılanlar

- Alışkanlık geçmiş/takvim görünümü yok (v1 kapsamı dışında, bkz.
  `docs/09_tasarim_hedefler_aliskanliklar.md`).
- Yapay Zeka sekmesi placeholder.
- `HabitsScreen`'in check-in durumunu yüklerken her alışkanlık için ayrı
  bir `GET /habits/{id}/checkins` isteği atılıyor (N+1) — alışkanlık
  sayısı küçükken sorun değil, çok artarsa backend'de toplu bir endpoint
  gerekebilir.
