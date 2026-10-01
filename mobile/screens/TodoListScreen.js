import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../services/AuthContext';
import { getCurrentUser, logout } from '../services/auth';

// Todo listesinin kendisi (CRUD, API'den cekme) Asama 9'da eklenecek.
// Burada sadece token'in gercekten gectigini (korumali /auth/me) ve
// cikis akisini dogrulamak icin kullanici bilgisi gosteriliyor.
export default function TodoListScreen() {
  const { signOut } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      await signOut();
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo Listem</Text>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.subtitle}>
          {user?.email}
          {user && !user.is_verified ? ' (e-posta doğrulanmadı)' : ''}
        </Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#555',
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
