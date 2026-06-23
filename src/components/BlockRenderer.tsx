import { View, Text, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';
import type { InstanceBlock } from '../types';
import { formatDateTime } from '../utils/date';

interface BlockRendererProps {
  block: InstanceBlock;
  onToggleChecklist?: (block: InstanceBlock) => void;
  readOnly?: boolean;
}

export default function BlockRenderer({ block, onToggleChecklist, readOnly }: BlockRendererProps) {
  const { colors } = useTheme();

  switch (block.type) {
    case 'text':
      return (
        <View style={[styles.block, { backgroundColor: colors.bg.card }]}>
          <Text style={[typography.body, { color: colors.text.ink }]}>{block.text_content}</Text>
        </View>
      );

    case 'checklist_item':
      return (
        <TouchableOpacity
          style={[styles.block, { backgroundColor: colors.bg.card, flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => !readOnly && onToggleChecklist?.(block)}
          disabled={readOnly}
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
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[
              typography.body,
              {
                color: block.completed ? colors.text.muted : colors.text.ink,
                textDecorationLine: block.completed ? 'line-through' : 'none',
              },
            ]}>
              {block.text_content}
            </Text>
            {block.completed_at && (
              <Text style={[typography.monoSmall, { color: colors.text.muted, marginTop: 2 }]}>
                {formatDateTime(block.completed_at)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );

    case 'photo':
      return (
        <View style={[styles.block, { backgroundColor: colors.bg.card, padding: 0, overflow: 'hidden' }]}>
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
          style={[styles.block, { backgroundColor: colors.bg.card, flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => Linking.openURL(block.uri || block.text_content || '')}
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
        <View style={[styles.block, { backgroundColor: colors.bg.card, flexDirection: 'row', alignItems: 'center' }]}>
          <Ionicons name="document-outline" size={18} color={colors.accent.clay} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={[typography.body, { color: colors.text.ink }]}>
              {block.label || block.uri?.split('/').pop() || 'Attachment'}
            </Text>
          </View>
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  block: {
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
});
