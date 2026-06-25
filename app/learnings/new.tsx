import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Animated,
} from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useLearnings } from '../../src/context/LearningContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../src/theme/typography';
import MarkdownToolbar from '../../src/components/MarkdownToolbar';
import AudioPlayer from '../../src/components/AudioPlayer';
import * as MediaUtils from '../../src/utils/media';
import { requestRecordingPermissions, setAudioModeForRecording, loadAudioModule } from '../../src/utils/audio';

export default function NewLearningScreen() {
  const { colors } = useTheme();
  const { createEntry, addAttachment } = useLearnings();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [attachments, setAttachments] = useState<Array<{
    type: 'photo' | 'file' | 'voice';
    uri: string;
    label: string | null;
    caption: string | null;
    durationSeconds: number | null;
  }>>([]);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [savedVoice, setSavedVoice] = useState(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingDotAnim = useRef(new Animated.Value(1)).current;

  const bodyRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (recording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingDotAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
          Animated.timing(recordingDotAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      recordingDotAnim.setValue(1);
    }
  }, [recording]);

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
      setAttachments(prev => [...prev, { type: 'photo', uri: result.uri, label: null, caption: null, durationSeconds: null }]);
    }
  };

  const handleAddFile = async () => {
    const result = await MediaUtils.pickFile();
    if (result) {
      setAttachments(prev => [...prev, { type: 'file', uri: result.uri, label: result.name, caption: null, durationSeconds: null }]);
    }
  };

  const handleAddVoice = async () => {
    if (recording && recorder) {
      await recorder.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const uri = recorder.uri;
      const duration = recorder.currentTime ?? 0;
      setRecording(false);
      setRecorder(null);
      setRecordingDuration(0);
      setSavedVoice(true);
      if (uri) {
        setAttachments(prev => [...prev, {
          type: 'voice', uri, label: null, caption: null, durationSeconds: duration,
        }]);
      }
      setTimeout(() => setSavedVoice(false), 1500);
      return;
    }

    Alert.alert('Start recording?', 'Record a voice note for this entry.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start', onPress: async () => {
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
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(() => {
              setRecordingDuration(prev => prev + 1);
            }, 1000);
          } catch {
            Alert.alert('Recording failed', 'Could not start recording.');
          }
        },
      },
    ]);
  };

  const handleCancelRecording = () => {
    Alert.alert('Discard recording?', 'This recording will be lost.', [
      { text: 'Keep Recording', style: 'cancel' },
      {
        text: 'Discard', style: 'destructive', onPress: async () => {
          if (recorder) {
            try { await recorder.stop(); } catch {}
          }
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          setRecording(false);
          setRecorder(null);
          setRecordingDuration(0);
        },
      },
    ]);
  };

  const removeAttachment = (index: number, type: string) => {
    if (type === 'voice') {
      Alert.alert('Remove recording?', 'It will be deleted.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: () => {
            setAttachments(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]);
    } else {
      setAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!body.trim() && !title.trim()) {
      Alert.alert('Nothing to save', 'Add some content or a title first.');
      return;
    }
    const id = await createEntry(title.trim() || null, body.trim());
    for (const att of attachments) {
      await addAttachment(id, att.type, att.uri, att.label, att.caption, att.durationSeconds);
    }
    router.back();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg.paper }]}
        contentContainerStyle={{ paddingBottom: 0 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={[styles.titleInput, { color: colors.text.ink }]}
          placeholder="Title (optional)"
          placeholderTextColor={colors.text.muted}
          value={title}
          onChangeText={setTitle}
        />

        <MarkdownToolbar
          onInsert={handleInsert}
          selection={selection}
          text={body}
        />

        <TextInput
          ref={bodyRef}
          style={[styles.bodyInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
          placeholder="Write your notes in markdown..."
          placeholderTextColor={colors.text.muted}
          value={body}
          onChangeText={setBody}
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.attachmentSection}>
          <Text style={[typography.caption, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>
            ATTACHMENTS
          </Text>

          <View style={styles.addAttachmentRow}>
            {!recording && (
              <>
                <TouchableOpacity style={[styles.attBtn, { borderColor: colors.border }]} onPress={handleAddPhoto}>
                  <Ionicons name="camera-outline" size={20} color={colors.accent.clay} />
                  <Text style={[typography.caption, { color: colors.accent.clay, marginLeft: 4 }]}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.attBtn, { borderColor: colors.border }]} onPress={handleAddFile}>
                  <Ionicons name="document-outline" size={20} color={colors.accent.clay} />
                  <Text style={[typography.caption, { color: colors.accent.clay, marginLeft: 4 }]}>File</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[styles.attBtn, { borderColor: colors.border }]} onPress={handleAddVoice}>
              <Ionicons name={recording ? 'stop-circle' : 'mic-outline'} size={20} color={recording ? colors.status.overdue : colors.accent.clay} />
              <Text style={[typography.caption, { color: recording ? colors.status.overdue : colors.accent.clay, marginLeft: 4 }]}>
                {recording ? 'Stop' : 'Voice'}
              </Text>
            </TouchableOpacity>
          </View>

          {recording && (
            <View style={[styles.inlineRecordingBar, { backgroundColor: colors.bg.cardSecondary, borderColor: colors.border }]}>
              <TouchableOpacity onPress={handleCancelRecording} hitSlop={8}>
                <Ionicons name="trash-outline" size={22} color={colors.status.overdue} />
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                <Animated.View style={[styles.recordingDot, { opacity: recordingDotAnim }]} />
                <Text style={[typography.bodySmall, { color: colors.status.overdue, marginLeft: 8 }]}>
                  {formatTime(recordingDuration)}
                </Text>
              </View>
              <TouchableOpacity onPress={handleAddVoice} hitSlop={8}>
                <Ionicons name="stop-circle" size={28} color={colors.status.overdue} />
              </TouchableOpacity>
            </View>
          )}

          {savedVoice && (
            <View style={[styles.savedBanner, { backgroundColor: colors.bg.cardSecondary }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.status.done} />
              <Text style={[typography.bodySmall, { color: colors.status.done, marginLeft: 6 }]}>
                Voice note saved ✓
              </Text>
            </View>
          )}

          {attachments.map((att, i) => (
            att.type === 'voice' ? (
              <View key={i} style={[styles.voiceAttRow, { backgroundColor: colors.bg.cardSecondary }]}>
                <View style={{ flex: 1 }}>
                  <AudioPlayer uri={att.uri} durationSeconds={att.durationSeconds} />
                </View>
                <TouchableOpacity onPress={() => removeAttachment(i, att.type)} hitSlop={8} style={{ marginLeft: 6 }}>
                  <Ionicons name="close-circle" size={20} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View key={i} style={[styles.attRow, { backgroundColor: colors.bg.cardSecondary }]}>
                <Ionicons
                  name={att.type === 'photo' ? 'image-outline' : 'document-outline'}
                  size={18}
                  color={colors.text.secondary}
                />
                <Text style={[typography.bodySmall, { color: colors.text.secondary, flex: 1, marginLeft: 8 }]} numberOfLines={1}>
                  {att.label || att.uri.split('/').pop() || att.type}
                </Text>
                <TouchableOpacity onPress={() => removeAttachment(i, 'other')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            )
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent.clay }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: colors.text.inverse }]}>Save Entry</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  addAttachmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
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
  voiceAttRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inlineRecordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 6,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D32F2F',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
});
