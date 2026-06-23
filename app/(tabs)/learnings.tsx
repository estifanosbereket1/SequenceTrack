import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useLearnings } from '../../src/context/LearningContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../src/theme/typography';
import { formatDate } from '../../src/utils/date';

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[-*]\s/g, '')
    .replace(/\d+\.\s/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function getAttachmentIcons(entry: any): string[] {
  if (!entry.attachments) return [];
  const icons: string[] = [];
  for (const a of entry.attachments) {
    if (a.type === 'photo' && !icons.includes('camera')) icons.push('camera');
    if (a.type === 'file' && !icons.includes('document')) icons.push('document');
    if (a.type === 'voice' && !icons.includes('mic')) icons.push('mic');
  }
  return icons;
}

export default function LearningsTab() {
  const { colors } = useTheme();
  const { entries } = useLearnings();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.accent.clay }]}
        onPress={() => router.push('/learnings/new' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={22} color={colors.text.inverse} />
        <Text style={[typography.button, { color: colors.text.inverse, marginLeft: 8 }]}>
          New Entry
        </Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color={colors.text.muted} />
            <Text style={[typography.body, { color: colors.text.secondary, marginTop: 12, textAlign: 'center' }]}>
              Nothing learned yet.{'\n'}Jot something down.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {entries.map((entry) => {
              const snippet = stripMarkdown(entry.body_markdown).substring(0, 120);
              const icons = getAttachmentIcons(entry);
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.card, { backgroundColor: colors.bg.card }]}
                  onPress={() => router.push(`/learnings/${entry.id}` as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[typography.h3, { color: colors.text.ink }]} numberOfLines={1}>
                    {entry.title || snippet.substring(0, 60) || 'Untitled'}
                  </Text>
                  {entry.title && snippet ? (
                    <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4 }]} numberOfLines={2}>
                      {snippet}
                    </Text>
                  ) : null}
                  <View style={styles.cardMeta}>
                    <Text style={[typography.monoSmall, { color: colors.text.muted }]}>
                      {formatDate(entry.created_at)}
                    </Text>
                    {icons.length > 0 && (
                      <View style={styles.iconRow}>
                        {icons.map((icon) => (
                          <Ionicons
                            key={icon}
                            name={
                              icon === 'camera' ? 'camera-outline' :
                              icon === 'document' ? 'document-outline' : 'mic-outline'
                            }
                            size={14}
                            color={colors.accent.clay}
                            style={{ marginLeft: 6 }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
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
    padding: 14,
    borderRadius: 14,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
