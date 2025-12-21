import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSetupStatus() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSetupStatus = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "setup_completed")
        .maybeSingle();
      
      const completed = data?.value === true || data?.value === "true";
      setIsSetupComplete(completed);
    } catch (error) {
      console.error("Error checking setup status:", error);
      setIsSetupComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const markSetupComplete = async () => {
    try {
      await supabase
        .from("site_settings")
        .upsert({ key: "setup_completed", value: true }, { onConflict: "key" });
      setIsSetupComplete(true);
    } catch (error) {
      console.error("Error marking setup complete:", error);
    }
  };

  const resetSetup = async () => {
    try {
      await supabase
        .from("site_settings")
        .upsert({ key: "setup_completed", value: false }, { onConflict: "key" });
      setIsSetupComplete(false);
    } catch (error) {
      console.error("Error resetting setup:", error);
    }
  };

  useEffect(() => {
    checkSetupStatus();
  }, []);

  return {
    isSetupComplete,
    isLoading,
    markSetupComplete,
    resetSetup,
    refetch: checkSetupStatus,
  };
}
