// app/_layout.tsx
import { Slot, usePathname, router } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import SafeScreen from "@/components/SafeScreen";
import { AuthProvider, useAuth } from "@/src/auth/AuthContext";

function AuthGate() {
  const { accessToken, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const inAuthStack = pathname?.startsWith("/(auth)");

    // Si NO hay sesión y NO estoy en /(auth) => mandar a sign-in
    if (!accessToken && !inAuthStack) {
      router.replace("/(auth)/sign-in");
      return;
    }
    // Si hay sesión y estoy en /(auth) => mandar a tabs
    if (accessToken && inAuthStack) {
      router.replace("/(tabs)");
      return;
    }
  }, [accessToken, loading, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeScreen>
        <AuthGate />
      </SafeScreen>
    </AuthProvider>
  );
}
