# Aşama 8 — Mobil API Bağlantısı

## Ne yapıldı

- `mobile/services/storage.js`: Token'ı `expo-secure-store` ile cihazın
  şifreli depolama alanında saklar (düz metin `AsyncStorage` değil).
- `mobile/services/api.js`: Ortak `axios` instance'ı. `baseURL`,
  `EXPO_PUBLIC_API_URL` ortam değişkeninden okunuyor (koda gömülü değil).
  Request interceptor, saklanan token'ı varsa her isteğe otomatik
  `Authorization: Bearer ...` header'ı olarak ekliyor. `getErrorMessage()`
  backend'in iki hata formatını (`HTTPException` → `{"detail": "..."}` ve
  Pydantic validasyon hatası → `{"detail": [{"msg": "..."}]}`) kullanıcıya
  gösterilecek tek bir metne çeviriyor.
- `mobile/services/auth.js`: `register`, `login`, `getCurrentUser`, `logout`
  — backend'deki `/auth/*` endpoint'lerine karşılık gelen ince bir katman.
- `mobile/services/AuthContext.js`: React Context ile basit auth durumu
  (`isLoggedIn`, `isLoading`, `signIn`, `signOut`). Uygulama açılışında
  saklanan token kontrol edilir; `AppNavigator` bu duruma göre ya
  Login/Register stack'ini ya da TodoList stack'ini gösterir — kullanıcı
  "geri" tuşuyla girişli haldeyken Login ekranına dönemez, çünkü o ekran
  navigator ağacında hiç yok.
- `LoginScreen` ve `RegisterScreen`: gerçek form (email/şifre), backend
  hatalarını (örn. "E-posta veya şifre hatalı", "Bu e-posta ile kayıtlı
  kullanıcı zaten var") kullanıcıya gösteriyor. Kayıt başarılı olunca
  Login ekranına e-posta önceden doldurulmuş şekilde yönlendiriliyor.
- `TodoListScreen`: girişin gerçekten çalıştığını doğrulamak için korumalı
  `/auth/me` çağrısıyla kullanıcı bilgisini gösteriyor, çıkış butonu
  backend `/auth/logout`'u çağırıp (token_version'ı artırıp o cihazdaki
  token'ı geçersizleştirip) sonra yerel token'ı siliyor.
- `mobile/.env` / `.env.example`: `EXPO_PUBLIC_API_URL` — backend'in dev
  ortamdaki adresi (`http://localhost:8001`). Expo, `EXPO_PUBLIC_` önekli
  değişkenleri otomatik yükler, ekstra bir kütüphane gerekmedi.
- Test altyapısı: `jest-expo` + `@testing-library/react-native` kuruldu
  (CLAUDE.md "kritik ekranlar için temel test yazılır" kuralı).
  `screens/__tests__/LoginScreen.test.js`: boş formda butonun devre dışı
  olması, başarılı girişte token'ın saklanması, başarısız girişte hata
  mesajının gösterilmesi test edildi.

## Güvenlikle ilgili kararlar

- Token `expo-secure-store` ile saklanıyor (iOS Keychain / Android
  Keystore üzerinden), düz `AsyncStorage` kullanılmadı — cihaz ele
  geçirilse bile token'a düz metin olarak erişilemiyor.
- API adresi (`EXPO_PUBLIC_API_URL`) koda gömülmek yerine `.env`'den
  okunuyor; `.env` gitignore'da, `.env.example` gerçek değer olmadan
  repoya giriyor (backend'deki aynı desen).
- Logout, backend'de `token_version`'ı artırarak o kullanıcının **tüm**
  eski token'larını geçersiz kılıyor; mobil taraf sadece kendi yerel
  token'ını siliyor, gerçek "iptal" backend'de oluyor.

## Neden yapıldı

Yol haritasının (`00_yol_haritasi.md`) Aşama 8 kapsamı. Aşama 7'de kurulan
boş ekranlar artık gerçek backend'e bağlı; bir kullanıcı gerçekten kayıt
olup giriş yapabiliyor ve bu oturum cihaza kalıcı olarak kaydediliyor.

## Test

1. **Otomatik test**: `cd mobile && npm test` → 3/3 geçti.
2. **Backend entegrasyonu (curl)**: Docker ile Postgres/Mailpit, `uvicorn`
   ile backend ayağa kaldırılıp register → login → `/auth/me` → logout →
   eski token ile `/auth/me` (401 bekleniyor) akışı doğrulandı — hepsi
   beklendiği gibi çalıştı.
3. **Mobil bundle**: `npx expo start --web` ile Metro bundler'ın yeni
   servis/ekran kodunu hatasız derlediği (`Web Bundled`, 555 modül)
   doğrulandı; `.env`'deki `EXPO_PUBLIC_API_URL`'in otomatik yüklendiği
   log'da görüldü.

**Bilinen sınırlama**: Gerçek bir tarayıcıda/Expo Go'da uçtan uca
tıklanarak test edilmedi (bu ortamda görsel bir tarayıcı/emülatör
etkileşimi yok) — sadece backend'in curl ile ve mobil tarafın bundle
derlemesi + birim testleriyle doğrulanabildi. Gerçek cihazda ilk
denemede önce `mobile/.env` içindeki adresin bilgisayarın LAN IP'siyle
güncellenmesi gerekir (bkz. `.env.example`'daki not).

## Değişen dosyalar

- `mobile/services/storage.js`, `api.js`, `auth.js`, `AuthContext.js` (yeni)
- `mobile/screens/LoginScreen.js`, `RegisterScreen.js`, `TodoListScreen.js` (güncellendi)
- `mobile/navigation/AppNavigator.js` (güncellendi — auth durumuna göre dallanma)
- `mobile/App.js` (güncellendi — `AuthProvider` eklendi)
- `mobile/.env`, `.env.example` (yeni)
- `mobile/screens/__tests__/LoginScreen.test.js` (yeni)
- `mobile/package.json` (test script'i, `jest` config'i, yeni bağımlılıklar)
