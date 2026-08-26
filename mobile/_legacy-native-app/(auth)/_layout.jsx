import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext.jsx";

export default function AuthLayout() {
  const { session } = useAuth();

  if (session) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
