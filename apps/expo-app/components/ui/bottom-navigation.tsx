import React from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Settings, User, BarChart3 } from "lucide-react-native";
import { cn } from "../../lib/utils";

interface TabItem {
  name: string;
  route: string;
  icon: typeof Home;
  label: string;
}

const tabs: TabItem[] = [
  {
    name: "dashboard",
    route: "/dashboard",
    icon: Home,
    label: "Home",
  },
  {
    name: "analytics",
    route: "/analytics",
    icon: BarChart3,
    label: "Analytics",
  },
  {
    name: "profile",
    route: "/profile",
    icon: User,
    label: "Profile",
  },
  {
    name: "settings",
    route: "/settings",
    icon: Settings,
    label: "Settings",
  },
];

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isTabActive = (route: string) => {
    return pathname === route;
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50"
      style={{
        paddingBottom: Platform.OS === "ios" ? insets.bottom : 16,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: -1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <View className="flex-row px-4 pt-2">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.route);
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => {
                if (!isActive) {
                  router.push(tab.route);
                }
              }}
              className="flex-1 items-center py-2"
              style={{
                opacity: isActive ? 1 : 0.6,
              }}
              activeOpacity={0.7}
            >
              <View
                className={cn(
                  "items-center justify-center rounded-full p-1.5 mb-1",
                  isActive && "bg-blue-500/10"
                )}
              >
                <IconComponent
                  size={24}
                  color={isActive ? "#3B82F6" : "#6B7280"}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>
              <Text
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-blue-500" : "text-gray-500"
                )}
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? "600" : "500",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
