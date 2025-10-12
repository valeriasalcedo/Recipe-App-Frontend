import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/src/auth/AuthContext";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
