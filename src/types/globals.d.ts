interface WakeLockApi {
  request: (type: 'screen') => Promise<WakeLockSentinel>;
}

interface WakeLockSentinel {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
  removeEventListener: (type: 'release', listener: () => void) => void;
}

interface Navigator {
  wakeLock?: WakeLockApi;
  standalone?: boolean;
}

interface Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  va?: (cb: (a: { name: string; value: number; id: string }) => void) => void;
}
