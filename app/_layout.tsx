import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { TemplateProvider } from '../src/context/TemplateContext';
import { InstanceProvider } from '../src/context/InstanceContext';
import { ReminderProvider } from '../src/context/ReminderContext';
import { LearningProvider } from '../src/context/LearningContext';
import { AlertProvider } from '../src/context/AlertContext';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { getDb } from '../src/db/database';

function DbInitGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    getDb().then(() => setReady(true)).catch(console.error);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.paper }}>
        <ActivityIndicator size="large" color={colors.accent.clay} />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutInner() {
  const { colors, colorScheme } = useTheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: colors.bg.paper },
        headerTintColor: colors.text.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg.paper },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="templates/new" options={{ title: 'New Template', presentation: 'modal' }} />
        <Stack.Screen name="templates/[id]/edit" options={{ title: 'Edit Template' }} />
        <Stack.Screen name="templates/[id]/quick-capture" options={{ title: 'Quick Capture', presentation: 'modal' }} />
        <Stack.Screen name="instances/new" options={{ title: 'Start Process', presentation: 'modal' }} />
        <Stack.Screen name="instances/[id]/index" options={{ title: 'Instance' }} />
        <Stack.Screen name="instances/[id]/step/[stepId]" options={{ title: 'Step' }} />
        <Stack.Screen name="learnings/new" options={{ title: 'New Learning', presentation: 'modal' }} />
        <Stack.Screen name="learnings/[id]/index" options={{ title: 'Learning' }} />
        <Stack.Screen name="learnings/[id]/edit" options={{ title: 'Edit Learning', presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DbInitGate>
        <AlertProvider>
          <TemplateProvider>
            <InstanceProvider>
              <ReminderProvider>
                <LearningProvider>
                  <RootLayoutInner />
                </LearningProvider>
              </ReminderProvider>
            </InstanceProvider>
          </TemplateProvider>
        </AlertProvider>
      </DbInitGate>
    </ThemeProvider>
  );
}
