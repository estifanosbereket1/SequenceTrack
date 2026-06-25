import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Share, TextInput, Modal, Platform } from 'react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useInstances } from '../../../src/context/InstanceContext';
import { useReminders } from '../../../src/context/ReminderContext';
import { useAlert } from '../../../src/context/AlertContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../../src/theme/typography';
import { formatDate, formatDateTime } from '../../../src/utils/date';
import { exportInstancePdf } from '../../../src/utils/pdf';
import TooltipOverlay from '../../../src/components/TooltipOverlay';
import { getAppMetaValue, setAppMeta } from '../../../src/db/appMeta';

export default function InstanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const instanceId = parseInt(id, 10);
  const { colors } = useTheme();
  const { currentInstance, loadInstance, updateInstanceStatus, deleteInstance } = useInstances();
  const { scheduleReminder } = useReminders();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const seen = await getAppMetaValue('tooltip_seen_instance_detail');
      if (seen !== 'true') setTooltipVisible(true);
    })();
  }, []);

  const dismissTooltip = async () => {
    setTooltipVisible(false);
    await setAppMeta('tooltip_seen_instance_detail', 'true');
  };

  const [showReminderPicker, setShowReminderPicker] = useState(false);

  useEffect(() => {
    loadInstance(instanceId);
  }, [instanceId]);

  const instance = currentInstance?.instance;
  const steps = currentInstance?.steps ?? [];

  const doneSteps = steps.filter(s => s.status === 'done').length;
  const progress = steps.length > 0 ? Math.round((doneSteps / steps.length) * 100) : 0;

  const handleExportPdf = async () => {
    if (!instance) return;
    await exportInstancePdf(instance, steps);
  };

  const handleDelete = () => {
    showAlert('Delete Instance', 'This will remove all progress data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteInstance(instanceId);
        router.back();
      }},
    ]);
  };

  const handleScheduleReminder = () => {
    if (Platform.OS === 'ios') {
      (Alert as any).prompt(
        'Schedule Reminder',
        'What should we remind you about?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Schedule',
            onPress: (text: string | undefined) => {
              if (!text) return;
              const date = new Date(Date.now() + 86400000);
              scheduleReminder(instanceId, null, text, date, null);
              showAlert('Reminder set', `For ${formatDateTime(date.toISOString())}`);
            },
          },
        ],
        'plain-text',
        `Reminder: ${instance?.name ?? ''}`
      );
    } else {
      showAlert('Schedule Reminder', 'Reminder scheduling text input not available on Android via Alert.');
    }
  };

  if (!instance) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.paper, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.body, { color: colors.text.secondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <View style={[styles.headerCard, { backgroundColor: colors.bg.card }]}>
        <View style={styles.headerTop}>
          <Text style={[typography.h2, { color: colors.text.ink, flex: 1 }]}>{instance.name}</Text>
          <View style={[styles.statusBadge, {
            backgroundColor: instance.status === 'done' ? colors.status.doneLight : (instance.status === 'in_progress' ? colors.bg.cardSecondary : 'transparent'),
          }]}>
            <Text style={[typography.monoSmall, {
              color: instance.status === 'done' ? colors.status.done : colors.accent.clay,
            }]}>
              {instance.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <Text style={[typography.monoSmall, { color: colors.text.muted, marginTop: 4 }]}>
          {instance.template_title} · {formatDate(instance.started_at)}
        </Text>

        <View style={[styles.progressBar, { backgroundColor: colors.bg.cardSecondary, marginTop: 12 }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: instance.status === 'done' ? colors.status.done : colors.accent.clay }]} />
        </View>
        <Text style={[typography.monoSmall, { color: colors.text.muted, marginTop: 4 }]}>
          {doneSteps}/{steps.length} steps done
        </Text>

        <View style={styles.headerActions}>
          {instance.status !== 'done' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.status.doneLight }]}
              onPress={() => updateInstanceStatus(instanceId, 'done')}
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.status.done} />
              <Text style={[typography.caption, { color: colors.status.done, marginLeft: 4 }]}>Mark done</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bg.cardSecondary }]} onPress={handleExportPdf}>
            <Ionicons name="document-outline" size={18} color={colors.accent.clay} />
            <Text style={[typography.caption, { color: colors.accent.clay, marginLeft: 4 }]}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bg.cardSecondary }]} onPress={handleScheduleReminder}>
            <Ionicons name="alarm-outline" size={18} color={colors.accent.clay} />
            <Text style={[typography.caption, { color: colors.accent.clay, marginLeft: 4 }]}>Remind</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.status.overdueLight }]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.status.overdue} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={steps}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: step, index }) => {
          const isDone = step.status === 'done';
          const isInProgress = step.status === 'in_progress';
          const checklistBlocks = step.blocks.filter(b => b.type === 'checklist_item');
          const checkedItems = checklistBlocks.filter(b => b.completed).length;
          const allChecked = checklistBlocks.length > 0 && checkedItems === checklistBlocks.length;

          return (
            <TouchableOpacity
              style={[styles.stepCard, { backgroundColor: colors.bg.card, opacity: isDone ? 0.7 : 1 }]}
              onPress={() => router.push(`/instances/${instanceId}/step/${step.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.stepCardLeft}>
                <View style={[
                  styles.stepIndicator,
                  {
                    borderColor: isDone ? colors.status.done : (isInProgress ? colors.accent.clay : colors.status.notStarted),
                    backgroundColor: isDone ? colors.status.done : 'transparent',
                  },
                ]}>
                  {isDone && <Ionicons name="checkmark" size={14} color={colors.text.inverse} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.body, {
                    color: isDone ? colors.text.muted : colors.text.ink,
                    fontWeight: '600',
                    textDecorationLine: isDone ? 'line-through' : 'none',
                  }]}>
                    {step.title}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                    <Text style={[typography.monoSmall, { color: colors.text.muted }]}>
                      {step.blocks.length} blocks
                    </Text>
                    {checklistBlocks.length > 0 && (
                      <Text style={[typography.monoSmall, { color: allChecked ? colors.status.done : colors.text.muted }]}>
                        {checkedItems}/{checklistBlocks.length} checked
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          );
        }}
      />
      <TooltipOverlay
        visible={tooltipVisible}
        message="Tap a step to view its blocks and check items off."
        iconName="checkbox-outline"
        onDismiss={dismissTooltip}
      />
    </View>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 6,
  },
  stepCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
