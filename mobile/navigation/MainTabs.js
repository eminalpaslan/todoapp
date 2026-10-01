import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import AIScreen from '../screens/AIScreen';
import GoalsScreen from '../screens/GoalsScreen';
import HabitsScreen from '../screens/HabitsScreen';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: '🏠',
  Goals: '🎯',
  Habits: '🔁',
  AI: '✨',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Ana Sayfa' }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ tabBarLabel: 'Hedefler' }} />
      <Tab.Screen
        name="Habits"
        component={HabitsScreen}
        options={{ tabBarLabel: 'Alışkanlıklar' }}
      />
      <Tab.Screen name="AI" component={AIScreen} options={{ tabBarLabel: 'Yapay Zeka' }} />
    </Tab.Navigator>
  );
}
