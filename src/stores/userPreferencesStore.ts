import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserPreferences {
  notifyNewTasks: boolean;
  notifyOverdueTasks: boolean;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
}

interface UserPreferencesState extends UserPreferences {
  setPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      notifyNewTasks: true,
      notifyOverdueTasks: true,
      firstName: null,
      lastName: null,
      email: null,
      role: null,
      setPreference: (key, value) => set((state) => ({ [key]: value })),
      setPreferences: (preferences) => set((state) => ({ ...preferences })),
    }),
    {
      name: "user-preferences",
    }
  )
);