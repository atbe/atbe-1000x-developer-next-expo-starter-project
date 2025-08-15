import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  LogOut,
  User,
  Clock,
  Shield,
  ChevronRight,
  Info,
  Mail,
  Calendar,
  Key,
} from "lucide-react-native";
import { useAuthStore } from "../stores/auth-store";
import { BottomNavigation } from "../components/ui/bottom-navigation";

interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  email?: string;
  [key: string]: any;
}

function parseJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return decoded;
  } catch {
    return null;
  }
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "Expired";

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, userInfo, token, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [jwtPayload, setJwtPayload] = useState<JWTPayload | null>(null);

  useEffect(() => {
    if (token) {
      const payload = parseJWT(token);
      setJwtPayload(payload);

      if (payload?.exp) {
        const updateCountdown = () => {
          const now = Math.floor(Date.now() / 1000);
          const remaining = (payload.exp ?? 0) - now;
          setTimeRemaining(remaining);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
      }
    }
  }, [token]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{ paddingHorizontal: 24, paddingTop: 0, paddingBottom: 32 }}
        >
          <Text
            style={{
              fontSize: 34,
              fontWeight: Platform.OS === "ios" ? "700" : "bold",
              color: "#111827",
              letterSpacing: -0.4,
              marginBottom: 8,
            }}
          >
            Settings
          </Text>
          <Text
            style={{
              fontSize: 17,
              fontWeight: Platform.OS === "ios" ? "400" : "normal",
              color: "#6B7280",
              lineHeight: 22,
            }}
          >
            Manage your account and preferences
          </Text>
        </View>

        {/* User Profile Card */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
              padding: 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  backgroundColor: "#3B82F6",
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 20,
                  shadowColor: "#3B82F6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <User size={36} color="white" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: Platform.OS === "ios" ? "700" : "bold",
                    color: "#111827",
                    letterSpacing: -0.3,
                    marginBottom: 8,
                  }}
                >
                  {user?.name || "User"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Mail size={16} color="#6B7280" strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: Platform.OS === "ios" ? "500" : "normal",
                      color: "#6B7280",
                      marginLeft: 8,
                    }}
                  >
                    {user?.email || "No email available"}
                  </Text>
                </View>
              </View>
            </View>

            {user?.roles && user.roles.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#EFF6FF",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Shield size={18} color="#3B82F6" strokeWidth={2} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: Platform.OS === "ios" ? "600" : "bold",
                    color: "#1D4ED8",
                    marginLeft: 8,
                  }}
                >
                  {user.roles.join(", ")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Authentication Status */}
        {token && jwtPayload && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 4,
                padding: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: "#DCFCE7",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Key size={22} color="#16A34A" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: Platform.OS === "ios" ? "700" : "bold",
                    color: "#111827",
                    letterSpacing: -0.3,
                  }}
                >
                  Authentication
                </Text>
              </View>

              <View>
                <View style={{ marginBottom: 20 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Clock size={18} color="#6B7280" strokeWidth={2} />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: Platform.OS === "ios" ? "500" : "normal",
                        color: "#6B7280",
                        marginLeft: 8,
                      }}
                    >
                      Token Expires In
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 28,
                      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                      fontWeight: Platform.OS === "ios" ? "700" : "bold",
                      color:
                        timeRemaining && timeRemaining > 0
                          ? timeRemaining > 3600
                            ? "#16A34A"
                            : "#EA580C"
                          : "#DC2626",
                      letterSpacing: 0.5,
                    }}
                  >
                    {timeRemaining !== null
                      ? formatTimeRemaining(timeRemaining)
                      : "Unknown"}
                  </Text>
                </View>

                {jwtPayload.exp && (
                  <View
                    style={{
                      paddingTop: 16,
                      borderTopWidth: 1,
                      borderTopColor: "#F3F4F6",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Calendar size={18} color="#6B7280" strokeWidth={2} />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: Platform.OS === "ios" ? "500" : "normal",
                          color: "#6B7280",
                          marginLeft: 8,
                        }}
                      >
                        Expires At
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily:
                          Platform.OS === "ios" ? "Menlo" : "monospace",
                        fontWeight: Platform.OS === "ios" ? "600" : "bold",
                        color: "#111827",
                      }}
                    >
                      {formatDate(jwtPayload.exp)}
                    </Text>
                  </View>
                )}

                {jwtPayload.iat && (
                  <View
                    style={{
                      paddingTop: 16,
                      borderTopWidth: 1,
                      borderTopColor: "#F3F4F6",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Calendar size={18} color="#6B7280" strokeWidth={2} />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: Platform.OS === "ios" ? "500" : "normal",
                          color: "#6B7280",
                          marginLeft: 8,
                        }}
                      >
                        Issued At
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily:
                          Platform.OS === "ios" ? "Menlo" : "monospace",
                        fontWeight: Platform.OS === "ios" ? "600" : "bold",
                        color: "#111827",
                      }}
                    >
                      {formatDate(jwtPayload.iat)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Debug Information */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
              padding: 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#F3E8FF",
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Info size={22} color="#8B5CF6" strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: Platform.OS === "ios" ? "700" : "bold",
                  color: "#111827",
                  letterSpacing: -0.3,
                }}
              >
                Debug Information
              </Text>
            </View>

            <View>
              {/* User Object */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: Platform.OS === "ios" ? "600" : "bold",
                    color: "#374151",
                    marginBottom: 12,
                  }}
                >
                  User Object
                </Text>
                <View
                  style={{
                    backgroundColor: "#F9FAFB",
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                      fontSize: 13,
                      lineHeight: 18,
                      color: "#1F2937",
                    }}
                  >
                    {JSON.stringify(user, null, 2)}
                  </Text>
                </View>
              </View>

              {/* UserInfo Object */}
              {userInfo && (
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: Platform.OS === "ios" ? "600" : "bold",
                      color: "#374151",
                      marginBottom: 12,
                    }}
                  >
                    UserInfo Object
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#F9FAFB",
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily:
                          Platform.OS === "ios" ? "Menlo" : "monospace",
                        fontSize: 13,
                        lineHeight: 18,
                        color: "#1F2937",
                      }}
                    >
                      {JSON.stringify(userInfo, null, 2)}
                    </Text>
                  </View>
                </View>
              )}

              {/* JWT Payload */}
              {jwtPayload && (
                <View>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: Platform.OS === "ios" ? "600" : "bold",
                      color: "#374151",
                      marginBottom: 12,
                    }}
                  >
                    JWT Payload
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#F9FAFB",
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily:
                          Platform.OS === "ios" ? "Menlo" : "monospace",
                        fontSize: 13,
                        lineHeight: 18,
                        color: "#1F2937",
                      }}
                    >
                      {JSON.stringify(jwtPayload, null, 2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <View style={{ paddingHorizontal: 24 }}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.85}
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#FEF2F2",
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <LogOut size={22} color="#EF4444" strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: Platform.OS === "ios" ? "600" : "bold",
                  color: "#EF4444",
                }}
              >
                Sign Out
              </Text>
            </View>
            <ChevronRight size={22} color="#EF4444" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
  );
}
