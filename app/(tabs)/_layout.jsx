import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/src/auth/AuthContext";

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: COLORS.primary }}>
      <Tabs.Screen name="index" options={{ title: "Recipes", tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" color={color} size={size} /> }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} /> }} />
      <Tabs.Screen name="favorites" options={{ title: "Favorites", tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} /> }} />
    </Tabs>
  );
}
