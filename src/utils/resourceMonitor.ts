import { create } from 'zustand';

interface ResourceState {
  loadingResources: Map<string, boolean>;
  errors: Map<string, Error>;
  setLoading: (resourceId: string, isLoading: boolean) => void;
  setError: (resourceId: string, error: Error | null) => void;
  getLoadingState: (resourceId: string) => boolean;
  getError: (resourceId: string) => Error | null;
  clearResource: (resourceId: string) => void;
}

export const useResourceMonitor = create<ResourceState>((set, get) => ({
  loadingResources: new Map(),
  errors: new Map(),
  
  setLoading: (resourceId: string, isLoading: boolean) =>
    set((state) => {
      const newLoadingResources = new Map(state.loadingResources);
      if (isLoading) {
        newLoadingResources.set(resourceId, true);
      } else {
        newLoadingResources.delete(resourceId);
      }
      return { loadingResources: newLoadingResources };
    }),
    
  setError: (resourceId: string, error: Error | null) =>
    set((state) => {
      const newErrors = new Map(state.errors);
      if (error) {
        newErrors.set(resourceId, error);
      } else {
        newErrors.delete(resourceId);
      }
      return { errors: newErrors };
    }),
    
  getLoadingState: (resourceId: string) =>
    get().loadingResources.get(resourceId) || false,
    
  getError: (resourceId: string) =>
    get().errors.get(resourceId) || null,
    
  clearResource: (resourceId: string) =>
    set((state) => {
      const newLoadingResources = new Map(state.loadingResources);
      const newErrors = new Map(state.errors);
      newLoadingResources.delete(resourceId);
      newErrors.delete(resourceId);
      return {
        loadingResources: newLoadingResources,
        errors: newErrors,
      };
    }),
}));

export const monitorResourceLoad = async <T>(
  resourceId: string,
  loadFn: () => Promise<T>
): Promise<T> => {
  const monitor = useResourceMonitor.getState();
  
  try {
    monitor.setLoading(resourceId, true);
    monitor.setError(resourceId, null);
    const result = await loadFn();
    return result;
  } catch (error) {
    monitor.setError(resourceId, error as Error);
    throw error;
  } finally {
    monitor.setLoading(resourceId, false);
  }
}; 