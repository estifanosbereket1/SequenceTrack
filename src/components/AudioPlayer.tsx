import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { loadAudioModule } from '../utils/audio';
import { typography } from '../theme/typography';

interface AudioPlayerProps {
  uri: string;
  durationSeconds?: number | null;
}

const BAR_COUNT = 40;
const SPEEDS = [1, 1.5, 2] as const;

function generateWaveform(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    hash = (hash * 9301 + 49297) % 233280;
    bars.push(0.15 + (hash / 233280) * 0.85);
  }
  return bars;
}

export default function AudioPlayer({ uri, durationSeconds }: AudioPlayerProps) {
  const { colors } = useTheme();
  const [player, setPlayer] = useState<any>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [loading, setLoading] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformWidthRef = useRef(1);

  const waveform = useMemo(() => generateWaveform(uri), [uri]);

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

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const onWaveformLayout = useCallback((e: LayoutChangeEvent) => {
    waveformWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const togglePlay = () => {
    if (!player) return;
    if (playing) {
      player.pause();
      setPlaying(false);
      clearTimer();
    } else {
      if (duration > 0 && currentTime >= duration - 0.3) {
        player.seekTo(0);
        setCurrentTime(0);
      }
      player.play();
      setPlaying(true);
      intervalRef.current = setInterval(() => {
        const ct = player.currentTime ?? 0;
        setCurrentTime(ct);
        if (player.duration > 0 && player.duration !== duration) {
          setDuration(player.duration);
        }
        if (player.duration > 0 && ct >= player.duration - 0.3) {
          player.pause();
          setPlaying(false);
          clearTimer();
        }
      }, 250);
    }
  };

  const cycleSpeed = () => {
    if (!player) return;
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    player.setPlaybackRate(SPEEDS[next]);
  };

  const handleSeek = async (e: any) => {
    if (!player || duration <= 0) return;
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / waveformWidthRef.current));
    const seekTime = ratio * duration;
    await player.seekTo(seekTime);
    setCurrentTime(seekTime);
  };

  const progress = duration > 0 ? currentTime / duration : 0;

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
          size={28}
          color={colors.accent.clay}
        />
      </TouchableOpacity>

      <Text style={[typography.monoSmall, { color: colors.text.muted, width: 34, textAlign: 'center' }]}>
        {timeStr(currentTime)}
      </Text>

      <Pressable onPress={handleSeek} style={[styles.waveformContainer, { marginHorizontal: 6 }]}>
        <View onLayout={onWaveformLayout} style={styles.waveformRow}>
          {waveform.map((h, i) => {
            const filled = i / BAR_COUNT <= progress;
            return (
              <View
                key={i}
                style={{
                  width: 3,
                  height: Math.max(3, h * 36),
                  borderRadius: 1.5,
                  backgroundColor: filled ? colors.accent.clay : colors.border,
                  marginRight: 2,
                }}
              />
            );
          })}
        </View>
      </Pressable>

      <Text style={[typography.monoSmall, { color: colors.text.muted, width: 34, textAlign: 'center' }]}>
        {timeStr(duration)}
      </Text>

      <TouchableOpacity onPress={cycleSpeed} hitSlop={6} style={[styles.speedPill, { borderColor: colors.border }]}>
        <Text style={[typography.monoSmall, { color: colors.text.muted, fontSize: 11 }]}>
          {SPEEDS[speedIndex]}×
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  playBtn: {
    marginRight: 6,
  },
  waveformContainer: {
    flex: 1,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 4,
  },
});
