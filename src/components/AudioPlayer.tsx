import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { loadAudioModule } from '../utils/audio';
import { typography } from '../theme/typography';

interface AudioPlayerProps {
  uri: string;
  durationSeconds?: number | null;
}

export default function AudioPlayer({ uri, durationSeconds }: AudioPlayerProps) {
  const { colors } = useTheme();
  const [player, setPlayer] = useState<any>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await loadAudioModule();
      if (!mod || !mounted) {
        setLoading(false);
        return;
      }
      try {
        const p = mod.createAudioPlayer(uri);
        setPlayer(p);
        if (durationSeconds) {
          setDuration(durationSeconds);
        }
      } catch {
        // fallback
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (player?.release) player.release();
    };
  }, [uri]);

  const togglePlay = () => {
    if (!player) return;
    if (playing) {
      player.pause();
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      player.play();
      setPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentTime(player.currentTime ?? 0);
      }, 250);
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const remaining = Math.max(0, duration - currentTime);
  const timeStr = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.card }]}>
        <Text style={[typography.bodySmall, { color: colors.text.muted }]}>Loading audio...</Text>
      </View>
    );
  }

  if (!player) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.card }]}>
        <Ionicons name="musical-note-outline" size={20} color={colors.text.muted} />
        <Text style={[typography.bodySmall, { color: colors.text.muted, marginLeft: 8 }]}>
          Audio not available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.card }]}>
      <TouchableOpacity onPress={togglePlay} hitSlop={8} style={styles.playBtn}>
        <Ionicons
          name={playing ? 'pause-circle' : 'play-circle'}
          size={32}
          color={colors.accent.clay}
        />
      </TouchableOpacity>
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, progress * 100)}%`, backgroundColor: colors.accent.clay },
            ]}
          />
        </View>
        <Text style={[typography.monoSmall, { color: colors.text.muted, marginTop: 2 }]}>
          {timeStr(currentTime)} / {timeStr(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  playBtn: {
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
