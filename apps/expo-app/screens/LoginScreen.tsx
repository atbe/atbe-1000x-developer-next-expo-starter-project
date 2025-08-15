import React, { useState } from "react";
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignInWrapper } from "../components/auth/GoogleSignInWrapper";
import { useLogin } from "../hooks/useLogin";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loginWithGoogle, isLoading } = useLogin();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const result = await login({ email, password });

    if (!result.success && result.error) {
      Alert.alert("Error", result.error);
    }
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();

    if (!result.success && result.error) {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Welcome to Starter Project</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="mb-4"
              />
              <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="mb-6"
              />
              <Button
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
              >
                Sign In
              </Button>

              <View className="relative my-4">
                <View className="absolute inset-0 flex items-center">
                  <View className="w-full border-t border-gray-300" />
                </View>
                <View className="relative flex justify-center">
                  <View className="bg-background px-2">
                    <Text className="text-gray-500 text-sm">Or</Text>
                  </View>
                </View>
              </View>

              <GoogleSignInWrapper
                onPress={handleGoogleLogin}
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
