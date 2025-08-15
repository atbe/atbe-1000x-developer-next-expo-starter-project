import AsyncStorage from "@react-native-async-storage/async-storage";
import { type AppConfig } from "@starterp/api";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ConfigState {
  config: AppConfig | null;
  hasLoadedConfig: boolean;

  // Actions
  setConfig: (config: AppConfig) => void;
  setHasLoadedConfig: (loaded: boolean) => void;
  clearConfig: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: null,
      hasLoadedConfig: false,

      setConfig: (config) => {
        set({ config, hasLoadedConfig: true });
      },

      setHasLoadedConfig: (loaded) => {
        set({ hasLoadedConfig: loaded });
      },

      clearConfig: () => {
        set({ config: null, hasLoadedConfig: false });
      },
    }),
    {
      name: "app-config-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
