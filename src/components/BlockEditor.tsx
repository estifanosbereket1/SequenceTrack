import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';
import type { BlockType } from '../types';
import * as MediaUtils from '../utils/media';

interface BlockEditorProps {
  onAdd: (type: BlockType, textContent: string | null, uri: string | null, label: string | null) => void;
  onCancel: () => void;
}

export default function BlockEditor({ onAdd, onCancel }: BlockEditorProps) {
  const { colors } = useTheme();
  const [type, setType] = useState<BlockType>('text');
  const [textContent, setTextContent] = useState('');
  const [label, setLabel] = useState('');
  const [uri, setUri] = useState<string | null>(null);

  const handleAdd = () => {
    if (type === 'photo' && !uri) return;
    if (type === 'file' && !uri) return;
    if ((type === 'text' || type === 'checklist_item' || type === 'link') && !textContent.trim()) return;
    onAdd(type, textContent.trim() || null, uri, label.trim() || null);
  };

  const pickPhoto = async () => {
    const result = await MediaUtils.pickPhoto();
    if (result) setUri(result.uri);
  };

  const pickFile = async () => {
    const result = await MediaUtils.pickFile();
    if (result) {
      setUri(result.uri);
      setLabel(result.name);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.cardSecondary, borderColor: colors.border }]}>
      <View style={styles.typeRow}>
        {(['text', 'checklist_item', 'photo', 'link', 'file'] as BlockType[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[
              styles.typeChip,
              { borderColor: colors.border },
              type === t && { backgroundColor: colors.accent.clay, borderColor: colors.accent.clay },
            ]}
            onPress={() => { setType(t); setUri(null); }}
          >
            <Text style={[
              typography.monoSmall,
              { color: type === t ? colors.text.inverse : colors.text.muted },
            ]}>
              {t.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'photo' ? (
        <TouchableOpacity style={[styles.mediaBtn, { borderColor: colors.border }]} onPress={pickPhoto}>
          <Ionicons name="camera-outline" size={20} color={colors.accent.clay} />
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginLeft: 8 }]}>
            {uri ? 'Photo selected' : 'Pick a photo'}
          </Text>
        </TouchableOpacity>
      ) : type === 'file' ? (
        <TouchableOpacity style={[styles.mediaBtn, { borderColor: colors.border }]} onPress={pickFile}>
          <Ionicons name="document-outline" size={20} color={colors.accent.clay} />
          <Text style={[typography.bodySmall, { color: colors.text.secondary, marginLeft: 8 }]}>
            {label || 'Pick a document'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
          placeholder={type === 'link' ? 'URL' : type === 'checklist_item' ? 'Checklist item' : 'Text'}
          placeholderTextColor={colors.text.muted}
          value={textContent}
          onChangeText={setTextContent}
          multiline={type === 'text'}
        />
      )}

      {type === 'link' && (
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border, marginTop: 8 }]}
          placeholder="Label (optional)"
          placeholderTextColor={colors.text.muted}
          value={label}
          onChangeText={setLabel}
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent.clay }]} onPress={handleAdd}>
          <Text style={[typography.caption, { color: colors.text.inverse }]}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.bg.cardSecondary }]} onPress={onCancel}>
          <Text style={[typography.caption, { color: colors.text.secondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
});
