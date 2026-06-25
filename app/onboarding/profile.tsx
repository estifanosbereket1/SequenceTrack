import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../src/theme/typography';
import * as MediaUtils from '../../src/utils/media';

export default function ProfileSetupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handlePickPhoto = async () => {
    const result = await MediaUtils.pickPhoto();
    if (result) setPhotoUri(result.uri);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <View style={styles.top}>
        <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={[styles.avatar, { borderColor: colors.border }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bg.cardSecondary, borderColor: colors.border }]}>
              <Ionicons name="camera-outline" size={32} color={colors.text.muted} />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickPhoto} style={{ marginTop: 8 }}>
          <Text style={[typography.caption, { color: colors.accent.clay }]}>
            {photoUri ? 'Change photo' : 'Add photo'}
          </Text>
        </TouchableOpacity>
        {!photoUri ? (
          <TouchableOpacity onPress={() => setPhotoUri('skipped')} style={{ marginTop: 4 }}>
            <Text style={[typography.caption, { color: colors.text.muted }]}>Skip photo</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.form}>
        <Text style={[typography.caption, { color: colors.text.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }]}>
          YOUR NAME *
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
          placeholder="Enter your name"
          placeholderTextColor={colors.text.muted}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: name.trim() ? colors.accent.clay : colors.border }]}
          onPress={() => router.push(`/onboarding/confirm?name=${encodeURIComponent(name.trim())}&photoUri=${encodeURIComponent(photoUri ?? '')}`)}
          disabled={!name.trim()}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: name.trim() ? colors.text.inverse : colors.text.muted }]}>
            Continue
          </Text>
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
    alignItems: 'center',
    marginTop: 60,
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
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    marginTop: 40,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    borderWidth: 1,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
});
