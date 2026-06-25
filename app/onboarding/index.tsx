import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../src/theme/typography';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <View style={styles.top}>
        <View style={[styles.iconCircle, { backgroundColor: colors.bg.cardSecondary }]}>
          <Ionicons name="layers-outline" size={64} color={colors.accent.clay} />
        </View>
        <Text style={[typography.h1, { color: colors.text.ink, marginTop: 24, textAlign: 'center' }]}>
          ProcessTracker
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 24, lineHeight: 22 }]}>
          Track multi-step processes, capture learnings, and never miss a step.
        </Text>
      </View>
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent.clay }]}
          onPress={() => router.push('/onboarding/profile')}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: colors.text.inverse }]}>Get started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    paddingBottom: 40,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
});
