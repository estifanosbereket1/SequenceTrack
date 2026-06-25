import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Modal, Dimensions, Share,
} from 'react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useLearnings } from '../../../src/context/LearningContext';
import { useAlert } from '../../../src/context/AlertContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../../src/theme/typography';
import { formatDateTime } from '../../../src/utils/date';
import Markdown from 'react-native-markdown-display';
import AudioPlayer from '../../../src/components/AudioPlayer';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function LearningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryId = parseInt(id, 10);
  const { colors } = useTheme();
  const { currentEntry, loadEntry, deleteEntry } = useLearnings();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    loadEntry(entryId);
  }, [entryId]);

  const entry = currentEntry;
  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.paper, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.body, { color: colors.text.secondary }]}>Loading...</Text>
      </View>
    );
  }

  const handleDelete = () => {
    showAlert('Delete Entry', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteEntry(entryId);
        router.back();
      }},
    ]);
  };

  const handleOpenFile = async (uri: string, label?: string | null) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        showAlert('File', label || uri.split('/').pop() || 'Attachment');
      }
    } catch {
      showAlert('Error', 'Could not open file.');
    }
  };

  const markdownStyles = {
    body: { color: colors.text.ink, fontSize: 15, lineHeight: 22 },
    heading1: { color: colors.text.ink, fontSize: 22, fontWeight: '700' as const, marginBottom: 8, marginTop: 16 },
    heading2: { color: colors.text.ink, fontSize: 18, fontWeight: '600' as const, marginBottom: 6, marginTop: 12 },
    heading3: { color: colors.text.ink, fontSize: 16, fontWeight: '600' as const, marginBottom: 4, marginTop: 10 },
    heading4: { color: colors.text.ink, fontSize: 15, fontWeight: '600' as const, marginBottom: 4, marginTop: 8 },
    link: { color: colors.accent.clay, textDecorationLine: 'underline' as const },
    list_item: { color: colors.text.ink, marginBottom: 4 },
    bullet_list_icon: { color: colors.accent.clay },
    ordered_list_icon: { color: colors.accent.clay },
    code_inline: { backgroundColor: colors.bg.cardSecondary, color: colors.text.ink, paddingHorizontal: 4, borderRadius: 3 },
    fence: { backgroundColor: colors.bg.cardSecondary, padding: 10, borderRadius: 8, marginVertical: 8 },
    blockquote: { borderLeftColor: colors.accent.clay, borderLeftWidth: 3, paddingLeft: 12, marginVertical: 8, opacity: 0.8 },
    hr: { backgroundColor: colors.border, height: 1, marginVertical: 12 },
  };

  const photoAttachments = entry.attachments.filter(a => a.type === 'photo');
  const fileAttachments = entry.attachments.filter(a => a.type === 'file');
  const voiceAttachments = entry.attachments.filter(a => a.type === 'voice');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg.paper }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.headerCard, { backgroundColor: colors.bg.card }]}>
        <Text style={[typography.h2, { color: colors.text.ink }]}>
          {entry.title || 'Untitled'}
        </Text>
        <Text style={[typography.monoSmall, { color: colors.text.muted, marginTop: 4 }]}>
          {formatDateTime(entry.created_at)}
        </Text>
        {entry.updated_at !== entry.created_at && (
          <Text style={[typography.monoSmall, { color: colors.text.muted }]}>
            Updated {formatDateTime(entry.updated_at)}
          </Text>
        )}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.bg.cardSecondary }]}
            onPress={() => router.push(`/learnings/${entryId}/edit` as any)}
          >
            <Ionicons name="pencil" size={16} color={colors.accent.clay} />
            <Text style={[typography.caption, { color: colors.accent.clay, marginLeft: 4 }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.status.overdueLight }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={16} color={colors.status.overdue} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.bodyCard, { backgroundColor: colors.bg.card }]}>
        <Markdown style={markdownStyles}>
          {entry.body_markdown || '_No content._'}
        </Markdown>
      </View>

      {photoAttachments.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.caption, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>
            PHOTOS
          </Text>
          <View style={styles.photoGrid}>
            {photoAttachments.map((att) => (
              <TouchableOpacity
                key={att.id}
                onPress={() => setFullscreenImage(att.uri)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: att.uri }}
                  style={[styles.thumb, { borderColor: colors.border }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {fileAttachments.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.caption, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>
            FILES
          </Text>
          {fileAttachments.map((att) => (
            <TouchableOpacity
              key={att.id}
              style={[styles.attRow, { backgroundColor: colors.bg.card }]}
              onPress={() => handleOpenFile(att.uri, att.label)}
            >
              <Ionicons name="document-outline" size={20} color={colors.accent.clay} />
              <Text style={[typography.body, { color: colors.text.ink, flex: 1, marginLeft: 10 }]} numberOfLines={1}>
                {att.label || att.uri.split('/').pop()}
              </Text>
              <Ionicons name="share-outline" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {voiceAttachments.length > 0 && (
        <View style={styles.section}>
          <Text style={[typography.caption, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>
            VOICE NOTES
          </Text>
          {voiceAttachments.map((att) => (
            <View key={att.id}>
              <AudioPlayer uri={att.uri} durationSeconds={att.duration_seconds} />
              {att.caption ? (
                <Text style={[typography.bodySmall, { color: colors.text.secondary, paddingHorizontal: 4, marginTop: 2 }]}>
                  {att.caption}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <Modal visible={!!fullscreenImage} transparent animationType="fade">
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity style={styles.fullscreenClose} onPress={() => setFullscreenImage(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bodyCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  thumb: {
    width: (Dimensions.get('window').width - 48) / 3,
    height: (Dimensions.get('window').width - 48) / 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  attRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
});
