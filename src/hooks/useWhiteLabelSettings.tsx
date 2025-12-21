import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WhiteLabelSettings {
  custom_css: string;
  custom_head_scripts: string;
  custom_body_scripts: string;
  login_background_url: string;
  login_logo_url: string;
  login_welcome_text: string;
  login_subtitle: string;
  email_header_logo_url: string;
  email_footer_text: string;
  email_primary_color: string;
  powered_by_visible: boolean;
  powered_by_text: string;
  custom_loading_animation: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
}

const defaultSettings: WhiteLabelSettings = {
  custom_css: "",
  custom_head_scripts: "",
  custom_body_scripts: "",
  login_background_url: "",
  login_logo_url: "",
  login_welcome_text: "Welcome Back",
  login_subtitle: "Sign in to continue to your account",
  email_header_logo_url: "",
  email_footer_text: "© 2024 Your Company. All rights reserved.",
  email_primary_color: "#7c3aed",
  powered_by_visible: false,
  powered_by_text: "",
  custom_loading_animation: false,
  maintenance_mode: false,
  maintenance_message: "We're currently performing maintenance. Please check back soon.",
};

interface WhiteLabelContextType {
  settings: WhiteLabelSettings;
  isLoading: boolean;
  refetch: () => void;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

export function WhiteLabelProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WhiteLabelSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const applyCustomCSS = (css: string) => {
    let styleElement = document.getElementById("custom-whitelabel-css");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "custom-whitelabel-css";
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
  };

  const applyHeadScripts = (scripts: string) => {
    if (!scripts) return;
    let scriptContainer = document.getElementById("custom-head-scripts");
    if (!scriptContainer) {
      scriptContainer = document.createElement("div");
      scriptContainer.id = "custom-head-scripts";
      document.head.appendChild(scriptContainer);
    }
    scriptContainer.innerHTML = scripts;
  };

  const applyBodyScripts = (scripts: string) => {
    if (!scripts) return;
    let scriptContainer = document.getElementById("custom-body-scripts");
    if (!scriptContainer) {
      scriptContainer = document.createElement("div");
      scriptContainer.id = "custom-body-scripts";
      document.body.appendChild(scriptContainer);
    }
    scriptContainer.innerHTML = scripts;
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .like("key", "whitelabel_%");

      if (error) throw error;

      const loadedSettings: WhiteLabelSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key.replace("whitelabel_", "") as keyof WhiteLabelSettings;
        if (key in loadedSettings) {
          const value = row.value;
          if (typeof defaultSettings[key] === "boolean") {
            (loadedSettings as Record<string, any>)[key] = value === true || value === "true" || value === 1;
          } else {
            (loadedSettings as Record<string, any>)[key] = value ?? defaultSettings[key];
          }
        }
      });

      setSettings(loadedSettings);

      // Apply settings immediately
      if (loadedSettings.custom_css) {
        applyCustomCSS(loadedSettings.custom_css);
      }
      if (loadedSettings.custom_head_scripts) {
        applyHeadScripts(loadedSettings.custom_head_scripts);
      }
      if (loadedSettings.custom_body_scripts) {
        applyBodyScripts(loadedSettings.custom_body_scripts);
      }
    } catch (error) {
      console.error("Error fetching white-label settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to changes
    const channel = supabase
      .channel("whitelabel_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        (payload) => {
          const key = ((payload.new as any)?.key ?? (payload.old as any)?.key) as string | undefined;
          if (key?.startsWith("whitelabel_")) {
            fetchSettings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <WhiteLabelContext.Provider value={{ settings, isLoading, refetch: fetchSettings }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabelSettings() {
  const context = useContext(WhiteLabelContext);
  if (!context) {
    throw new Error("useWhiteLabelSettings must be used within a WhiteLabelProvider");
  }
  return context;
}
