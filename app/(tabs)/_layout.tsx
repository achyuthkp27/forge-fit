import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Icon, Icons } from '../../components/Icon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#71717A',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Icon name={Icons.home} size={22} color={color} /> }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts', tabBarIcon: ({ color }) => <Icon name={Icons.dumbbell} size={22} color={color} /> }} />
      <Tabs.Screen name="exercises" options={{ title: 'Exercises', tabBarIcon: ({ color }) => <Icon name={Icons.list} size={22} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color }) => <Icon name={Icons.trendingUp} size={22} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#18181B', borderTopColor: '#27272A', borderTopWidth: 1, height: 85, paddingBottom: 25, paddingTop: 10 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});