import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';
import type { InstanceStep } from '../types';

interface StepListProps {
  steps: InstanceStep[];
  onStepPress: (step: InstanceStep) => void;
}

export default function StepList({ steps, onStepPress }: StepListProps) {
  const { colors } = useTheme();

  return (
    <View>
      {steps.map((step, index) => {
        const isDone = step.status === 'done';
        const checklistBlocks = step.blocks.filter(b => b.type === 'checklist_item');
        const checkedItems = checklistBlocks.filter(b => b.completed).length;

        return (
          <TouchableOpacity
            key={step.id}
            style={[styles.stepRow, { backgroundColor: colors.bg.card, opacity: isDone ? 0.65 : 1 }]}
            onPress={() => onStepPress(step)}
            activeOpacity={0.7}
          >
            <Text style={[typography.monoSmall, { color: colors.text.muted, width: 24 }]}>
              {(index + 1).toString().padStart(2, '0')}
            </Text>
            <View style={[styles.indicator, {
              borderColor: isDone ? colors.status.done : (step.status === 'in_progress' ? colors.accent.clay : colors.status.notStarted),
              backgroundColor: isDone ? colors.status.done : 'transparent',
            }]}>
              {isDone && <Ionicons name="checkmark" size={12} color={colors.text.inverse} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.body, {
                color: isDone ? colors.text.muted : colors.text.ink,
                fontWeight: '600',
                textDecorationLine: isDone ? 'line-through' : 'none',
              }]}>
                {step.title}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
                <Text style={[typography.monoSmall, { color: colors.text.muted }]}>
                  {step.blocks.length} blocks
                </Text>
                {checklistBlocks.length > 0 && (
                  <Text style={[typography.monoSmall, { color: checkedItems === checklistBlocks.length ? colors.status.done : colors.text.muted }]}>
                    {checkedItems}/{checklistBlocks.length}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
