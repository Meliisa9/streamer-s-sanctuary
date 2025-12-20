import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SupportedLanguage = "en" | "de" | "es" | "fr" | "pt" | "it" | "nl" | "sv" | "no" | "fi" | "da" | "pl" | "ru" | "ja" | "ko" | "zh";

interface Translations {
  [key: string]: string;
}

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  translations: Translations;
  isLoading: boolean;
  availableLanguages: { code: SupportedLanguage; name: string; nativeName: string }[];
}

const availableLanguages: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
];

// Default English translations
const defaultTranslations: Translations = {
  // Navigation
  "nav.home": "Home",
  "nav.videos": "Videos",
  "nav.bonuses": "Bonuses",
  "nav.news": "News",
  "nav.giveaways": "Giveaways",
  "nav.events": "Events",
  "nav.leaderboard": "Leaderboard",
  "nav.polls": "Polls",
  "nav.about": "About",
  "nav.streamers": "Streamers",
  "nav.stream": "Watch Live",
  "nav.predictions": "Predictions",
  "nav.wins": "Win Gallery",
  
  // Auth
  "auth.login": "Login",
  "auth.signup": "Sign Up",
  "auth.logout": "Logout",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.username": "Username",
  "auth.forgotPassword": "Forgot Password?",
  "auth.resetPassword": "Reset Password",
  "auth.welcomeBack": "Welcome Back",
  "auth.createAccount": "Create Account",
  
  // Common
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.submit": "Submit",
  "common.loading": "Loading...",
  "common.search": "Search",
  "common.viewAll": "View All",
  "common.back": "Back",
  "common.next": "Next",
  "common.previous": "Previous",
  
  // Predictions
  "predictions.title": "Stream Predictions",
  "predictions.placeBet": "Place Bet",
  "predictions.profit": "Profit",
  "predictions.loss": "Loss",
  "predictions.yourBet": "Your Bet",
  "predictions.totalPool": "Total Pool",
  "predictions.status.open": "Open",
  "predictions.status.locked": "Locked",
  "predictions.status.resolved": "Resolved",
  
  // Wins
  "wins.title": "Big Win Gallery",
  "wins.submitWin": "Submit Your Win",
  "wins.gameName": "Game Name",
  "wins.provider": "Provider",
  "wins.betAmount": "Bet Amount",
  "wins.winAmount": "Win Amount",
  "wins.multiplier": "Multiplier",
  "wins.verified": "Verified",
  "wins.pending": "Pending Review",
  
  // Stats
  "stats.title": "Streamer Stats",
  "stats.totalProfit": "Total Profit",
  "stats.biggestWin": "Biggest Win",
  "stats.sessionsPlayed": "Sessions Played",
  "stats.favoriteGames": "Favorite Games",
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [translations, setTranslations] = useState<Translations>(defaultTranslations);
  const [customTranslations, setCustomTranslations] = useState<Record<SupportedLanguage, Translations>>({} as any);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLanguageSettings();
  }, []);

  const fetchLanguageSettings = async () => {
    try {
      // Get default language from site settings
      const { data: langSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "default_language")
        .single();

      if (langSetting?.value) {
        setLanguageState(langSetting.value as SupportedLanguage);
      }

      // Get custom translations
      const { data: translationSettings } = await supabase
        .from("site_settings")
        .select("key, value")
        .like("key", "translations_%");

      if (translationSettings) {
        const customTrans: Record<SupportedLanguage, Translations> = {} as any;
        translationSettings.forEach((setting) => {
          const lang = setting.key.replace("translations_", "") as SupportedLanguage;
          if (setting.value && typeof setting.value === "object") {
            customTrans[lang] = setting.value as Translations;
          }
        });
        setCustomTranslations(customTrans);
      }
    } catch (error) {
      console.error("Error fetching language settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem("preferred_language", lang);
    
    // Merge default with custom translations for the selected language
    const langTranslations = customTranslations[lang] || {};
    setTranslations({ ...defaultTranslations, ...langTranslations });
  };

  useEffect(() => {
    // Check localStorage for user preference
    const savedLang = localStorage.getItem("preferred_language") as SupportedLanguage;
    if (savedLang && availableLanguages.some(l => l.code === savedLang)) {
      setLanguage(savedLang);
    }
  }, [customTranslations]);

  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translations,
        isLoading,
        availableLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
