import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeProvider';
import { getAppMeta } from '../src/db/appMeta';

export default function RootIndex() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const row = await getAppMeta('has_onboarded');
      if (row?.value === 'true') {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.paper }}>
      <ActivityIndicator size="large" color={colors.accent.clay} />
    </View>
  );
}
