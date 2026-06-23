import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useLearnings } from '../../../src/context/LearningContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../../src/theme/typography';
import MarkdownToolbar from '../../../src/components/MarkdownToolbar';
import * as MediaUtils from '../../../src/utils/media';
import { requestRecordingPermissions, setAudioModeForRecording, loadAudioModule } from '../../../src/utils/audio';

export default function EditLearningScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryId = parseInt(id, 10);
  const { colors } = useTheme();
  const { currentEntry, loadEntry, updateEntry, addAttachment } = useLearnings();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [newAttachments, setNewAttachments] = useState<Array<{
    type: 'photo' | 'file' | 'voice';
    uri: string;
    label: string | null;
    caption: string | null;
    durationSeconds: number | null;
  }>>([]);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<any>(null);

  const bodyRef = useRef<TextInput>(null);

  useEffect(() => {
    loadEntry(entryId);
  }, [entryId]);

  useEffect(() => {
    if (currentEntry && currentEntry.id === entryId) {
      setTitle(currentEntry.title ?? '');
      setBody(currentEntry.body_markdown);
    }
  }, [currentEntry?.id]);

  const handleInsert = useCallback((before: string, after: string, cursorOffset?: number) => {
    const start = selection.start;
    const end = selection.end;
    const newText = body.substring(0, start) + before + body.substring(start, end) + after + body.substring(end);
    setBody(newText);
    const newCursor = start + (cursorOffset ?? before.length);
    setSelection({ start: newCursor, end: newCursor });
  }, [body, selection]);

  const handleAddPhoto = async () => {
    const result = await MediaUtils.pickPhoto();
    if (result) {
      setNewAttachments(prev => [...prev, { type: 'photo', uri: result.uri, label: null, caption: null, durationSeconds: null }]);
    }
  };

  const handleAddFile = async () => {
    const result = await MediaUtils.pickFile();
    if (result) {
      setNewAttachments(prev => [...prev, { type: 'file', uri: result.uri, label: result.name, caption: null, durationSeconds: null }]);
    }
  };

  const handleAddVoice = async () => {
    const granted = await requestRecordingPermissions();
    if (!granted) {
      Alert.alert('Permission required', 'Microphone access is needed to record voice notes.');
      return;
    }
    await setAudioModeForRecording();
    const mod = await loadAudioModule();
    if (!mod) {
      Alert.alert('Not available', 'Voice recording is not available in this environment.');
      return;
    }

    if (recording && recorder) {
      await recorder.stop();
      const uri = recorder.uri;
      const duration = recorder.currentTime ?? 0;
      setRecording(false);
      setRecorder(null);
      if (uri) {
        setNewAttachments(prev => [...prev, { type: 'voice', uri, label: null, caption: null, durationSeconds: duration }]);
      }
      return;
    }

    try {
      const AudioRecorderClass = mod.AudioModule.AudioRecorder;
      const r = new AudioRecorderClass({
        extension: '.m4a',
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 64000,
        android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
        ios: { outputFormat: 0, audioQuality: 127, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
        web: { mimeType: 'audio/webm', bitsPerSecond: 64000 },
      });
      await r.prepareToRecordAsync();
      r.record();
      setRecorder(r);
      setRecording(true);
    } catch {
      Alert.alert('Recording failed', 'Could not start recording.');
    }
  };

  const handleSave = async () => {
    await updateEntry(entryId, title.trim() || null, body.trim());
    for (const att of newAttachments) {
      await addAttachment(entryId, att.type, att.uri, att.label, att.caption, att.durationSeconds);
    }
    router.back();
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!currentEntry) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.paper, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.body, { color: colors.text.secondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg.paper }]} keyboardShouldPersistTaps="handled">
      <TextInput
        style={[styles.titleInput, { color: colors.text.ink }]}
        placeholder="Title (optional)"
        placeholderTextColor={colors.text.muted}
        value={title}
        onChangeText={setTitle}
      />

      <MarkdownToolbar onInsert={handleInsert} selection={selection} text={body} />

      <TextInput
        ref={bodyRef}
        style={[styles.bodyInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
        placeholder="Write in markdown..."
        placeholderTextColor={colors.text.muted}
        value={body}
        onChangeText={setBody}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.attachmentSection}>
        <Text style={[typography.caption, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>
          ADD ATTACHMENTS
        </Text>
        <View style={styles.addRow}>
          <TouchableOpacity style={[styles.attBtn, { borderColor: colors.border }]} onPress={handleAddPhoto}>
            <Ionicons name="camera-outline" size={20} color={colors.accent.clay} />
            <Text style={[typography.caption, { color: colors.accent.clay, marginLeft: 4 }]}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.attBtn, { borderColor: colors.border }]} onPress={handleAddFile}>
            <Ionicons name="document-outline" size={20} color={colors.accent.clay} />
            <Text style={[typography.caption, { color: colors.accent.clay, marginLeft: 4 }]}>File</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attBtn, { borderColor: recording ? colors.status.overdue : colors.border }]}
            onPress={handleAddVoice}
          >
            <Ionicons
              name={recording ? 'stop-circle' : 'mic-outline'}
              size={20}
              color={recording ? colors.status.overdue : colors.accent.clay}
            />
            <Text style={[typography.caption, { color: recording ? colors.status.overdue : colors.accent.clay, marginLeft: 4 }]}>
              {recording ? 'Stop' : 'Voice'}
            </Text>
          </TouchableOpacity>
        </View>

        {currentEntry.attachments.length > 0 && (
          <>
            <Text style={[typography.caption, { color: colors.text.muted, marginTop: 12, marginBottom: 6 }]}>
              Existing attachments ({currentEntry.attachments.length})
            </Text>
            {currentEntry.attachments.map((att) => (
              <View key={att.id} style={[styles.attRow, { backgroundColor: colors.bg.cardSecondary }]}>
                <Ionicons
                  name={att.type === 'photo' ? 'image-outline' : att.type === 'file' ? 'document-outline' : 'mic-outline'}
                  size={16}
                  color={colors.text.muted}
                />
                <Text style={[typography.bodySmall, { color: colors.text.secondary, marginLeft: 8 }]} numberOfLines={1}>
                  {att.label || att.uri.split('/').pop() || att.type}
                </Text>
              </View>
            ))}
          </>
        )}

        {newAttachments.map((att, i) => (
          <View key={`new-${i}`} style={[styles.attRow, { backgroundColor: colors.bg.cardSecondary }]}>
            <Ionicons
              name={att.type === 'photo' ? 'image-outline' : att.type === 'file' ? 'document-outline' : 'mic-outline'}
              size={18}
              color={colors.text.secondary}
            />
            <Text style={[typography.bodySmall, { color: colors.text.secondary, flex: 1, marginLeft: 8 }]} numberOfLines={1}>
              {att.label || att.uri.split('/').pop() || att.type}
            </Text>
            <TouchableOpacity onPress={() => removeNewAttachment(i)} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.accent.clay }]}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Text style={[typography.button, { color: colors.text.inverse }]}>Save Changes</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    paddingVertical: 8,
    marginBottom: 12,
  },
  bodyInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 200,
    borderWidth: 1,
    marginTop: 10,
  },
  attachmentSection: {
    marginTop: 20,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  attBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  attRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
});
