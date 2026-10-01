import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TodoListScreen from '../screens/TodoListScreen';
import { useAuth } from '../services/AuthContext';

const Stack = createNativeStackNavigator();

// isLoggedIn'e gore iki ayri stack'ten biri gosterilir - cikis yapmis bir
// kullanici TodoList ekranina, token'i olmayan biri Login/Register'a asla
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
          <Stack.Screen
            name="TodoList"
            component={TodoListScreen}
            options={{ title: 'Todo Listem' }}
          />
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
