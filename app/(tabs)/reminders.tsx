import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useReminders } from '../../src/context/ReminderContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime } from '../../src/utils/date';
import { typography } from '../../src/theme/typography';

export default function RemindersTab() {
  const { colors } = useTheme();
  const { reminders, cancelReminder } = useReminders();
  const router = useRouter();

  const handleCancel = (item: { id: number; notification_id: string; title: string }) => {
    Alert.alert(
      'Cancel Reminder',
      `Stop "${item.title}"?`,
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel Reminder', style: 'destructive', onPress: () => cancelReminder(item.id, item.notification_id) },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      {reminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.text.muted} />
          <Text style={[typography.body, { color: colors.text.secondary, marginTop: 12, textAlign: 'center' }]}>
            No reminders set.{'\n'}Schedule them from a running process.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.bg.card }]}
              onLongPress={() => handleCancel(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.bg.cardSecondary }]}>
                <Ionicons name="alarm-outline" size={22} color={colors.accent.clay} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[typography.body, { color: colors.text.ink, fontWeight: '600' }]}>{item.title}</Text>
                <Text style={[typography.monoSmall, { color: colors.text.muted, marginTop: 2 }]}>
                  {formatDateTime(item.scheduled_at)}
                </Text>
                {item.repeat_rule ? (
                  <Text style={[typography.caption, { color: colors.accent.clay, marginTop: 2 }]}>
                    Repeats {item.repeat_rule}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => handleCancel(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle-outline" size={22} color={colors.text.muted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
});
