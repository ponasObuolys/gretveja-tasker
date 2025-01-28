import { create } from 'zustand';

interface ConnectionState {
  isOnline: boolean;
  isReconnecting: boolean;
  lastOnlineTime: number | null;
  setOnline: (status: boolean) => void;
  setReconnecting: (status: boolean) => void;
  updateLastOnlineTime: () => void;
}

export const useConnectionState = create<ConnectionState>((set) => ({
  isOnline: navigator.onLine,
  isReconnecting: false,
  lastOnlineTime: navigator.onLine ? Date.now() : null,
  setOnline: (status) => set({ isOnline: status }),
  setReconnecting: (status) => set({ isReconnecting: status }),
  updateLastOnlineTime: () => set({ lastOnlineTime: Date.now() }),
}));

export const initializeConnectionStateListeners = () => {
  const connectionState = useConnectionState.getState();

  window.addEventListener('online', () => {
    connectionState.setOnline(true);
    connectionState.updateLastOnlineTime();
    connectionState.setReconnecting(false);
  });

  window.addEventListener('offline', () => {
    connectionState.setOnline(false);
    connectionState.setReconnecting(true);
  });

  return () => {
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  };
};