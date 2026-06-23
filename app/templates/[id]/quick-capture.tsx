import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useTemplates } from '../../../src/context/TemplateContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../../src/theme/typography';
import type { BlockType } from '../../../src/types';
import * as MediaUtils from '../../../src/utils/media';

interface QuickBlock {
  id: string;
  type: BlockType;
  textContent: string;
  uri: string | null;
  label: string | null;
}

export default function QuickCaptureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = parseInt(id, 10);
  const { colors } = useTheme();
  const { addStep, addBlock } = useTemplates();
  const router = useRouter();

  const [blocks, setBlocks] = useState<QuickBlock[]>([]);
  const [stepTitle, setStepTitle] = useState('');
  const [newBlockText, setNewBlockText] = useState('');

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addTextBlock = () => {
    if (!newBlockText.trim()) return;
    setBlocks(prev => [...prev, { id: generateId(), type: 'text', textContent: newBlockText.trim(), uri: null, label: null }]);
    setNewBlockText('');
  };

  const addChecklistBlock = () => {
    if (!newBlockText.trim()) return;
    setBlocks(prev => [...prev, { id: generateId(), type: 'checklist_item', textContent: newBlockText.trim(), uri: null, label: null }]);
    setNewBlockText('');
  };

  const addPhotoBlock = async () => {
    const result = await MediaUtils.pickPhoto();
    if (!result) return;
    setBlocks(prev => [...prev, { id: generateId(), type: 'photo', textContent: 'Photo', uri: result.uri, label: null }]);
  };

  const addLinkBlock = () => {
    if (!newBlockText.trim()) return;
    setBlocks(prev => [...prev, { id: generateId(), type: 'link', textContent: newBlockText.trim(), uri: null, label: null }]);
    setNewBlockText('');
  };

  const addFileBlock = async () => {
    const result = await MediaUtils.pickFile();
    if (!result) return;
    setBlocks(prev => [...prev, { id: generateId(), type: 'file', textContent: '', uri: result.uri, label: result.name }]);
  };

  const removeBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const structureIntoSteps = async () => {
    if (blocks.length === 0) {
      Alert.alert('Nothing to structure', 'Add some blocks first.');
      return;
    }

    const stepName = stepTitle.trim() || 'Quick Capture';
    await addStep(templateId, stepName);

    const steps = (await import('../../../src/db/templates')).getTemplateSteps;
    const currentSteps = await steps(templateId);
    const latestStep = currentSteps[currentSteps.length - 1];
    if (latestStep) {
      for (const block of blocks) {
        await addBlock(latestStep.id, block.type, block.textContent, block.uri, block.label);
      }
    }

    Alert.alert('Done', `${blocks.length} block(s) added to step "${stepName}".`, [
      { text: 'Edit Template', onPress: () => router.replace(`/templates/${templateId}/edit` as any) },
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.bg.paper }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      data={blocks}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <Text style={[typography.h2, { color: colors.text.ink }]}>Quick Capture</Text>
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4 }]}>
            Capture blocks freely, then assign them to a step.
          </Text>

          <TextInput
            style={[styles.stepInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border, marginTop: 20 }]}
            placeholder="Step name for these blocks"
            placeholderTextColor={colors.text.muted}
            value={stepTitle}
            onChangeText={setStepTitle}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
              placeholder="Type and add as text, checklist, or link..."
              placeholderTextColor={colors.text.muted}
              value={newBlockText}
              onChangeText={setNewBlockText}
            />
          </View>

          <View style={styles.typeButtons}>
            <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.bg.cardSecondary }]} onPress={addTextBlock}>
              <Text style={[typography.caption, { color: colors.text.ink }]}>Text</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.bg.cardSecondary }]} onPress={addChecklistBlock}>
              <Text style={[typography.caption, { color: colors.text.ink }]}>Checklist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.bg.cardSecondary }]} onPress={addLinkBlock}>
              <Text style={[typography.caption, { color: colors.text.ink }]}>Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.bg.cardSecondary }]} onPress={addPhotoBlock}>
              <Ionicons name="camera-outline" size={16} color={colors.text.ink} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.bg.cardSecondary }]} onPress={addFileBlock}>
              <Ionicons name="document-outline" size={16} color={colors.text.ink} />
            </TouchableOpacity>
          </View>

          {blocks.length > 0 && (
            <Text style={[typography.caption, { color: colors.text.muted, marginTop: 20, marginBottom: 8 }]}>
              CAPTURED BLOCKS — {blocks.length}
            </Text>
          )}
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={[styles.blockCard, { backgroundColor: colors.bg.card }]}>
          <View style={styles.blockCardContent}>
            <Text style={[typography.monoSmall, { color: colors.accent.clay }]}>
              {item.type.replace('_', ' ').toUpperCase()} #{index + 1}
            </Text>
            {item.textContent ? (
              <Text style={[typography.body, { color: colors.text.ink, marginTop: 4 }]}>{item.textContent}</Text>
            ) : null}
            {item.label ? (
              <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 2 }]}>{item.label}</Text>
            ) : null}
            {item.uri ? (
              <Text style={[typography.monoSmall, { color: colors.text.muted, marginTop: 2 }]} numberOfLines={1}>{item.uri.split('/').pop()}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => removeBlock(item.id)} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
      )}
      ListFooterComponent={
        blocks.length > 0 ? (
          <TouchableOpacity
            style={[styles.structureButton, { backgroundColor: colors.accent.clay, marginTop: 16 }]}
            onPress={structureIntoSteps}
            activeOpacity={0.8}
          >
            <Ionicons name="layers-outline" size={20} color={colors.text.inverse} />
            <Text style={[typography.button, { color: colors.text.inverse, marginLeft: 8 }]}>
              Structure into Step
            </Text>
          </TouchableOpacity>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  inputRow: {
    marginTop: 12,
  },
  textInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  blockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginVertical: 3,
  },
  blockCardContent: {
    flex: 1,
  },
  structureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
});
