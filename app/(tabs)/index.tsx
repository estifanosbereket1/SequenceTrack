import { View, Text, FlatList, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useInstances } from '../../src/context/InstanceContext';
import { useTemplates } from '../../src/context/TemplateContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../src/utils/date';
import { typography } from '../../src/theme/typography';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { instances } = useInstances();
  const { templates } = useTemplates();
  const router = useRouter();

  const activeInstances = instances.filter(i => i.status !== 'done');

  const sections = [
    {
      title: 'Active Processes',
      data: activeInstances.length > 0
        ? activeInstances.map(i => ({ type: 'instance' as const, data: i }))
        : [{ type: 'empty-instances' as const, data: null }],
    },
    {
      title: 'Templates',
      data: templates.length > 0
        ? templates.map(t => ({ type: 'template' as const, data: t }))
        : [{ type: 'empty-templates' as const, data: null }],
    },
  ];

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'empty-instances') {
      return (
        <TouchableOpacity
          style={[styles.emptyCard, { backgroundColor: colors.bg.card, borderColor: colors.border }]}
          onPress={() => router.push('/templates' as any)}
        >
          <Ionicons name="play-circle-outline" size={32} color={colors.accent.clay} />
          <Text style={[typography.body, { color: colors.text.secondary, marginTop: 8, textAlign: 'center' }]}>
            No active processes.{'\n'}Start one from a template.
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.type === 'empty-templates') {
      return (
        <TouchableOpacity
          style={[styles.emptyCard, { backgroundColor: colors.bg.card, borderColor: colors.border }]}
          onPress={() => router.push('/templates/new' as any)}
        >
          <Ionicons name="add-circle-outline" size={32} color={colors.accent.clay} />
          <Text style={[typography.body, { color: colors.text.secondary, marginTop: 8, textAlign: 'center' }]}>
            No templates yet.{'\n'}Create your first one.
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.type === 'instance') {
      const instance = item.data;
      const statusColor = instance.status === 'in_progress' ? colors.accent.clay : colors.status.done;
      const statusLabel = instance.status === 'in_progress' ? 'In Progress' : 'Done';

      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.bg.card }]}
          onPress={() => router.push(`/instances/${instance.id}` as any)}
          activeOpacity={0.7}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.statusIndicator, { borderColor: statusColor, backgroundColor: instance.status === 'done' ? colors.status.done : 'transparent' }]} />
            <View style={styles.cardContent}>
              <Text style={[typography.h3, { color: colors.text.ink }]}>{instance.name}</Text>
              <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
                {instance.template_title} · {formatDate(instance.started_at)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </TouchableOpacity>
      );
    }

    if (item.type === 'template') {
      const template = item.data;
      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.bg.card }]}
          onPress={() => router.push(`/instances/new?templateId=${template.id}` as any)}
          activeOpacity={0.7}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.templateIcon, { backgroundColor: colors.bg.cardSecondary }]}>
              <Ionicons name="document-text" size={20} color={colors.accent.clay} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[typography.h3, { color: colors.text.ink }]}>{template.title}</Text>
              {template.description ? (
                <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 2 }]} numberOfLines={1}>
                  {template.description}
                </Text>
              ) : null}
            </View>
          </View>
          <Text style={[typography.caption, { color: colors.accent.clay }]}>Start</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={[typography.caption, { color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }]}>
            {section.title}
          </Text>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 14,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  statusIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
