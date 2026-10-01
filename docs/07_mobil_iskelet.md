# Aşama 7 — Mobil Uygulama İskeleti

## Ne yapıldı

- `mobile/` klasörü içine Expo projesi kuruldu (`create-expo-app`, blank
  template). Daha önce sadece `.gitkeep` ile duran `screens/`, `components/`,
  `navigation/`, `services/` klasörleri korunarak, üretilen dosyalar
  (`App.js`, `app.json`, `index.js`, `assets/`, `package.json`) bu yapının
  üzerine eklendi.
- `package.json` / `app.json` içindeki geçici proje adı `todo-mobile` olarak
  düzeltildi.
- Navigasyon için `@react-navigation/native` ve
  `@react-navigation/native-stack` kuruldu (`react-native-screens`,
  `react-native-safe-area-context` ile birlikte, `npx expo install` ile —
  Expo SDK'sına uyumlu versiyonları garantiliyor).
- `navigation/AppNavigator.js`: `NavigationContainer` + `Stack.Navigator`,
  üç ekran arasında geçiş: `Login`, `Register`, `TodoList`.
- `screens/LoginScreen.js`, `RegisterScreen.js`, `TodoListScreen.js`:
  şimdilik sadece başlık gösteren placeholder ekranlar.
- `App.js`, Expo'nun varsayılan örnek içeriği yerine `AppNavigator`'ı
  render edecek şekilde güncellendi.
- `mobile/.gitignore`, Expo'nun kendi ürettiği (daha kapsamlı) `.gitignore`
  içeriğiyle birleştirildi; `.env` açıkça eklendi (CLAUDE.md güvenlik kuralı).
- Web desteği için `react-dom` ve `react-native-web` eklendi — bu sadece
  tarayıcıda hızlı test edebilmek için (`npm run web`), mobil build'i
  (Android/iOS) etkilemiyor.

## Neden yapıldı

Yol haritasının (`00_yol_haritasi.md`) Aşama 7 kapsamı: Expo kurulumu,
navigasyon yapısı, klasör mimarisi. Henüz login/register/todo'nun gerçek
mantığı (API çağrısı, state) yok — bunlar Aşama 8 (API bağlantısı) ve
Aşama 9'da (Todo ekranları) eklenecek. Bu aşamanın amacı sadece "ekranlar
arası gezinebiliyor muyuz" iskeletini kurmaktı.

## Test

`npx expo start --web` ile Metro bundler başlatıldı, `/index.bundle`
endpoint'i çekilerek derleme doğrulandı: `Web Bundled` — 491 modül, hata
yok. Gerçek cihaz/emülatör testi yapılmadı (Android Studio/Xcode kurulu
değil); bu proje tipi için şimdilik web bundle derlemesi yeterli kabul
edildi.

## Değişen dosyalar

- `mobile/App.js` (yeni/değiştirildi)
- `mobile/app.json`, `mobile/package.json`, `mobile/package-lock.json` (yeni)
- `mobile/index.js`, `mobile/assets/` (yeni, Expo üretti)
- `mobile/navigation/AppNavigator.js` (yeni)
- `mobile/screens/LoginScreen.js`, `RegisterScreen.js`, `TodoListScreen.js` (yeni)
- `mobile/.gitignore` (güncellendi)

## Bilinen sınırlama

- `components/` ve `services/` klasörleri hâlâ boş (`.gitkeep` ile) —
  Aşama 8'de `services/` içine API çağrı fonksiyonları, Aşama 9'da
  `components/` içine paylaşılan UI parçaları eklenecek.
- Gerçek cihaz/emülatörde (Expo Go) henüz test edilmedi, sadece web
  bundle derlemesiyle doğrulandı.
