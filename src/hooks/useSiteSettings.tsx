import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_title: string;
  favicon_url: string | null;
  logo_url: string | null;
  twitch_url: string;
  twitch_follow_url: string;
  is_live: boolean;
  live_platform: "twitch" | "kick";
  stream_channel: string;

  // Navigation visibility flags
  nav_home_visible: boolean;
  nav_videos_visible: boolean;
  nav_bonuses_visible: boolean;
  nav_news_visible: boolean;
  nav_giveaways_visible: boolean;
  nav_streamers_visible: boolean;
  nav_stream_visible: boolean;
  nav_store_visible: boolean;
  nav_events_visible: boolean;
  nav_bonus_hunt_visible: boolean;
  nav_gtw_visible: boolean;
  nav_avgx_visible: boolean;
  nav_wins_visible: boolean;
  nav_streamer_stats_visible: boolean;
  nav_leaderboard_visible: boolean;
  nav_polls_visible: boolean;
  nav_about_visible: boolean;

  // Other settings
  stat_community_value: string;
  stat_community_label: string;
  stat_wins_value: string;
  stat_wins_label: string;
  stat_giveaways_value: string;
  stat_giveaways_label: string;
  footer_copyright: string;
  social_twitter: string;
  social_youtube: string;
  social_instagram: string;
  social_discord: string;
  social_twitter_icon: string;
  social_youtube_icon: string;
  social_instagram_icon: string;
  social_discord_icon: string;
}

const defaultSettings: SiteSettings = {
  site_name: "StreamerX",
  site_tagline: "Casino Streams",
  site_title: "StreamerX - Casino Streams",
  favicon_url: null,
  logo_url: null,
  twitch_url: "https://twitch.tv",
  twitch_follow_url: "https://twitch.tv",
  is_live: false,
  live_platform: "twitch",
  stream_channel: "",

  nav_home_visible: true,
  nav_videos_visible: true,
  nav_bonuses_visible: true,
  nav_news_visible: true,
  nav_giveaways_visible: true,
  nav_streamers_visible: true,
  nav_stream_visible: true,
  nav_store_visible: true,
  nav_events_visible: true,
  nav_bonus_hunt_visible: true,
  nav_gtw_visible: true,
  nav_avgx_visible: true,
  nav_wins_visible: true,
  nav_streamer_stats_visible: true,
  nav_leaderboard_visible: true,
  nav_polls_visible: true,
  nav_about_visible: true,

  stat_community_value: "150K+",
  stat_community_label: "Community Members",
  stat_wins_value: "$2.5M",
  stat_wins_label: "Total Wins Streamed",
  stat_giveaways_value: "500+",
  stat_giveaways_label: "Giveaways Hosted",
  footer_copyright: "",
  social_twitter: "#",
  social_youtube: "#",
  social_instagram: "#",
  social_discord: "#",
  social_twitter_icon: "twitter",
  social_youtube_icon: "youtube",
  social_instagram_icon: "instagram",
  social_discord_icon: "discord",
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
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const loadedSettings: SiteSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof SiteSettings;
        if (key in loadedSettings) {
          const value = row.value;
          if (typeof defaultSettings[key] === "boolean") {
            // Strict boolean parsing - only true values set to true, everything else is false
            (loadedSettings as Record<string, any>)[key] = value === true || value === "true" || value === 1;
          } else {
            (loadedSettings as Record<string, any>)[key] = value ?? defaultSettings[key];
          }
        }
      });

      setSettings(loadedSettings);
      if (loadedSettings.site_title) document.title = loadedSettings.site_title;
      if (loadedSettings.favicon_url) {
        const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (favicon) favicon.href = loadedSettings.favicon_url;
        else {
          const link = document.createElement("link");
          link.rel = "icon";
          link.href = loadedSettings.favicon_url;
          document.head.appendChild(link);
        }
      }
    } catch (error) {
      console.error("Error fetching site settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    const channel = supabase
      .channel("site_settings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => fetchSettings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  return context;
}
