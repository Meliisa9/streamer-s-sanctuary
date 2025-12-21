import {
  Home,
  Video,
  Trophy,
  Newspaper,
  Gift,
  Users,
  Twitch,
  Calendar,
  Crosshair,
  Target,
  BarChart,
  Store,
  Info,
} from "lucide-react";

export type NavSection = "main" | "community";

export interface SiteNavItemDefinition {
  key: string;
  label: string;
  description: string;
  path: string;
  icon: React.ElementType;
  defaultSection: NavSection;
  settingKey?: string;
}

// Single source of truth for website navigation items.
export const SITE_NAV_ITEMS: SiteNavItemDefinition[] = [
  {
    key: "nav_home_visible",
    label: "Home",
    description: "Homepage",
    path: "/",
    icon: Home,
    defaultSection: "main",
  },
  {
    key: "nav_videos_visible",
    label: "Videos",
    description: "Video gallery and highlights",
    path: "/videos",
    icon: Video,
    defaultSection: "main",
    settingKey: "nav_videos_visible",
  },
  {
    key: "nav_bonuses_visible",
    label: "Bonuses",
    description: "Casino bonus offers",
    path: "/bonuses",
    icon: Trophy,
    defaultSection: "main",
    settingKey: "nav_bonuses_visible",
  },
  {
    key: "nav_news_visible",
    label: "News",
    description: "News and updates",
    path: "/news",
    icon: Newspaper,
    defaultSection: "main",
    settingKey: "nav_news_visible",
  },
  {
    key: "nav_giveaways_visible",
    label: "Giveaways",
    description: "Active giveaways",
    path: "/giveaways",
    icon: Gift,
    defaultSection: "main",
    settingKey: "nav_giveaways_visible",
  },
  {
    key: "nav_streamers_visible",
    label: "Streamers",
    description: "Featured streamers",
    path: "/streamers",
    icon: Users,
    defaultSection: "main",
    settingKey: "nav_streamers_visible",
  },
  {
    key: "nav_stream_visible",
    label: "Stream",
    description: "Live stream embed",
    path: "/stream",
    icon: Twitch,
    defaultSection: "main",
    settingKey: "nav_stream_visible",
  },
  {
    key: "nav_store_visible",
    label: "Store",
    description: "Points store",
    path: "/store",
    icon: Store,
    defaultSection: "main",
    settingKey: "nav_store_visible",
  },

  // Community
  {
    key: "nav_events_visible",
    label: "Events",
    description: "Stream schedule and events",
    path: "/events",
    icon: Calendar,
    defaultSection: "community",
    settingKey: "nav_events_visible",
  },
  {
    key: "nav_bonus_hunt_visible",
    label: "Bonus Hunt",
    description: "Bonus hunt tracker",
    path: "/bonus-hunt",
    icon: Crosshair,
    defaultSection: "community",
    settingKey: "nav_bonus_hunt_visible",
  },
  {
    key: "nav_gtw_visible",
    label: "Guess The Win",
    description: "GTW game sessions",
    path: "/bonus-hunt?tab=gtw",
    icon: Target,
    defaultSection: "community",
    settingKey: "nav_gtw_visible",
  },
  {
    key: "nav_avgx_visible",
    label: "Average X",
    description: "AvgX predictions",
    path: "/bonus-hunt?tab=avgx",
    icon: BarChart,
    defaultSection: "community",
    settingKey: "nav_avgx_visible",
  },
  {
    key: "nav_wins_visible",
    label: "Win Gallery",
    description: "Big wins gallery",
    path: "/wins",
    icon: Trophy,
    defaultSection: "community",
    settingKey: "nav_wins_visible",
  },
  {
    key: "nav_streamer_stats_visible",
    label: "Streamer Stats",
    description: "Streamer stats",
    path: "/streamer-stats",
    icon: BarChart,
    defaultSection: "community",
    settingKey: "nav_streamer_stats_visible",
  },
  {
    key: "nav_leaderboard_visible",
    label: "Leaderboard",
    description: "Points rankings",
    path: "/leaderboard",
    icon: Users,
    defaultSection: "community",
    settingKey: "nav_leaderboard_visible",
  },
  {
    key: "nav_polls_visible",
    label: "Polls",
    description: "Community polls",
    path: "/polls",
    icon: BarChart,
    defaultSection: "community",
    settingKey: "nav_polls_visible",
  },
  {
    key: "nav_about_visible",
    label: "About",
    description: "About the streamer",
    path: "/about",
    icon: Info,
    defaultSection: "community",
    settingKey: "nav_about_visible",
  },
];

export type NavOrder = Record<string, number>;
export type NavSections = Record<string, NavSection>;
