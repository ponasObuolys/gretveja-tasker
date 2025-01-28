interface FeatureSupport {
  resizeObserver: boolean;
  messagePort: boolean;
  sessionStorage: boolean;
  requestAnimationFrame: boolean;
  webWorker: boolean;
}

interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class FeatureDetector {
  private static instance: FeatureDetector;
  private support: FeatureSupport;
  private detectionPromise: Promise<FeatureSupport> | null = null;

  private constructor() {
    this.support = {
      resizeObserver: false,
      messagePort: false,
      sessionStorage: false,
      requestAnimationFrame: false,
      webWorker: false,
    };
  }

  static getInstance(): FeatureDetector {
    if (!FeatureDetector.instance) {
      FeatureDetector.instance = new FeatureDetector();
    }
    return FeatureDetector.instance;
  }

  async detect(): Promise<FeatureSupport> {
    if (this.detectionPromise) {
      return this.detectionPromise;
    }

    this.detectionPromise = new Promise((resolve) => {
      // Detect ResizeObserver
      this.support.resizeObserver = typeof ResizeObserver !== 'undefined';

      // Detect MessagePort and MessageChannel
      this.support.messagePort = typeof MessageChannel !== 'undefined';

      // Detect sessionStorage
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        this.support.sessionStorage = true;
      } catch {
        this.support.sessionStorage = false;
      }

      // Detect requestAnimationFrame
      this.support.requestAnimationFrame = typeof requestAnimationFrame !== 'undefined';

      // Detect Web Workers
      try {
        const blob = new Blob([''], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        worker.terminate();
        URL.revokeObjectURL(url);
        this.support.webWorker = true;
      } catch {
        this.support.webWorker = false;
      }

      resolve(this.support);
    });

    return this.detectionPromise;
  }

  getSupport(): FeatureSupport {
    return this.support;
  }

  hasResizeObserver(): boolean {
    return this.support.resizeObserver;
  }

  hasMessagePort(): boolean {
    return this.support.messagePort;
  }

  hasSessionStorage(): boolean {
    return this.support.sessionStorage;
  }

  hasRequestAnimationFrame(): boolean {
    return this.support.requestAnimationFrame;
  }

  hasWebWorker(): boolean {
    return this.support.webWorker;
  }
}

export const featureDetector = FeatureDetector.getInstance();

// Polyfills and fallbacks
export const safeRequestAnimationFrame = (callback: FrameRequestCallback): number => {
  if (featureDetector.hasRequestAnimationFrame()) {
    return requestAnimationFrame(callback);
  }
  return window.setTimeout(callback, 16);
};

export const safeCancelAnimationFrame = (handle: number): void => {
  if (featureDetector.hasRequestAnimationFrame()) {
    cancelAnimationFrame(handle);
  } else {
    window.clearTimeout(handle);
  }
};

export const createFallbackStorage = (): StorageInterface => {
  const memoryStorage = new Map<string, string>();

  return {
    getItem: (key: string): string | null => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string): void => {
      memoryStorage.delete(key);
    },
    clear: (): void => {
      memoryStorage.clear();
    },
  };
};

export const getStorage = (): StorageInterface => {
  if (featureDetector.hasSessionStorage()) {
    return sessionStorage;
  }
  return createFallbackStorage();
}; 