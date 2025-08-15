import React, { useEffect, useReducer } from "react";
import { View, ActivityIndicator } from "react-native";
import { useConfigStore } from "../stores/config-store";
import { trpc } from "../lib/trpc/client";

interface ConfigProviderProps {
  children: React.ReactNode;
}

interface ConfigState {
  isLoading: boolean;
  hasFetched: boolean;
}

type ConfigAction =
  | { type: "TIMEOUT" }
  | { type: "DATA_RECEIVED" }
  | { type: "ERROR_OCCURRED" }
  | { type: "CACHED_CONFIG_AVAILABLE" }
  | { type: "SET_LOADING"; payload: boolean };

function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
  switch (action.type) {
    case "TIMEOUT":
      return { ...state, isLoading: false };
    case "DATA_RECEIVED":
      return { isLoading: false, hasFetched: true };
    case "ERROR_OCCURRED":
      return { isLoading: false, hasFetched: true };
    case "CACHED_CONFIG_AVAILABLE":
      return { ...state, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [state, dispatch] = useReducer(configReducer, {
    isLoading: true,
    hasFetched: false,
  });

  const { config, setConfig, hasLoadedConfig } = useConfigStore();

  const { data, error } = trpc.appConfig.getConfig.useQuery(undefined, {
    enabled: !state.hasFetched,
    retry: 1,
    staleTime: Infinity,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasLoadedConfig && !data) {
        console.log("Config fetch timed out, using cached config or defaults");
        dispatch({ type: "TIMEOUT" });
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [hasLoadedConfig, data]);

  useEffect(() => {
    if (data) {
      console.log("Fetched config:", data);
      setConfig(data);
      dispatch({ type: "DATA_RECEIVED" });
    }
  }, [data, setConfig]);

  useEffect(() => {
    if (error && !state.hasFetched) {
      console.error("Failed to fetch config:", error);
      dispatch({ type: "ERROR_OCCURRED" });
    }
  }, [error, state.hasFetched]);

  useEffect(() => {
    if (hasLoadedConfig && config) {
      dispatch({ type: "CACHED_CONFIG_AVAILABLE" });
    }
  }, [hasLoadedConfig, config]);

  console.log("config", config);

  if (state.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <>{children}</>;
}
