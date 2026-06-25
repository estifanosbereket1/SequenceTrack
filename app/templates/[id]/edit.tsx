import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ScrollView,
} from 'react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useTemplates } from '../../../src/context/TemplateContext';
import { useAlert } from '../../../src/context/AlertContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../../src/theme/typography';
import type { TemplateStep, TemplateBlock, BlockType } from '../../../src/types';
import * as MediaUtils from '../../../src/utils/media';

type BlockFormData = {
  type: BlockType;
  textContent: string;
  label: string;
  uri: string | null;
};

export default function EditTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = parseInt(id, 10);
  const { colors } = useTheme();
  const {
    currentTemplate, loadTemplate, updateTemplate, deleteTemplate,
    addStep, updateStep, removeStep, moveStepUp, moveStepDown,
    addBlock, removeBlock, updateBlock, moveBlockUp, moveBlockDown,
    createTemplate,
  } = useTemplates();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newStepTitle, setNewStepTitle] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [blockForms, setBlockForms] = useState<Record<number, { visible: boolean; data: BlockFormData }>>({});

  useEffect(() => {
    loadTemplate(templateId);
  }, [templateId]);

  useEffect(() => {
    if (currentTemplate?.template) {
      setTitle(currentTemplate.template.title);
      setDescription(currentTemplate.template.description);
    }
  }, [currentTemplate?.template?.id]);

  const handleSaveTemplate = async () => {
    await updateTemplate(templateId, title, description);
    showAlert('Saved', 'Template updated.');
  };

  const handleDeleteTemplate = () => {
    showAlert('Delete Template', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteTemplate(templateId);
        router.back();
      }},
    ]);
  };

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return;
    await addStep(templateId, newStepTitle.trim());
    setNewStepTitle('');
  };

  const toggleStep = (stepId: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const handleAddBlock = async (stepId: number, data: BlockFormData) => {
    await addBlock(stepId, data.type, data.textContent || null, data.uri, data.label || null);
    setBlockForms(prev => ({ ...prev, [stepId]: { visible: false, data: { type: 'text', textContent: '', label: '', uri: null } } }));
  };

  const pickPhotoForBlock = async () => {
    const result = await MediaUtils.pickPhoto();
    return result?.uri ?? null;
  };

  const pickFileForBlock = async () => {
    const result = await MediaUtils.pickFile();
    return result ? { uri: result.uri, name: result.name } : null;
  };

  const steps = currentTemplate?.steps ?? [];

  const renderBlock = (block: TemplateBlock) => (
    <View key={block.id} style={[styles.blockRow, { borderLeftColor: colors.border }]}>
      <View style={styles.blockContent}>
        <View style={styles.blockTypeBadge}>
          <Text style={[typography.monoSmall, { color: colors.accent.clay }]}>
            {block.type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        {block.text_content ? (
          <Text style={[typography.bodySmall, { color: colors.text.ink, marginTop: 4 }]}>{block.text_content}</Text>
        ) : null}
        {block.label ? (
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 2 }]}>{block.label}</Text>
        ) : null}
        {block.uri ? (
          <Text style={[typography.monoSmall, { color: colors.text.muted, marginTop: 2 }]} numberOfLines={1}>
            {block.uri.split('/').pop()}
          </Text>
        ) : null}
      </View>
      <View style={styles.blockActions}>
        <TouchableOpacity onPress={() => removeBlock(block.step_id, block.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.status.overdue} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep = ({ item: step, index }: { item: TemplateStep; index: number }) => {
    const isExpanded = expandedSteps.has(step.id);
    const blockForm = blockForms[step.id] ?? { visible: false, data: { type: 'text' as BlockType, textContent: '', label: '', uri: null } };

    return (
      <View style={[styles.stepCard, { backgroundColor: colors.bg.card, marginTop: index === 0 ? 0 : 8 }]}>
        <TouchableOpacity
          style={styles.stepHeader}
          onPress={() => toggleStep(step.id)}
          activeOpacity={0.7}
        >
          <View style={styles.stepHeaderLeft}>
            <Text style={[typography.monoSmall, { color: colors.text.muted, marginRight: 8 }]}>
              {(index + 1).toString().padStart(2, '0')}
            </Text>
            <Text style={[typography.h3, { color: colors.text.ink, flex: 1 }]}>{step.title}</Text>
          </View>
          <View style={styles.stepHeaderActions}>
            <TouchableOpacity
              onPress={() => moveStepUp(templateId, steps, index)}
              disabled={index === 0}
              hitSlop={8}
            >
              <Ionicons name="chevron-up" size={18} color={index === 0 ? colors.text.muted : colors.text.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => moveStepDown(templateId, steps, index)}
              disabled={index === steps.length - 1}
              hitSlop={8}
            >
              <Ionicons name="chevron-down" size={18} color={index === steps.length - 1 ? colors.text.muted : colors.text.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                showAlert('Delete Step', `Remove "${step.title}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeStep(step.id) },
                ]);
              }}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.status.overdue} />
            </TouchableOpacity>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.muted} />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.stepBody}>
            {step.blocks.map((block, bi) => (
              <View key={block.id}>
                {renderBlock(block)}
                {bi < step.blocks.length - 1 && <View style={[styles.blockDivider, { backgroundColor: colors.divider }]} />}
              </View>
            ))}

            {blockForm.visible ? (
              <View style={[styles.blockForm, { backgroundColor: colors.bg.cardSecondary, borderColor: colors.border }]}>
                <View style={styles.blockTypeSelector}>
                  {(['text', 'checklist_item', 'photo', 'link', 'file'] as BlockType[]).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.blockTypeChip,
                        { borderColor: colors.border },
                        blockForm.data.type === type && { backgroundColor: colors.accent.clay, borderColor: colors.accent.clay },
                      ]}
                      onPress={() => setBlockForms(prev => ({
                        ...prev,
                        [step.id]: { ...prev[step.id], data: { ...prev[step.id]?.data ?? { textContent: '', label: '', uri: null }, type } },
                      }))}
                    >
                      <Text style={[
                        typography.monoSmall,
                        { color: blockForm.data.type === type ? colors.text.inverse : colors.text.muted },
                      ]}>
                        {type.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {blockForm.data.type === 'photo' ? (
                  <TouchableOpacity
                    style={[styles.mediaButton, { borderColor: colors.border }]}
                    onPress={async () => {
                      const uri = await pickPhotoForBlock();
                      if (uri) {
                        setBlockForms(prev => ({
                          ...prev,
                          [step.id]: { ...prev[step.id], data: { ...prev[step.id].data, uri } },
                        }));
                      }
                    }}
                  >
                    <Ionicons name="camera-outline" size={20} color={colors.accent.clay} />
                    <Text style={[typography.bodySmall, { color: colors.text.secondary, marginLeft: 8 }]}>
                      {blockForm.data.uri ? 'Photo selected' : 'Pick a photo'}
                    </Text>
                  </TouchableOpacity>
                ) : blockForm.data.type === 'file' ? (
                  <TouchableOpacity
                    style={[styles.mediaButton, { borderColor: colors.border }]}
                    onPress={async () => {
                      const result = await pickFileForBlock();
                      if (result) {
                        setBlockForms(prev => ({
                          ...prev,
                          [step.id]: {
                            ...prev[step.id],
                            data: { ...prev[step.id].data, uri: result.uri, label: result.name },
                          },
                        }));
                      }
                    }}
                  >
                    <Ionicons name="document-outline" size={20} color={colors.accent.clay} />
                    <Text style={[typography.bodySmall, { color: colors.text.secondary, marginLeft: 8 }]}>
                      {blockForm.data.label ?? 'Pick a document'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    style={[styles.blockInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
                    placeholder={blockForm.data.type === 'checklist_item' ? 'Checklist item label' : blockForm.data.type === 'link' ? 'URL' : 'Text content'}
                    placeholderTextColor={colors.text.muted}
                    value={blockForm.data.textContent}
                    onChangeText={text => setBlockForms(prev => ({
                      ...prev,
                      [step.id]: { ...prev[step.id], data: { ...prev[step.id].data, textContent: text } },
                    }))}
                  />
                )}
                {blockForm.data.type === 'link' && (
                  <TextInput
                    style={[styles.blockInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border, marginTop: 8 }]}
                    placeholder="Label (optional)"
                    placeholderTextColor={colors.text.muted}
                    value={blockForm.data.label}
                    onChangeText={text => setBlockForms(prev => ({
                      ...prev,
                      [step.id]: { ...prev[step.id], data: { ...prev[step.id].data, label: text } },
                    }))}
                  />
                )}

                <View style={styles.blockFormActions}>
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: colors.accent.clay }]}
                    onPress={() => handleAddBlock(step.id, blockForm.data)}
                  >
                    <Text style={[typography.caption, { color: colors.text.inverse }]}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: colors.bg.cardSecondary }]}
                    onPress={() => setBlockForms(prev => ({ ...prev, [step.id]: { visible: false, data: { type: 'text', textContent: '', label: '', uri: null } } }))}
                  >
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addBlockButton, { borderColor: colors.border }]}
                onPress={() => setBlockForms(prev => ({ ...prev, [step.id]: { visible: true, data: { type: 'text', textContent: '', label: '', uri: null } } }))}
              >
                <Ionicons name="add" size={18} color={colors.accent.clay} />
                <Text style={[typography.bodySmall, { color: colors.accent.clay, marginLeft: 6 }]}>Add block</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg.paper }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.headerFields}>
        <TextInput
          style={[styles.titleInput, { color: colors.text.ink }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Template name"
          placeholderTextColor={colors.text.muted}
        />
        <TextInput
          style={[styles.descInput, { color: colors.text.secondary }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor={colors.text.muted}
          multiline
        />
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSaveTemplate} style={[styles.headerButton, { backgroundColor: colors.accent.clay }]}>
            <Text style={[typography.caption, { color: colors.text.inverse }]}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteTemplate} style={[styles.headerButton, { backgroundColor: colors.status.overdueLight }]}>
            <Text style={[typography.caption, { color: colors.status.overdue }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[typography.caption, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>
          STEPS — {steps.length}
        </Text>

        {steps.map((step, index) => renderStep({ item: step, index }))}

        <View style={[styles.addStepRow, { borderColor: colors.border }]}>
          <TextInput
            style={[styles.addStepInput, { color: colors.text.ink }]}
            placeholder="New step title"
            placeholderTextColor={colors.text.muted}
            value={newStepTitle}
            onChangeText={setNewStepTitle}
            onSubmitEditing={handleAddStep}
          />
          <TouchableOpacity onPress={handleAddStep} style={[styles.addStepButton, { backgroundColor: colors.accent.clay }]}>
            <Ionicons name="add" size={20} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerFields: {
    padding: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    paddingVertical: 8,
  },
  descInput: {
    fontSize: 15,
    paddingVertical: 8,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  section: {
    paddingHorizontal: 16,
  },
  stepCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  stepHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 2,
    paddingLeft: 12,
    paddingVertical: 6,
  },
  blockContent: {
    flex: 1,
  },
  blockTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  blockActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  blockDivider: {
    height: 1,
    marginLeft: 12,
  },
  blockForm: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  blockTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  blockTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  blockInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  blockFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  smallButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  addStepInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  addStepButton: {
    padding: 12,
  },
});
