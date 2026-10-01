import { StyleSheet, Text, View } from 'react-native';

import ScreenHeader from '../components/ScreenHeader';

// Kapsamı henüz netleşmedi (bkz. docs/09_tasarim_hedefler_aliskanliklar.md) -
// bir API anahtarı ve per-call maliyet gerektirdiği için ayrı bir aşamada ele alınacak.
export default function AIScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Yapay Zeka" />
      <View style={styles.content}>
        <Text style={styles.text}>Yakında</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, color: '#94a3b8' },
});
