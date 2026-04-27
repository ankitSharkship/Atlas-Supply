import Colors from "@/constants/colors";
import * as Updates from "expo-updates";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function UpdateManager({ children }: { children: React.ReactNode }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>("");

  useEffect(() => {
    async function onFetchUpdateAsync() {
      if (__DEV__) return; 

      try {
        setIsUpdating(true);
        setUpdateStatus("Checking for updates...");
        
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          setUpdateStatus("Downloading update...");
          await Updates.fetchUpdateAsync();
          
          setUpdateStatus("Applying update...");
          // In some cases, we might want to alert the user or just reload
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.error("[UpdateManager] Error checking for updates:", error);
        // We continue even on error to let the user use the app
      } finally {
        setIsUpdating(false);
      }
    }

    onFetchUpdateAsync();
  }, []);

  if (isUpdating) {
    return (
      <View style={styles.container}>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.statusText}>{updateStatus}</Text>
          <Text style={styles.subText}>Please wait, updating Atlas Ops...</Text>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loaderBox: {
    padding: 30,
    backgroundColor: Colors.card,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    width: "80%",
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    textAlign: "center",
  },
  subText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
