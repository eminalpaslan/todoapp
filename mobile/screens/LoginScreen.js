import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { getErrorMessage } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { login } from '../services/auth';

export default function LoginScreen({ navigation, route }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(route.params?.registeredEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const justRegistered = Boolean(route.params?.registeredEmail);

  async function handleLogin() {
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await login(email, password);
      await signIn(token);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Giriş Yap</Text>

      {justRegistered && (
        <Text style={styles.success}>
          Kayıt başarılı, e-postana bir doğrulama bağlantısı gönderdik. Şimdi
          giriş yapabilirsin.
        </Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="E-posta"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        testID="login-submit"
        style={styles.button}
        onPress={handleLogin}
        disabled={isSubmitting || !email || !password}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Giriş Yap</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Hesabın yok mu? Kayıt ol</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
  },
  success: {
    color: '#16a34a',
    marginBottom: 12,
    textAlign: 'center',
  },
  link: {
    color: '#2563eb',
    textAlign: 'center',
    marginTop: 16,
  },
});
