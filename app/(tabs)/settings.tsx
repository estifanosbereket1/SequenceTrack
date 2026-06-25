import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, TextInput, Modal, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAlert } from '../../src/context/AlertContext';
import { typography } from '../../src/theme/typography';
import { getProfile, upsertProfile } from '../../src/db/profile';
import { getAppMetaValue, setAppMeta, deleteAppMeta, getAllAppMeta } from '../../src/db/appMeta';
import { getDb } from '../../src/db/database';
import * as MediaUtils from '../../src/utils/media';
import { Paths, Directory } from 'expo-file-system';
import type { Profile } from '../../src/types';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderHH, setReminderHH] = useState('09');
  const [reminderMM, setReminderMM] = useState('00');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoUri, setEditPhotoUri] = useState<string | null | 'unchanged'>('unchanged');
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);

      const notifVal = await getAppMetaValue('notifications_enabled');
      if (notifVal === 'false') setNotificationsEnabled(false);

      const timeVal = await getAppMetaValue('default_reminder_time');
      if (timeVal) {
        const parts = timeVal.split(':');
        setReminderHH(parts[0] ?? '09');
        setReminderMM(parts[1] ?? '00');
      }

      try {
        const Constants = await import('expo-constants');
        setAppVersion(Constants.default?.expoConfig?.version ?? '1.0.0');
      } catch {
        setAppVersion('1.0.0');
      }
    })();
  }, []);

  const openProfileEditor = () => {
    setEditName(profile?.name ?? '');
    setEditPhotoUri('unchanged');
    setProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const name = editName.trim();
    if (!name) return;
    const finalPhoto = editPhotoUri === 'unchanged' ? (profile?.photo_uri ?? null) : editPhotoUri;
    await upsertProfile(name, finalPhoto);
    const p = await getProfile();
    setProfile(p);
    setProfileModalVisible(false);
  };

  const handlePickPhoto = async () => {
    const result = await MediaUtils.pickPhoto();
    if (result) setEditPhotoUri(result.uri);
  };

  const handleRemovePhoto = () => {
    setEditPhotoUri(null);
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    await setAppMeta('notifications_enabled', val ? 'true' : 'false');
  };

  const handleSaveReminderTime = async () => {
    const hh = reminderHH.padStart(2, '0').slice(0, 2);
    const mm = reminderMM.padStart(2, '0').slice(0, 2);
    setReminderHH(hh);
    setReminderMM(mm);
    await setAppMeta('default_reminder_time', `${hh}:${mm}`);
  };

  const handleExportData = async () => {
    try {
      const db = await getDb();
      const templates = await db.getAllAsync('SELECT * FROM templates');
      const instances = await db.getAllAsync('SELECT * FROM instances');
      const learnings = await db.getAllAsync('SELECT * FROM learnings');
      const profileRow = await getProfile();

      const data = JSON.stringify({ templates, instances, learnings, profile: profileRow }, null, 2);
      const { Paths: P, File: F } = await import('expo-file-system');
      const file = new F(new Directory(P.cache), `processtracker_export_${Date.now()}.json`);
      await file.write(data);

      const Sharing = await import('expo-sharing');
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
    } catch (e: any) {
      showAlert('Export failed', e.message || 'Could not export data.');
    }
  };

  const handlePurgeData = () => {
    showAlert('Purge all data?', 'This cannot be undone. All templates, instances, learnings, and files will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything', style: 'destructive', onPress: async () => {
          try {
            const dir = new Directory(Paths.document);
            if (dir.exists) {
              for (const entry of dir.list()) {
                try { (entry as any).delete?.(); } catch {}
              }
            }
            const db = await getDb();
            await db.execAsync(`
              DELETE FROM learning_attachments;
              DELETE FROM learnings;
              DELETE FROM reminders;
              DELETE FROM instance_blocks;
              DELETE FROM instance_steps;
              DELETE FROM instances;
              DELETE FROM template_blocks;
              DELETE FROM template_steps;
              DELETE FROM templates;
              DELETE FROM profile;
            `);
            const allMeta = await getAllAppMeta();
            for (const meta of allMeta) {
              await deleteAppMeta(meta.key);
            }
            await setAppMeta('has_onboarded', 'false');
            router.replace('/onboarding');
          } catch (e: any) {
            showAlert('Purge failed', e.message || 'Could not purge data.');
          }
        },
      },
    ]);
  };

  const handleResetTutorials = () => {
    showAlert('Reset tutorials?', 'All tutorial tooltips and the walkthrough will be shown again on next visit.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', onPress: async () => {
          await deleteAppMeta('walkthrough_seen');
          const allMeta = await getAllAppMeta();
          for (const meta of allMeta) {
            if (meta.key.startsWith('tooltip_seen_')) {
              await deleteAppMeta(meta.key);
            }
          }
          showAlert('Done', 'Tutorials will reappear on next visit.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg.paper }]} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Profile */}
      <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>PROFILE</Text>
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.bg.card }]} onPress={openProfileEditor} activeOpacity={0.7}>
        <View style={[styles.avatarSmall, { backgroundColor: colors.bg.cardSecondary, borderColor: colors.border }]}>
          {profile?.photo_uri ? (
            <Image source={{ uri: profile.photo_uri }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person-outline" size={20} color={colors.text.muted} />
          )}
        </View>
        <Text style={[typography.body, { color: colors.text.ink, flex: 1, marginLeft: 12 }]}>
          {profile?.name ?? 'Set up profile'}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
      </TouchableOpacity>

      {/* Notifications */}
      <Text style={[styles.sectionHeader, { color: colors.text.muted, marginTop: 24 }]}>NOTIFICATIONS</Text>
      <View style={[styles.card, { backgroundColor: colors.bg.card }]}>
        <View style={styles.row}>
          <Text style={[typography.body, { color: colors.text.ink, flex: 1 }]}>Notifications enabled</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.accent.clayLight }}
            thumbColor={notificationsEnabled ? colors.accent.clay : colors.text.muted}
          />
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.bg.card, marginTop: 0 }]}>
        <Text style={[typography.body, { color: colors.text.ink, marginBottom: 8 }]}>Default reminder time</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            style={[styles.timeInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
            value={reminderHH}
            onChangeText={setReminderHH}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="HH"
            placeholderTextColor={colors.text.muted}
          />
          <Text style={[typography.body, { color: colors.text.secondary }]}>:</Text>
          <TextInput
            style={[styles.timeInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
            value={reminderMM}
            onChangeText={setReminderMM}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="MM"
            placeholderTextColor={colors.text.muted}
          />
          <TouchableOpacity
            style={[styles.saveTimeBtn, { backgroundColor: colors.accent.clay }]}
            onPress={handleSaveReminderTime}
            activeOpacity={0.7}
          >
            <Text style={[typography.caption, { color: colors.text.inverse }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data */}
      <Text style={[styles.sectionHeader, { color: colors.text.muted, marginTop: 24 }]}>DATA</Text>
      <View style={[styles.card, { backgroundColor: colors.bg.card }]}>
        <TouchableOpacity style={styles.row} onPress={handleExportData} activeOpacity={0.7}>
          <Ionicons name="download-outline" size={20} color={colors.accent.clay} />
          <Text style={[typography.body, { color: colors.text.ink, marginLeft: 10, flex: 1 }]}>Export all data</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
      <View style={[styles.card, { backgroundColor: colors.bg.card, marginTop: 0 }]}>
        <TouchableOpacity style={styles.row} onPress={handlePurgeData} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color={colors.status.overdue} />
          <Text style={[typography.body, { color: colors.status.overdue, marginLeft: 10, flex: 1 }]}>Purge all data</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={[styles.sectionHeader, { color: colors.text.muted, marginTop: 24 }]}>ABOUT</Text>
      <View style={[styles.card, { backgroundColor: colors.bg.card }]}>
        <View style={styles.row}>
          <Text style={[typography.body, { color: colors.text.secondary }]}>Version</Text>
          <Text style={[typography.body, { color: colors.text.ink }]}>{appVersion}</Text>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.bg.card, marginTop: 0 }]}>
        <TouchableOpacity style={styles.row} onPress={handleResetTutorials} activeOpacity={0.7}>
          <Text style={[typography.body, { color: colors.accent.clay }]}>Reset tutorials</Text>
        </TouchableOpacity>
      </View>

      {/* Profile edit modal */}
      <Modal visible={profileModalVisible} transparent animationType="fade" onRequestClose={() => setProfileModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.bg.card }]}>
            <Text style={[typography.h3, { color: colors.text.ink, textAlign: 'center', marginBottom: 20 }]}>Edit Profile</Text>

            <TouchableOpacity onPress={handlePickPhoto} style={{ alignItems: 'center', marginBottom: 20 }} activeOpacity={0.7}>
              {editPhotoUri === 'unchanged' && profile?.photo_uri ? (
                <Image source={{ uri: profile.photo_uri }} style={[styles.modalAvatar, { borderColor: colors.border }]} />
              ) : editPhotoUri ? (
                <Image source={{ uri: editPhotoUri }} style={[styles.modalAvatar, { borderColor: colors.border }]} />
              ) : (
                <View style={[styles.modalAvatarPlaceholder, { backgroundColor: colors.bg.cardSecondary, borderColor: colors.border }]}>
                  <Ionicons name="camera-outline" size={28} color={colors.text.muted} />
                </View>
              )}
              <Text style={[typography.caption, { color: colors.accent.clay, marginTop: 6 }]}>Change photo</Text>
            </TouchableOpacity>

            {(editPhotoUri !== 'unchanged' || profile?.photo_uri) ? (
              <TouchableOpacity onPress={handleRemovePhoto} style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={[typography.caption, { color: colors.status.overdue }]}>Remove photo</Text>
              </TouchableOpacity>
            ) : null}

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.text.muted}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.bg.cardSecondary, flex: 1 }]}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={[typography.button, { color: colors.text.secondary, textAlign: 'center' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.accent.clay, flex: 1 }]}
                onPress={handleSaveProfile}
                activeOpacity={0.7}
              >
                <Text style={[typography.button, { color: colors.text.inverse, textAlign: 'center' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  timeInput: {
    width: 50,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    borderWidth: 1,
    textAlign: 'center',
  },
  saveTimeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
