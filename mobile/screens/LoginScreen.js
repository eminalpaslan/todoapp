import { StyleSheet, Text, View } from 'react-native';

// Gerçek login formu ve API bağlantısı Aşama 8'de eklenecek.
export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giriş Yap</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
