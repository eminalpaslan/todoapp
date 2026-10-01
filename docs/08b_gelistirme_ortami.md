# Ek — Mobil Uygulamayı Görsel Olarak Çalıştırma

Aşama 8 sonrası, ekranları gerçek bir cihaz/emülatörde görmek için iki yol
kuruldu. İkisi de birbirini dışlamaz.

## 1. Android emülatörü (bu bilgisayarda)

Bilgisayarda zaten kurulu olan Android Studio'nun SDK'sı kullanılarak bir
sanal cihaz (AVD) oluşturuldu:

- Ad: `todo_pixel`, Pixel 5 profili, Android 11 (API 30, `google_apis_playstore/x86`)
- Konum: `%USERPROFILE%\.android\avd\todo_pixel.avd`
- Ekstra bir Android sistem imajı indirilmedi — bilgisayarda zaten var olan
  imaj kullanıldı.

**Çalıştırmak için:**
```
# Emulator'u baslat (Android Studio > Device Manager'dan da acilabilir)
%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe -avd todo_pixel

# Baska bir terminalde
cd mobile
npx expo start --android
```

**Önemli:** Android emülatöründen bilgisayarın kendisine (`localhost`) değil,
emülatörün host'u görmek için ayırdığı özel adres olan `10.0.2.2` ile
erişilir. `mobile/.env` dosyasındaki `EXPO_PUBLIC_API_URL` değeri bu yüzden
emülatörde test ederken `http://10.0.2.2:8001` olmalı — repodaki varsayılan
(`localhost`) web içindir. Değer değiştikten sonra Metro'nun yeniden
başlatılması gerekir (env değişkenleri bundle'a başlangıçta gömülüyor).

## 2. Expo Go (fiziksel telefon)

- Telefona Play Store / App Store'dan **Expo Go** uygulaması kurulur.
- Telefon ve bilgisayar aynı WiFi ağında olmalı.
- `mobile/.env` içindeki `EXPO_PUBLIC_API_URL`, bilgisayarın yerel ağ
  IP'sine ayarlanır (örn. `http://192.168.2.102:8001` — IP'yi `ipconfig`
  ile öğrenebilirsin, Windows'ta genelde "IPv4 Address" satırı).
- `cd mobile && npx expo start` çalıştırılır, terminalde çıkan QR kod
  Expo Go ile okutulur.

## Doğrulanan akış

Android emülatöründe görsel olarak: Login ekranı → "Kayıt ol" linkiyle
Register ekranına geçiş → Login'e dönüp kayıtlı kullanıcıyla giriş →
otomatik olarak TodoList ekranına geçiş (backend'den gelen gerçek email
ve `is_verified` bilgisiyle) → Çıkış Yap → Login ekranına geri dönüş.
Tüm adımlar backend'e (Docker Postgres + uvicorn) gerçekten bağlanarak
çalıştı.

## Yol boyunca bulunan ve düzeltilen bir detay

İlk otomatik testte (adb ile koordinat bazlı dokunma) alanların klavye
açılınca yer değiştirdiğini fark ettim. Gerçek bir kullanıcı için bu bir
hata değil — Android `justifyContent: 'center'` olan bir container'da
klavye açılınca içerik normal şekilde yukarı kayıyor, kullanıcı bunu
görüp doğru yere dokunabiliyor. Ama iOS'ta aynı otomatik kayma
olmuyor ve input'lar klavyenin arkasında kalabiliyor; bu yüzden
`LoginScreen`/`RegisterScreen`'e `KeyboardAvoidingView` (sadece iOS'ta
`behavior="padding"`) eklendi — standart React Native pratiği.
