import React from "react";
import { View, Text, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react-native";
import { ProtectedRoute } from "../components/auth/protected-route";
import { BottomNavigation } from "../components/ui/bottom-navigation";

export default function AnalyticsScreen() {
  return (
    <ProtectedRoute>
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1"
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
              Analytics
            </Text>
            <Text
              style={{
                fontSize: 17,
                fontWeight: Platform.OS === "ios" ? "400" : "normal",
                color: "#6B7280",
                lineHeight: 22,
              }}
            >
              Track your performance metrics
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 16,
                    elevation: 4,
                    padding: 20,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: "#DCFCE7",
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TrendingUp size={20} color="#16A34A" strokeWidth={2} />
                    </View>
                    <View
                      style={{
                        backgroundColor: "#DCFCE7",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: Platform.OS === "ios" ? "600" : "bold",
                          color: "#16A34A",
                        }}
                      >
                        +12%
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: Platform.OS === "ios" ? "700" : "bold",
                      color: "#111827",
                      marginBottom: 4,
                    }}
                  >
                    2,847
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: Platform.OS === "ios" ? "500" : "normal",
                      color: "#6B7280",
                    }}
                  >
                    Total Views
                  </Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 16,
                    elevation: 4,
                    padding: 20,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: "#DBEAFE",
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Users size={20} color="#3B82F6" strokeWidth={2} />
                    </View>
                    <View
                      style={{
                        backgroundColor: "#DBEAFE",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: Platform.OS === "ios" ? "600" : "bold",
                          color: "#3B82F6",
                        }}
                      >
                        +8%
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: Platform.OS === "ios" ? "700" : "bold",
                      color: "#111827",
                      marginBottom: 4,
                    }}
                  >
                    1,234
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: Platform.OS === "ios" ? "500" : "normal",
                      color: "#6B7280",
                    }}
                  >
                    Active Users
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Chart Placeholder */}
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
                  <BarChart3 size={22} color="#8B5CF6" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: Platform.OS === "ios" ? "700" : "bold",
                    color: "#111827",
                    letterSpacing: -0.3,
                  }}
                >
                  Performance Overview
                </Text>
              </View>

              <View
                style={{
                  height: 192,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#F3F4F6",
                }}
              >
                <BarChart3 size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: Platform.OS === "ios" ? "500" : "normal",
                    color: "#6B7280",
                    marginTop: 12,
                  }}
                >
                  Chart visualization coming soon
                </Text>
              </View>
            </View>
          </View>

          {/* Revenue Card */}
          <View style={{ paddingHorizontal: 24 }}>
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
                  <DollarSign size={22} color="#16A34A" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: Platform.OS === "ios" ? "700" : "bold",
                    color: "#111827",
                    letterSpacing: -0.3,
                  }}
                >
                  Revenue
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 36,
                  fontWeight: Platform.OS === "ios" ? "700" : "bold",
                  color: "#111827",
                  marginBottom: 12,
                  letterSpacing: -0.5,
                }}
              >
                $12,847
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#DCFCE7",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  alignSelf: "flex-start",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: Platform.OS === "ios" ? "600" : "bold",
                    color: "#16A34A",
                  }}
                >
                  +15% from last month
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <BottomNavigation />
      </SafeAreaView>
    </ProtectedRoute>
  );
}
