import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../src/theme/typography';
import { upsertProfile } from '../../src/db/profile';
import { setAppMeta } from '../../src/db/appMeta';

export default function ConfirmScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { name, photoUri } = useLocalSearchParams<{ name: string; photoUri: string }>();
  const hasPhoto = photoUri && photoUri !== '' && photoUri !== 'skipped';

  const handleComplete = async () => {
    await upsertProfile(name, hasPhoto ? photoUri : null);
    await setAppMeta('has_onboarded', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <View style={styles.top}>
        {hasPhoto ? (
          <Image source={{ uri: photoUri }} style={[styles.avatar, { borderColor: colors.border }]} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bg.cardSecondary, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={48} color={colors.accent.clay} />
          </View>
        )}
        <Text style={[typography.h2, { color: colors.text.ink, marginTop: 20, textAlign: 'center' }]}>
          {name}
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 }]}>
          You're all set. Let's get started!
        </Text>
      </View>
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent.clay }]}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: colors.text.inverse }]}>Open the app</Text>
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
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
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
