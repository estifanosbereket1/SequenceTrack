import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({ progress, size = 40, strokeWidth = 3 }: ProgressRingProps) {
  const { colors } = useTheme();
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderColor: colors.status.notStarted }]}>
      <View style={[styles.center, { backgroundColor: colors.bg.card, width: size - strokeWidth * 2, height: size - strokeWidth * 2, borderRadius: (size - strokeWidth * 2) / 2 }]}>
        <Text style={[typography.monoSmall, { color: colors.text.ink }]}>
          {Math.round(clampedProgress)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
