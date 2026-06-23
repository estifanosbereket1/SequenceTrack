import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const { colors, typography } = useTheme();

  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: colors.bg.paper },
      headerTintColor: colors.text.ink,
      headerShadowVisible: false,
      tabBarStyle: {
        backgroundColor: colors.bg.card,
        borderTopColor: colors.border,
        borderTopWidth: 0.5,
      },
      tabBarActiveTintColor: colors.accent.clay,
      tabBarInactiveTintColor: colors.text.muted,
      tabBarLabelStyle: { ...typography.tab, fontFamily: undefined },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Templates',
          tabBarLabel: 'Templates',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarLabel: 'Reminders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="learnings"
        options={{
          title: 'Learnings',
          tabBarLabel: 'Learnings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
