import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useTemplates } from '../../src/context/TemplateContext';
import { useAlert } from '../../src/context/AlertContext';
import { useRouter } from 'expo-router';
import { typography } from '../../src/theme/typography';

export default function NewTemplateScreen() {
  const { colors } = useTheme();
  const { createTemplate } = useTemplates();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) {
      showAlert('Title required', 'Please give your template a name.');
      return;
    }
    const id = await createTemplate(title.trim(), description.trim());
    router.replace(`/templates/${id}/edit` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
      <Text style={[typography.h2, { color: colors.text.ink }]}>New Process</Text>
      <Text style={[typography.bodySmall, { color: colors.text.secondary, marginTop: 4 }]}>
        Document a multi-step process as a reusable template.
      </Text>

      <View style={[styles.inputGroup, { marginTop: 24 }]}>
        <Text style={[typography.caption, { color: colors.text.muted, marginBottom: 6 }]}>NAME</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
          placeholder="e.g. US Visa Application"
          placeholderTextColor={colors.text.muted}
          value={title}
          onChangeText={setTitle}
          autoFocus
        />
      </View>

      <View style={[styles.inputGroup, { marginTop: 16 }]}>
        <Text style={[typography.caption, { color: colors.text.muted, marginBottom: 6 }]}>DESCRIPTION (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.bg.input, color: colors.text.ink, borderColor: colors.border }]}
          placeholder="Briefly describe what this process covers"
          placeholderTextColor={colors.text.muted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent.clay, marginTop: 32 }]}
        onPress={handleCreate}
        activeOpacity={0.8}
      >
        <Text style={[typography.button, { color: colors.text.inverse }]}>Create Template</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {},
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
});
