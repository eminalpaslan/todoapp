import { StatusBar } from 'expo-status-bar';

import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './services/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
