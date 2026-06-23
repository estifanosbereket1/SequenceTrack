import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useInstances } from '../../src/context/InstanceContext';
import { useTemplates } from '../../src/context/TemplateContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../src/theme/typography';
import { todayString } from '../../src/utils/date';

export default function NewInstanceScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const tid = parseInt(templateId ?? '0', 10);
  const { colors } = useTheme();
  const { createInstanceFromTemplate } = useInstances();
  const { templates, loadTemplate, currentTemplate } = useTemplates();
  const router = useRouter();

  const template = templates.find(t => t.id === tid) ?? currentTemplate?.template;
  const [name, setName] = useState('');

  useEffect(() => {
    if (tid) {
      loadTemplate(tid);
    }
  }, [tid]);

  useEffect(() => {
    if (template && !name) {
      const dateStr = todayString();
      setName(`${template.title} — ${dateStr}`);
    }
  }, [template?.id]);

  const handleStart = async () => {
    if (!template) return;
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this instance a name.');
      return;
    }
    const id = await createInstanceFromTemplate(template.id, name.trim());
    router.replace(`/instances/${id}` as any);
  };

  if (!template) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.paper, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.body, { color: colors.text.secondary }]}>Template not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <Text style={[typography.h2, { color: colors.text.ink }]}>Start Process</Text>
      <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4 }]}>
        Create a live run of "{template.title}".
      </Text>

      <View style={[styles.templateInfo, { backgroundColor: colors.bg.card, borderColor: colors.border, marginTop: 24 }]}>
        <Ionicons name="document-text" size={24} color={colors.accent.clay} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[typography.body, { color: colors.text.ink, fontWeight: '600' }]}>{template.title}</Text>
          {template.description ? (
            <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 2 }]}>{template.description}</Text>
          ) : null}
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={[typography.caption, { color: colors.text.muted, marginBottom: 6 }]}>INSTANCE NAME</Text>
        <TextInput
          style={[styles.nameInput, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Name this run"
          placeholderTextColor={colors.text.muted}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: colors.accent.clay, marginTop: 32 }]}
        onPress={handleStart}
        activeOpacity={0.8}
      >
        <Ionicons name="play" size={20} color={colors.text.inverse} />
        <Text style={[typography.button, { color: colors.text.inverse, marginLeft: 8 }]}>Start process</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  nameInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
});
