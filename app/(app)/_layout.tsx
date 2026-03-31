import { useAuth } from "@/context/AuthContext";
import { Stack, router } from "expo-router";
import { useEffect } from "react";

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading]);

  if (!user) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="loadingmemoDetails" />
      <Stack.Screen name="vehicleAssignment" />
      <Stack.Screen name="editVehicleAssignment" />
      {/* <Stack.Screen name="addIntermitentCharges" /> */}
      <Stack.Screen name="vendorOnboardingForm"/>
    </Stack>
  );
}
