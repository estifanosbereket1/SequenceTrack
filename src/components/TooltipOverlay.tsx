import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

interface TooltipOverlayProps {
  visible: boolean;
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onDismiss: () => void;
}

export default function TooltipOverlay({ visible, message, iconName, onDismiss }: TooltipOverlayProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <TouchableOpacity activeOpacity={1} style={[styles.card, { backgroundColor: colors.bg.card }]}>
          {iconName ? (
            <Ionicons name={iconName} size={40} color={colors.accent.clay} style={{ marginBottom: 12 }} />
          ) : null}
          <Text style={[typography.body, { color: colors.text.ink, textAlign: 'center', lineHeight: 22 }]}>
            {message}
          </Text>
          <TouchableOpacity
            style={[styles.gotItBtn, { backgroundColor: colors.accent.clay, marginTop: 20 }]}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={[typography.button, { color: colors.text.inverse }]}>Got it</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  gotItBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
});
