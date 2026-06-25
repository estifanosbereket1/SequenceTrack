import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Image, Alert, Linking, Platform,
} from 'react-native';
import { useTheme } from '../../../../src/theme/ThemeProvider';
import { useInstances } from '../../../../src/context/InstanceContext';
import { useReminders } from '../../../../src/context/ReminderContext';
import { useAlert } from '../../../../src/context/AlertContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../../../src/theme/typography';
import { formatDateTime } from '../../../../src/utils/date';
import * as MediaUtils from '../../../../src/utils/media';
import type { InstanceBlock, BlockType } from '../../../../src/types';
import * as FileSystem from 'expo-file-system';

export default function StepDetailScreen() {
  const { id, stepId } = useLocalSearchParams<{ id: string; stepId: string }>();
  const instanceId = parseInt(id, 10);
  const stepIdNum = parseInt(stepId, 10);
  const { colors } = useTheme();
  const {
    currentInstance, loadInstance,
    updateStepStatus, toggleChecklistBlock,
    addInstanceBlock, removeInstanceBlock,
  } = useInstances();
  const { scheduleReminder } = useReminders();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlockType, setNewBlockType] = useState<BlockType>('text');
  const [newBlockText, setNewBlockText] = useState('');

  useEffect(() => {
    loadInstance(instanceId);
  }, [instanceId]);

  const step = currentInstance?.steps.find(s => s.id === stepIdNum);

  const handleToggleChecklist = async (block: InstanceBlock) => {
    const newVal = !block.completed;
    await toggleChecklistBlock(stepIdNum, block.id, newVal);
  };

  const handleMarkStepDone = async () => {
    await updateStepStatus(stepIdNum, 'done');
  };

  const handleMarkInProgress = async () => {
    await updateStepStatus(stepIdNum, 'in_progress');
  };

  const handleAddBlock = async () => {
    if (newBlockType === 'photo') {
      const result = await MediaUtils.pickPhoto();
      if (result) {
        await addInstanceBlock(stepIdNum, 'photo', 'Photo', result.uri, null);
      }
    } else if (newBlockType === 'file') {
      const result = await MediaUtils.pickFile();
      if (result) {
        await addInstanceBlock(stepIdNum, 'file', '', result.uri, result.name);
      }
    } else {
      if (!newBlockText.trim()) return;
      await addInstanceBlock(stepIdNum, newBlockType, newBlockText.trim(), null, newBlockType === 'link' ? newBlockText.trim() : null);
      setNewBlockText('');
    }
    setAddingBlock(false);
  };

  const handleScheduleReminder = () => {
    if (Platform.OS === 'ios') {
      (Alert as any).prompt(
        'Remind about this step',
        'What should we remind you about?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Schedule',
            onPress: (text: string | undefined) => {
              if (!text) return;
              const date = new Date(Date.now() + 86400000);
              scheduleReminder(instanceId, stepIdNum, text, date, null);
              showAlert('Reminder set', `For ${formatDateTime(date.toISOString())}`);
            },
          },
        ],
        'plain-text',
        step?.title ? `Submit ${step.title}` : 'Reminder'
      );
    } else {
      showAlert('Schedule Reminder', 'Reminder scheduling text input not available on Android via Alert.');
    }
  };

  if (!step) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.paper, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.body, { color: colors.text.secondary }]}>Step not found.</Text>
      </View>
    );
  }

  const renderBlock = (block: InstanceBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <View style={[styles.blockCard, { backgroundColor: colors.bg.card }]}>
            <Text style={[typography.body, { color: colors.text.ink }]}>{block.text_content}</Text>
          </View>
        );
      case 'checklist_item':
        return (
          <TouchableOpacity
            style={[styles.blockCard, { backgroundColor: colors.bg.card, flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => handleToggleChecklist(block)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              {
                borderColor: block.completed ? colors.status.done : colors.status.notStarted,
                backgroundColor: block.completed ? colors.status.done : 'transparent',
              },
            ]}>
              {block.completed && <Ionicons name="checkmark" size={16} color={colors.text.inverse} />}
            </View>
            <Text style={[
              typography.body,
              {
                color: block.completed ? colors.text.muted : colors.text.ink,
                marginLeft: 12,
                flex: 1,
                textDecorationLine: block.completed ? 'line-through' : 'none',
              },
            ]}>
              {block.text_content}
            </Text>
            {block.completed_at && (
              <Text style={[typography.monoSmall, { color: colors.text.muted }]}>
                {formatDateTime(block.completed_at).split(',')[1]?.trim()}
              </Text>
            )}
          </TouchableOpacity>
        );
      case 'photo':
        return (
          <View style={[styles.blockCard, { backgroundColor: colors.bg.card, padding: 0, overflow: 'hidden' }]}>
            {block.uri ? (
              <Image source={{ uri: block.uri }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
            ) : null}
            {block.text_content ? (
              <Text style={[typography.bodySmall, { color: colors.text.secondary, padding: 10 }]}>{block.text_content}</Text>
            ) : null}
          </View>
        );
      case 'link':
        return (
          <TouchableOpacity
            style={[styles.blockCard, { backgroundColor: colors.bg.card, flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => {
              if (block.uri) Linking.openURL(block.uri);
              else if (block.text_content) Linking.openURL(block.text_content);
            }}
          >
            <Ionicons name="link" size={18} color={colors.accent.clay} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[typography.body, { color: colors.accent.clay, textDecorationLine: 'underline' }]}>
                {block.label || block.text_content || block.uri}
              </Text>
            </View>
          </TouchableOpacity>
        );
      case 'file':
        return (
          <TouchableOpacity
            style={[styles.blockCard, { backgroundColor: colors.bg.card, flexDirection: 'row', alignItems: 'center' }]}
            onPress={async () => {
              if (block.uri) {
                try {
                  await FileSystem.getInfoAsync(block.uri);
                  showAlert('File', block.label || block.uri.split('/').pop() || 'Attachment');
                } catch {
                  showAlert('File not found', 'The file may have been deleted.');
                }
              }
            }}
          >
            <Ionicons name="document-outline" size={18} color={colors.accent.clay} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[typography.body, { color: colors.text.ink }]}>{block.label || block.uri?.split('/').pop() || 'Attachment'}</Text>
            </View>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <View style={[styles.stepHeader, { backgroundColor: colors.bg.card }]}>
        <View style={styles.stepHeaderTop}>
          <Text style={[typography.h3, { color: colors.text.ink, flex: 1 }]}>{step.title}</Text>
          {step.status === 'done' ? (
            <View style={[styles.statusChip, { backgroundColor: colors.status.doneLight }]}>
              <Text style={[typography.caption, { color: colors.status.done }]}>Done</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.statusChip, { backgroundColor: colors.accent.clay }]}
              onPress={handleMarkStepDone}
            >
              <Text style={[typography.caption, { color: colors.text.inverse }]}>Mark step done</Text>
            </TouchableOpacity>
          )}
        </View>
        {step.status === 'in_progress' ? (
          <TouchableOpacity onPress={handleMarkStepDone} style={{ marginTop: 8 }}>
            <Text style={[typography.caption, { color: colors.accent.clay }]}>Tap to mark complete</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={step.blocks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[typography.caption, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>
            BLOCKS — {step.blocks.length}
          </Text>
        }
        renderItem={({ item }) => renderBlock(item)}
        ListFooterComponent={
          <View style={{ marginTop: 16 }}>
            {addingBlock ? (
              <View style={[styles.addForm, { backgroundColor: colors.bg.cardSecondary, borderColor: colors.border }]}>
                <View style={styles.typeRow}>
                  {(['text', 'checklist_item', 'photo', 'link', 'file'] as BlockType[]).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        { borderColor: colors.border },
                        newBlockType === type && { backgroundColor: colors.accent.clay, borderColor: colors.accent.clay },
                      ]}
                      onPress={() => setNewBlockType(type)}
                    >
                      <Text style={[
                        typography.monoSmall,
                        { color: newBlockType === type ? colors.text.inverse : colors.text.muted },
                      ]}>
                        {type.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {newBlockType !== 'photo' && newBlockType !== 'file' ? (
                  <TextInput
                    style={[styles.addInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
                    placeholder={
                      newBlockType === 'checklist_item' ? 'Checklist item' :
                      newBlockType === 'link' ? 'URL' :
                      'Note text'
                    }
                    placeholderTextColor={colors.text.muted}
                    value={newBlockText}
                    onChangeText={setNewBlockText}
                    multiline={newBlockType === 'text'}
                  />
                ) : null}
                <View style={styles.addFormActions}>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.accent.clay }]} onPress={handleAddBlock}>
                    <Text style={[typography.caption, { color: colors.text.inverse }]}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.bg.cardSecondary }]} onPress={() => setAddingBlock(false)}>
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.addBlockBtn, { borderColor: colors.border }]}
                  onPress={() => setAddingBlock(true)}
                >
                  <Ionicons name="add" size={20} color={colors.accent.clay} />
                  <Text style={[typography.bodySmall, { color: colors.accent.clay, marginLeft: 6 }]}>Add note</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.remindBtn, { borderColor: colors.border }]}
                  onPress={handleScheduleReminder}
                >
                  <Ionicons name="alarm-outline" size={18} color={colors.accent.clay} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepHeader: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
  },
  stepHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  blockCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addForm: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  addInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  addFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  smallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBlockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  remindBtn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});
