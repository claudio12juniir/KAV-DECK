import { Feather } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext.jsx";

export default function TabsLayout() {
  const { session } = useAuth();

  if (!session) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#111" }}>
      <Tabs.Screen
        name="index"
        options={{ title: "Início", tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="vendas"
        options={{
          title: "Vendas",
          tabBarIcon: ({ color, size }) => <Feather name="shopping-cart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="compras"
        options={{
          title: "Compras",
          tabBarIcon: ({ color, size }) => <Feather name="shopping-bag" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="separador"
        options={{
          title: "Separação",
          tabBarIcon: ({ color, size }) => <Feather name="package" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="recebimento"
        options={{
          title: "Recebimento",
          tabBarIcon: ({ color, size }) => <Feather name="truck" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
