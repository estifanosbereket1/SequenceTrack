type AudioModule = typeof import('expo-audio');

let modulePromise: Promise<AudioModule | null> | null = null;

async function loadAudioModule(): Promise<AudioModule | null> {
  if (modulePromise) return modulePromise;
  modulePromise = (async () => {
    try {
      return await import('expo-audio');
    } catch {
      return null;
    }
  })();
  return modulePromise;
}

export async function requestRecordingPermissions(): Promise<boolean> {
  const mod = await loadAudioModule();
  if (mod) {
    try {
      const { granted } = await mod.AudioModule.requestRecordingPermissionsAsync();
      return granted;
    } catch {
      return false;
    }
  }
  return false;
}

export async function setAudioModeForRecording(): Promise<void> {
  const mod = await loadAudioModule();
  if (mod) {
    try {
      await mod.setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    } catch {
      // fallback: no-op
    }
  }
}

export { loadAudioModule };
