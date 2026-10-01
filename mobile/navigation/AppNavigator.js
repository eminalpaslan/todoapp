import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { useAuth } from '../services/AuthContext';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

// isLoggedIn'e gore iki ayri stack'ten biri gosterilir - cikis yapmis bir
// kullanici MainTabs'a, token'i olmayan biri Login/Register'a asla
// "geri" tusuyla gecemez, cunku o ekranlar navigator agacinda hic yok.
export default function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Kayıt Ol' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
