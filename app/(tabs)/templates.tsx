import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useTemplates } from '../../src/context/TemplateContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../src/utils/date';
import { typography } from '../../src/theme/typography';
import TooltipOverlay from '../../src/components/TooltipOverlay';
import { getAppMetaValue, setAppMeta } from '../../src/db/appMeta';

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const { templates, deleteTemplate } = useTemplates();
  const router = useRouter();
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const seen = await getAppMetaValue('tooltip_seen_templates');
      if (seen !== 'true') setTooltipVisible(true);
    })();
  }, []);

  const dismissTooltip = async () => {
    setTooltipVisible(false);
    await setAppMeta('tooltip_seen_templates', 'true');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.accent.clay }]}
        onPress={() => router.push('/templates/new' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={22} color={colors.text.inverse} />
        <Text style={[typography.button, { color: colors.text.inverse, marginLeft: 8 }]}>
          New Template
        </Text>
      </TouchableOpacity>

      {templates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={colors.text.muted} />
          <Text style={[typography.body, { color: colors.text.secondary, marginTop: 12, textAlign: 'center' }]}>
            No processes documented yet.{'\n'}Start one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.bg.card }]}
              onPress={() => router.push(`/templates/${item.id}/edit` as any)}
              onLongPress={() => deleteTemplate(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={[typography.h3, { color: colors.text.ink }]}>{item.title}</Text>
                {item.description ? (
                  <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4 }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={[typography.monoSmall, { color: colors.text.muted, marginTop: 6 }]}>
                  Updated {formatDate(item.updated_at)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        />
      )}
      <TooltipOverlay
        visible={tooltipVisible}
        message="To create a template, tap New Template at the top."
        iconName="document-text-outline"
        onDismiss={dismissTooltip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 14,
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
  cardContent: {
    flex: 1,
  },
});
