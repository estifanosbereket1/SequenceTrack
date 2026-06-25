import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface StyledAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export default function StyledAlert({ visible, title, message, buttons, onDismiss }: StyledAlertProps) {
  const { colors } = useTheme();

  const handlePress = (btn: AlertButton) => {
    onDismiss?.();
    btn.onPress?.();
  };

  const isStack = (buttons?.length ?? 0) > 2;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.bg.card }]}>
          <Text style={[typography.h3, { color: colors.text.ink, textAlign: 'center', marginBottom: 4 }]}>
            {title}
          </Text>
          {message ? (
            <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginBottom: 16, lineHeight: 20 }]}>
              {message}
            </Text>
          ) : null}
          <View style={[isStack ? styles.verticalButtons : styles.horizontalButtons, { borderColor: colors.divider }]}>
            {(buttons ?? [{ text: 'OK' }]).map((btn, i) => {
              const isFirst = i === 0;
              const isLast = i === (buttons?.length ?? 1) - 1;
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handlePress(btn)}
                  style={[
                    styles.button,
                    isStack && styles.buttonStacked,
                    isStack && isFirst && { borderTopLeftRadius: 10, borderTopRightRadius: 10 },
                    isStack && isLast && { borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
                    !isStack && isFirst && { borderRightWidth: 0.5, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
                    !isStack && isLast && { borderTopRightRadius: 10, borderBottomRightRadius: 10 },
                    { borderColor: colors.divider },
                  ]}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      typography.button,
                      {
                        color: isDestructive
                          ? colors.status.overdue
                          : isCancel
                            ? colors.text.muted
                            : colors.accent.clay,
                        textAlign: 'center',
                      },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  horizontalButtons: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    marginHorizontal: -20,
  },
  verticalButtons: {
    borderTopWidth: 0.5,
    marginHorizontal: -20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStacked: {
    borderBottomWidth: 0.5,
  },
});
