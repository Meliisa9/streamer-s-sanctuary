import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  logo_url: string | null;
  twitch_url: string;
  twitch_follow_url: string;
  is_live: boolean;
  live_viewer_count: string;
  nav_videos_visible: boolean;
  nav_bonuses_visible: boolean;
  nav_news_visible: boolean;
  nav_giveaways_visible: boolean;
  nav_events_visible: boolean;
  nav_gtw_visible: boolean;
  nav_leaderboard_visible: boolean;
}

const defaultSettings: SiteSettings = {
  site_name: "StreamerX",
  site_tagline: "Casino Streams",
  logo_url: null,
  twitch_url: "https://twitch.tv",
  twitch_follow_url: "https://twitch.tv",
  is_live: false,
  live_viewer_count: "0",
  nav_videos_visible: true,
  nav_bonuses_visible: true,
  nav_news_visible: true,
  nav_giveaways_visible: true,
  nav_events_visible: true,
  nav_gtw_visible: true,
  nav_leaderboard_visible: true,
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  refetch: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;

      const loadedSettings: SiteSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof SiteSettings;
        if (key in loadedSettings) {
          const value = row.value;
          if (typeof defaultSettings[key] === "boolean") {
            (loadedSettings as Record<string, any>)[key] = value === true || value === "true";
          } else {
            (loadedSettings as Record<string, any>)[key] = value;
          }
        }
      });

      setSettings(loadedSettings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to changes
    const channel = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => fetchSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
}
