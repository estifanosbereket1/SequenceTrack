import { useState, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'document-text-outline', title: 'Templates', desc: 'Create reusable templates for your multi-step processes.' },
  { icon: 'play-circle-outline', title: 'Instances', desc: 'Start a live run from any template and track progress step by step.' },
  { icon: 'book-outline', title: 'Learnings', desc: 'Capture knowledge, notes, and voice memos as you go.' },
  { icon: 'notifications-outline', title: 'Reminders', desc: 'Schedule reminders so you never miss a step.' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WalkthroughModalProps {
  visible: boolean;
  onSkip: () => void;
  onDone: () => void;
}

export default function WalkthroughModal({ visible, onSkip, onDone }: WalkthroughModalProps) {
  const { colors } = useTheme();
  const [page, setPage] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const isLast = page === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      onDone();
    } else {
      flatRef.current?.scrollToIndex({ index: page + 1, animated: true });
      setPage(page + 1);
    }
  };

  const onMomentumEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setPage(idx);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={[styles.container, { backgroundColor: colors.bg.paper }]}>
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn} hitSlop={12}>
          <Text style={[typography.body, { color: colors.text.muted }]}>Skip</Text>
        </TouchableOpacity>

        <FlatList
          ref={flatRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.bg.cardSecondary }]}>
                <Ionicons name={item.icon} size={56} color={colors.accent.clay} />
              </View>
              <Text style={[typography.h2, { color: colors.text.ink, marginTop: 24, textAlign: 'center' }]}>
                {item.title}
              </Text>
              <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32, lineHeight: 22 }]}>
                {item.desc}
              </Text>
            </View>
          )}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === page ? colors.accent.clay : colors.border },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.accent.clay }]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={[typography.button, { color: colors.text.inverse }]}>
              {isLast ? 'Done' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
  },
});
