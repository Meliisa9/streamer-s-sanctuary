import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to subscribe to real-time updates for bonus hunts and slots
 */
export function useBonusHuntRealtime(huntId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to bonus_hunts changes
    const huntsChannel = supabase
      .channel('bonus-hunts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bonus_hunts'
        },
        (payload) => {
          console.log('Bonus hunt change:', payload);
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ["bonus-hunts"] });
          queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
        }
      )
      .subscribe();

    // Subscribe to bonus_hunt_slots changes
    const slotsChannel = supabase
      .channel('bonus-hunt-slots-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bonus_hunt_slots',
          ...(huntId ? { filter: `hunt_id=eq.${huntId}` } : {})
        },
        (payload) => {
          console.log('Slot change:', payload);
          // Invalidate slot queries
          queryClient.invalidateQueries({ queryKey: ["bonus-hunt-slots"] });
          queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunt-slots"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(huntsChannel);
      supabase.removeChannel(slotsChannel);
    };
  }, [queryClient, huntId]);
}
