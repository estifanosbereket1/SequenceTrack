import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import WalkthroughModal from '../../src/components/WalkthroughModal';
import { getAppMetaValue, setAppMeta } from '../../src/db/appMeta';

export default function TabLayout() {
  const { colors, typography } = useTheme();
  const [walkthroughVisible, setWalkthroughVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const seen = await getAppMetaValue('walkthrough_seen');
      if (seen !== 'true') {
        setWalkthroughVisible(true);
      }
    })();
  }, []);

  const dismissWalkthrough = async () => {
    setWalkthroughVisible(false);
    await setAppMeta('walkthrough_seen', 'true');
  };

  return (
    <View style={{ flex: 1 }}>
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
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <WalkthroughModal visible={walkthroughVisible} onSkip={dismissWalkthrough} onDone={dismissWalkthrough} />
    </View>
  );
}
