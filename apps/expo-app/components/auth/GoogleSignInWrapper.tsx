import React from "react";
import { View, Text } from "react-native";
import { isGoogleSignInAvailable } from "../../utils/platform";
import { Button } from "../ui/button";

interface GoogleSignInWrapperProps {
  onPress: () => void;
  disabled?: boolean;
}

// Safe wrapper that conditionally renders Google Sign-In
export function GoogleSignInWrapper({
  onPress,
  disabled,
}: GoogleSignInWrapperProps) {
  if (!isGoogleSignInAvailable()) {
    return (
      <View className="items-center py-4">
        <Text className="text-gray-500 text-sm text-center">
          Google Sign-In is not available in Expo Go.{"\n"}
          Use development build for Google Sign-In.
        </Text>
      </View>
    );
  }

  // Import Google Sign-In button only when not in Expo Go
  let GoogleSigninButton: any;
  try {
     
    GoogleSigninButton =
      require("@react-native-google-signin/google-signin").GoogleSigninButton;
  } catch (_error) {
    // Fallback if import fails
    return (
      <Button onPress={onPress} disabled={disabled} variant="outline">
        Continue with Google
      </Button>
    );
  }

  return (
    <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={onPress}
      disabled={disabled}
    />
  );
}
