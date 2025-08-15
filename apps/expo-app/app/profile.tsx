import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Bell,
  Shield,
  ChevronRight,
} from "lucide-react-native";
import { ProtectedRoute } from "../components/auth/protected-route";
import { BottomNavigation } from "../components/ui/bottom-navigation";
import { useAuthStore } from "../stores/auth-store";

export default function ProfileScreen() {
  const { user } = useAuthStore();

  const profileItems = [
    {
      icon: Bell,
      label: "Notifications",
      value: "Enabled",
      onPress: () => {},
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      value: "",
      onPress: () => {},
    },
    {
      icon: Phone,
      label: "Support",
      value: "",
      onPress: () => {},
    },
  ];

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
              Profile
            </Text>
            <Text
              style={{
                fontSize: 17,
                fontWeight: Platform.OS === "ios" ? "400" : "normal",
                color: "#6B7280",
                lineHeight: 22,
              }}
            >
              Manage your account information
            </Text>
          </View>

          {/* Profile Header */}
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
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 96,
                    height: 96,
                    backgroundColor: "#3B82F6",
                    borderRadius: 24,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    shadowColor: "#3B82F6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <User size={48} color="white" strokeWidth={2} />
                </View>

                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: Platform.OS === "ios" ? "700" : "bold",
                    color: "#111827",
                    letterSpacing: -0.3,
                    marginBottom: 12,
                  }}
                >
                  {user?.name || "User Name"}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 24,
                  }}
                >
                  <Mail size={18} color="#6B7280" strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: Platform.OS === "ios" ? "500" : "normal",
                      color: "#6B7280",
                      marginLeft: 8,
                    }}
                  >
                    {user?.email || "user@example.com"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#EFF6FF",
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <Edit3 size={18} color="#3B82F6" strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: Platform.OS === "ios" ? "600" : "bold",
                      color: "#1D4ED8",
                      marginLeft: 8,
                    }}
                  >
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Profile Information */}
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
                    backgroundColor: "#F0FDF4",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <User size={22} color="#16A34A" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: Platform.OS === "ios" ? "700" : "bold",
                    color: "#111827",
                    letterSpacing: -0.3,
                  }}
                >
                  Personal Information
                </Text>
              </View>

              <View>
                <View style={{ marginBottom: 20 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <User size={18} color="#6B7280" strokeWidth={2} />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: Platform.OS === "ios" ? "500" : "normal",
                          color: "#6B7280",
                          marginLeft: 12,
                        }}
                      >
                        Full Name
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: Platform.OS === "ios" ? "600" : "bold",
                        color: "#111827",
                      }}
                    >
                      {user?.name || "Not set"}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    marginBottom: 20,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: "#F3F4F6",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Mail size={18} color="#6B7280" strokeWidth={2} />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: Platform.OS === "ios" ? "500" : "normal",
                          color: "#6B7280",
                          marginLeft: 12,
                        }}
                      >
                        Email
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: Platform.OS === "ios" ? "600" : "bold",
                        color: "#111827",
                      }}
                    >
                      {user?.email || "Not set"}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    marginBottom: 20,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: "#F3F4F6",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Phone size={18} color="#6B7280" strokeWidth={2} />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: Platform.OS === "ios" ? "500" : "normal",
                          color: "#6B7280",
                          marginLeft: 12,
                        }}
                      >
                        Phone
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: Platform.OS === "ios" ? "600" : "bold",
                        color: "#111827",
                      }}
                    >
                      Not set
                    </Text>
                  </View>
                </View>

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
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <MapPin size={18} color="#6B7280" strokeWidth={2} />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: Platform.OS === "ios" ? "500" : "normal",
                          color: "#6B7280",
                          marginLeft: 12,
                        }}
                      >
                        Location
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: Platform.OS === "ios" ? "600" : "bold",
                        color: "#111827",
                      }}
                    >
                      Not set
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Profile Settings */}
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
                    backgroundColor: "#FEF3C7",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Shield size={22} color="#D97706" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: Platform.OS === "ios" ? "700" : "bold",
                    color: "#111827",
                    letterSpacing: -0.3,
                  }}
                >
                  Settings
                </Text>
              </View>

              <View>
                {profileItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={item.onPress}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 16,
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: "#F3F4F6",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <IconComponent
                          size={22}
                          color="#6B7280"
                          strokeWidth={2}
                        />
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: Platform.OS === "ios" ? "600" : "bold",
                            color: "#111827",
                            marginLeft: 12,
                          }}
                        >
                          {item.label}
                        </Text>
                      </View>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        {item.value && (
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight:
                                Platform.OS === "ios" ? "500" : "normal",
                              color: "#6B7280",
                              marginRight: 8,
                            }}
                          >
                            {item.value}
                          </Text>
                        )}
                        <ChevronRight
                          size={20}
                          color="#6B7280"
                          strokeWidth={2}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>

        <BottomNavigation />
      </SafeAreaView>
    </ProtectedRoute>
  );
}
