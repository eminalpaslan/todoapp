import { StyleSheet, Text, View } from 'react-native';

// Gerçek todo listesi ve API bağlantısı Aşama 9'da eklenecek.
export default function TodoListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo Listem</Text>
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
