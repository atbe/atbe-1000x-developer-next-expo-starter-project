import { useRouter } from "expo-router";
import { Crown } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProtectedRoute } from "../components/auth/protected-route";
import { BottomNavigation } from "../components/ui/bottom-navigation";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { trpc } from "../lib/trpc/client";
import { useAuthStore } from "../stores/auth-store";

export function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Fetch subscription status
  const { data: subscription, isLoading: isLoadingSubscription } =
    trpc.subscription.getMySubscription.useQuery();

  return (
    <ProtectedRoute>
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="px-4 py-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-3xl font-bold text-foreground">
                  Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
                </Text>
                <Text className="text-base text-muted-foreground mt-1">
                  Here's your activity overview
                </Text>
              </View>
            </View>

            <Card className="mb-6">
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <Crown
                    size={20}
                    color={
                      subscription?.tier === "premium" ? "#EAB308" : "#666"
                    }
                  />
                  <CardTitle>Current Plan</CardTitle>
                </View>
              </CardHeader>
              <CardContent>
                {isLoadingSubscription ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <View className="gap-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium">Plan</Text>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          subscription?.tier === "premium"
                            ? "bg-yellow-500"
                            : "bg-secondary"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            subscription?.tier === "premium"
                              ? "text-white"
                              : "text-secondary-foreground"
                          }`}
                        >
                          {subscription?.tier === "premium"
                            ? "Premium"
                            : "Free"}
                        </Text>
                      </View>
                    </View>

                    {subscription?.tier === "free" && (
                      <Button
                        onPress={() => router.push("/pricing")}
                        className="w-full bg-purple-600"
                      >
                        <Text className="text-white font-medium">
                          Upgrade to Premium
                        </Text>
                      </Button>
                    )}
                  </View>
                )}
              </CardContent>
            </Card>
          </View>
        </ScrollView>
        <BottomNavigation />
      </SafeAreaView>
    </ProtectedRoute>
  );
}
