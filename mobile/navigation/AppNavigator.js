import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TodoListScreen from '../screens/TodoListScreen';

const Stack = createNativeStackNavigator();

// Şimdilik başlangıç ekranı Login; Aşama 8'de token kontrolüyle
// kullanıcı zaten girişliyse doğrudan TodoList'e yönlendirme eklenecek.
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Kayıt Ol' }} />
        <Stack.Screen name="TodoList" component={TodoListScreen} options={{ title: 'Todo Listem' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
