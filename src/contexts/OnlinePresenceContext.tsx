import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type OnlinePresenceContextValue = {
  onlineUserIds: Set<string>;
};

const OnlinePresenceContext = createContext<OnlinePresenceContextValue | undefined>(undefined);

export function OnlinePresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setOnlineUserIds(new Set());
      return;
    }

    const channel = supabase.channel("online-presence", {
      config: {
        presence: { key: user.id },
      },
    });

    const updateFromPresenceState = () => {
      const state = channel.presenceState();
      const ids = new Set<string>(Object.keys(state));
      setOnlineUserIds(ids);
    };

    channel
      .on("presence", { event: "sync" }, () => {
        updateFromPresenceState();
      })
      .on("presence", { event: "join" }, () => {
        updateFromPresenceState();
      })
      .on("presence", { event: "leave" }, () => {
        updateFromPresenceState();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
          updateFromPresenceState();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value = useMemo(() => ({ onlineUserIds }), [onlineUserIds]);

  return <OnlinePresenceContext.Provider value={value}>{children}</OnlinePresenceContext.Provider>;
}

export function useOnlinePresence() {
  const ctx = useContext(OnlinePresenceContext);
  if (!ctx) throw new Error("useOnlinePresence must be used within an OnlinePresenceProvider");
  return ctx;
}
