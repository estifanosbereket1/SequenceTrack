import { useRef, useEffect, useState } from 'react';
import { Animated, TouchableOpacity, AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface StampCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
}

export default function StampCheckbox({ checked, onToggle, size = 24 }: StampCheckboxProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const handlePress = () => {
    if (!checked && !reduceMotion) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onToggle();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={checked ? 'Checked' : 'Unchecked'}
    >
      <Animated.View
        style={[
          styles.checkbox,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: checked ? colors.status.done : colors.status.notStarted,
            backgroundColor: checked ? colors.status.done : 'transparent',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {checked && (
          <Ionicons name="checkmark" size={size * 0.7} color={colors.text.inverse} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
