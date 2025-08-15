import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../providers/auth-provider";
import { useAuthStore } from "../stores/auth-store";
import { isGoogleSignInAvailable } from "../utils/platform";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const authStore = useAuthStore();
  const auth = useAuth();

  // Configure Google Sign-In only if available (not in Expo Go)
  if (isGoogleSignInAvailable()) {
    try {
      const {
        GoogleSignin,
         
      } = require("@react-native-google-signin/google-signin");
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
      });
    } catch (error) {
      console.warn("Failed to configure Google Sign-In:", error);
    }
  }

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with GoTrue
      console.log("signing in with gotrue");
      const { data, error: signInError } = await auth.signIn(
        credentials.email,
        credentials.password
      );

      if (signInError) {
        console.log("sign in error", signInError);
        setError(signInError.message || "Failed to sign in");
        return { success: false, error: signInError.message };
      }

      if (!data.user || !data.session) {
        console.log("invalid response from authentication service");
        setError("Invalid response from authentication service");
        return {
          success: false,
          error: "Invalid response from authentication service",
        };
      }

      // Extract user info and token
      const user = {
        id: data.user.id,
        email: data.user.email!,
        firstName: data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.lastName,
        name:
          data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        roles: data.user.app_metadata?.roles || [],
      };

      // Store in auth store
      console.log("storing user in auth store", user);
      authStore.login(user, data.session.access_token);

      // Navigate to dashboard
      console.log("navigating to dashboard");
      router.replace("/dashboard");

      console.log("returning success");
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<LoginResult> => {
    if (!isGoogleSignInAvailable()) {
      return {
        success: false,
        error: "Google Sign-In is not available in Expo Go",
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        GoogleSignin,
      } = require("@react-native-google-signin/google-signin");

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.data?.idToken) {
        const { data, error } = await auth.signInWithIdToken(
          userInfo.data.idToken
        );

        if (error) {
          setError(error.message || "Failed to sign in with Google");
          return { success: false, error: error.message };
        }

        if (!data.user || !data.session) {
          setError("Invalid response from authentication service");
          return {
            success: false,
            error: "Invalid response from authentication service",
          };
        }

        // Extract user info and token
        const user = {
          id: data.user.id,
          email: data.user.email || "",
          firstName: data.user.user_metadata?.firstName,
          lastName: data.user.user_metadata?.lastName,
          name:
            data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          roles: data.user.app_metadata?.roles || [],
        };

        // Store in auth store
        authStore.login(user, data.session.access_token);

        // Navigate to dashboard
        router.replace("/dashboard");

        return { success: true };
      } else {
        throw new Error("No ID token present!");
      }
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred";

      try {
        const {
          statusCodes,
        } = require("@react-native-google-signin/google-signin");
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          errorMessage = "Sign in was cancelled";
        } else if (err.code === statusCodes.IN_PROGRESS) {
          errorMessage = "Sign in is already in progress";
        } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          errorMessage = "Play services not available or outdated";
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
      } catch {
        // Fallback if statusCodes import fails
        errorMessage =
          err instanceof Error ? err.message : "Google Sign-In failed";
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    loginWithGoogle,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
