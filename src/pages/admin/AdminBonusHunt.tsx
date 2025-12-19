import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBonusHuntRealtime } from "@/hooks/useBonusHuntRealtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Edit2, Trash2, Trophy, Target, Loader2, 
  ListPlus, Eye, CheckCircle2, ArrowRight, ArrowLeft, X,
  Calculator, RefreshCw, Zap, Radio, GripVertical, Award, Users
} from "lucide-react";
import { 
  calculateBonusHuntStats, 
  calculateMultiplier, 
  updateBonusHuntStats 
} from "@/hooks/useBonusHuntCalculations";
import { QuickSlotEntry } from "@/components/bonus-hunt/QuickSlotEntry";
import { BonusHuntProgress } from "@/components/bonus-hunt/BonusHuntProgress";
import { SlotPicker } from "@/components/bonus-hunt/SlotPicker";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BonusHunt {
  id: string;
  title: string;
  date: string;
  status: "ongoing" | "complete" | "to_be_played";
  target_balance: number | null;
  ending_balance: number | null;
  average_bet: number | null;
  highest_win: number | null;
  highest_multiplier: number | null;
  starting_balance?: number | null;
  start_time?: string | null;
  currency?: string;
  winner_points?: number;
  winner_user_id?: string | null;
}

interface BonusHuntGuess {
  id: string;
  hunt_id: string;
  user_id: string;
  guess_amount: number;
  points_earned: number | null;
  created_at: string;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface BonusHuntSlot {
  id: string;
  hunt_id: string;
  slot_name: string;
  provider: string | null;
  bet_amount: number | null;
  win_amount: number | null;
  multiplier: number | null;
  is_played: boolean;
  sort_order: number;
}

interface TempSlot {
  id: string;
  slot_name: string;
  provider: string;
  bet_amount: string;
}

// Sortable slot row component for drag-drop
function SortableSlotRow({ slot, onEdit, onDelete }: { 
  slot: BonusHuntSlot; 
  onEdit: (slot: BonusHuntSlot) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-3 bg-secondary/30 rounded-lg ${
        isDragging ? "shadow-lg ring-2 ring-primary/50" : ""
      }`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-muted-foreground w-8">#{slot.sort_order}</span>
      <div className={`w-3 h-3 rounded-full ${slot.is_played ? "bg-green-500" : "bg-muted"}`} />
      <div className="flex-1">
        <p className="font-medium">{slot.slot_name}</p>
        <p className="text-xs text-muted-foreground">{slot.provider}</p>
      </div>
      <div className="text-right">
        {slot.bet_amount && <p className="text-sm">Bet: ${slot.bet_amount}</p>}
        {slot.win_amount !== null && slot.win_amount !== undefined && (
          <p className="text-sm text-green-500">Win: ${slot.win_amount}</p>
        )}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(slot)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => {
            if (confirm("Delete this slot?")) onDelete(slot.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminBonusHunt() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHuntDialogOpen, setIsHuntDialogOpen] = useState(false);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingHunt, setEditingHunt] = useState<BonusHunt | null>(null);
  const [selectedHuntForSlots, setSelectedHuntForSlots] = useState<BonusHunt | null>(null);
  const [editingSlot, setEditingSlot] = useState<BonusHuntSlot | null>(null);
  
  // Multi-step wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [tempSlots, setTempSlots] = useState<TempSlot[]>([]);
  const [newSlotForm, setNewSlotForm] = useState({ slot_name: "", provider: "", bet_amount: "" });

  // DnD sensors must be created unconditionally (prevents blank page / hooks mismatch)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [huntForm, setHuntForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "",
    status: "to_be_played" as "ongoing" | "complete" | "to_be_played",
    starting_balance: "",
    target_balance: "",
    ending_balance: "",
    average_bet: "",
    highest_win: "",
    highest_multiplier: "",
    currency: "USD",
    winner_points: "1000",
  });

  const [slotForm, setSlotForm] = useState({
    slot_name: "",
    provider: "",
    bet_amount: "",
    win_amount: "",
    multiplier: "",
    is_played: false,
    sort_order: 0,
  });

  // Enable real-time updates
  useBonusHuntRealtime(selectedHuntForSlots?.id);

  // State for quick add dialog - separate from selectedHuntForSlots
  const [quickAddHuntId, setQuickAddHuntId] = useState<string | null>(null);

  const { data: hunts, isLoading } = useQuery({
    queryKey: ["admin-bonus-hunts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonus_hunts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BonusHunt[];
    },
  });

  const { data: slots } = useQuery({
    queryKey: ["admin-bonus-hunt-slots", selectedHuntForSlots?.id],
    queryFn: async () => {
      if (!selectedHuntForSlots) return [];
      const { data, error } = await supabase
        .from("bonus_hunt_slots")
        .select("*")
        .eq("hunt_id", selectedHuntForSlots.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as BonusHuntSlot[];
    },
    enabled: !!selectedHuntForSlots,
  });

  // Calculate live stats for the selected hunt
  const liveStats = slots && selectedHuntForSlots 
    ? calculateBonusHuntStats(slots, selectedHuntForSlots.starting_balance || null)
    : null;

  // State for viewing guesses
  const [viewingGuessesHuntId, setViewingGuessesHuntId] = useState<string | null>(null);
  
  // Fetch guesses for a hunt with profile data
  const { data: huntGuesses } = useQuery({
    queryKey: ["admin-bonus-hunt-guesses", viewingGuessesHuntId],
    queryFn: async () => {
      if (!viewingGuessesHuntId) return [];
      
      // First get guesses
      const { data: guesses, error } = await supabase
        .from("bonus_hunt_guesses")
        .select("*")
        .eq("hunt_id", viewingGuessesHuntId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      
      // Then get profiles for those user_ids
      const userIds = guesses.map(g => g.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", userIds);
      
      // Merge them
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return guesses.map(g => ({
        ...g,
        profiles: profileMap.get(g.user_id) || null,
      })) as BonusHuntGuess[];
    },
    enabled: !!viewingGuessesHuntId,
  });

  // Get guess count per hunt
  const { data: guessCounts } = useQuery({
    queryKey: ["admin-bonus-hunt-guess-counts"],
    queryFn: async () => {
      if (!hunts) return {};
      const counts: Record<string, number> = {};
      for (const hunt of hunts) {
        const { count, error } = await supabase
          .from("bonus_hunt_guesses")
          .select("*", { count: "exact", head: true })
          .eq("hunt_id", hunt.id);
        if (!error) counts[hunt.id] = count || 0;
      }
      return counts;
    },
    enabled: !!hunts && hunts.length > 0,
  });

  // Determine winner mutation
  const determineWinnerMutation = useMutation({
    mutationFn: async (huntId: string) => {
      // Fetch the hunt
      const { data: hunt, error: huntError } = await supabase
        .from("bonus_hunts")
        .select("*")
        .eq("id", huntId)
        .single();
      
      if (huntError) throw huntError;
      if (!hunt.ending_balance) throw new Error("Hunt must have an ending balance to determine winner");
      
      // Fetch all guesses for this hunt
      const { data: guesses, error: guessError } = await supabase
        .from("bonus_hunt_guesses")
        .select("*")
        .eq("hunt_id", huntId);
      
      if (guessError) throw guessError;
      if (!guesses || guesses.length === 0) throw new Error("No guesses to evaluate");
      
      // Find closest guess
      let closestGuess = guesses[0];
      let closestDiff = Math.abs(guesses[0].guess_amount - hunt.ending_balance);
      
      for (const guess of guesses) {
        const diff = Math.abs(guess.guess_amount - hunt.ending_balance);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestGuess = guess;
        }
      }
      
      const pointsToAward = hunt.winner_points || 1000;
      
      // Update the winning guess with points earned
      await supabase
        .from("bonus_hunt_guesses")
        .update({ points_earned: pointsToAward })
        .eq("id", closestGuess.id);
      
      // Update the hunt with winner info
      await supabase
        .from("bonus_hunts")
        .update({ 
          winner_user_id: closestGuess.user_id,
          status: "complete"
        })
        .eq("id", huntId);
      
      // Award points to the winner's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", closestGuess.user_id)
        .single();
      
      if (profile) {
        await supabase
          .from("profiles")
          .update({ points: (profile.points || 0) + pointsToAward })
          .eq("user_id", closestGuess.user_id);
      }
      
      // Create notification for winner
      await supabase.from("user_notifications").insert({
        user_id: closestGuess.user_id,
        title: "You Won! 🎉",
        message: `Congratulations! Your guess of ${hunt.currency === "EUR" ? "€" : "$"}${closestGuess.guess_amount.toLocaleString()} was the closest to the final balance of ${hunt.currency === "EUR" ? "€" : "$"}${hunt.ending_balance.toLocaleString()}! You earned ${pointsToAward} points!`,
        type: "achievement",
        link: "/bonus-hunt",
      });
      
      return { winner: closestGuess, hunt, pointsToAward };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunt-guesses"] });
      toast({ 
        title: "Winner Determined!", 
        description: `Winner awarded ${data.pointsToAward} points!`
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Check if hunt should auto-complete (all slots played)
  const checkAutoComplete = async (huntId: string) => {
    // Fetch all slots for this hunt
    const { data: huntSlots, error: slotsError } = await supabase
      .from("bonus_hunt_slots")
      .select("*")
      .eq("hunt_id", huntId);
    
    if (slotsError || !huntSlots || huntSlots.length === 0) return;
    
    // Check if all slots are played
    const allPlayed = huntSlots.every(slot => slot.is_played);
    if (!allPlayed) return;
    
    // Fetch the hunt
    const { data: hunt, error: huntError } = await supabase
      .from("bonus_hunts")
      .select("*")
      .eq("id", huntId)
      .single();
    
    if (huntError || !hunt || hunt.status === "complete") return;
    
    // Calculate ending balance from all wins
    const endingBalance = huntSlots.reduce((sum, slot) => sum + (slot.win_amount || 0), 0);
    
    // Update hunt to complete with ending balance (this triggers the winner determination via DB trigger)
    const { error: updateError } = await supabase
      .from("bonus_hunts")
      .update({ 
        status: "complete",
        ending_balance: endingBalance
      })
      .eq("id", huntId);
    
    if (updateError) {
      console.error("Error auto-completing hunt:", updateError);
      return;
    }
    
    // Try to determine winner automatically
    try {
      const { data: guesses } = await supabase
        .from("bonus_hunt_guesses")
        .select("*")
        .eq("hunt_id", huntId);
      
      if (guesses && guesses.length > 0) {
        // Find closest guess
        let closestGuess = guesses[0];
        let closestDiff = Math.abs(guesses[0].guess_amount - endingBalance);
        
        for (const guess of guesses) {
          const diff = Math.abs(guess.guess_amount - endingBalance);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestGuess = guess;
          }
        }
        
        const pointsToAward = hunt.winner_points || 1000;
        
        // Update winning guess
        await supabase
          .from("bonus_hunt_guesses")
          .update({ points_earned: pointsToAward })
          .eq("id", closestGuess.id);
        
        // Update hunt with winner
        await supabase
          .from("bonus_hunts")
          .update({ winner_user_id: closestGuess.user_id })
          .eq("id", huntId);
        
        // Award points to winner
        const { data: profile } = await supabase
          .from("profiles")
          .select("points")
          .eq("user_id", closestGuess.user_id)
          .single();
        
        if (profile) {
          await supabase
            .from("profiles")
            .update({ points: (profile.points || 0) + pointsToAward })
            .eq("user_id", closestGuess.user_id);
        }
        
        // Notify winner
        await supabase.from("user_notifications").insert({
          user_id: closestGuess.user_id,
          title: "You Won! 🎉",
          message: `Your guess of $${closestGuess.guess_amount.toLocaleString()} was the closest to $${endingBalance.toLocaleString()}! You earned ${pointsToAward} points!`,
          type: "achievement",
          link: "/bonus-hunt",
        });
        
        toast({
          title: "Hunt Auto-Completed!",
          description: `All slots played. Winner determined and awarded ${pointsToAward} points!`,
        });
      } else {
        toast({
          title: "Hunt Auto-Completed!",
          description: `All slots played. Ending balance: $${endingBalance.toLocaleString()}. No guesses to pick winner from.`,
        });
      }
    } catch (err) {
      console.error("Error determining winner during auto-complete:", err);
      toast({
        title: "Hunt Completed",
        description: `All slots played. Ending balance: $${endingBalance.toLocaleString()}`,
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunt-guesses"] });
  };

  const resetHuntForm = () => {
    setHuntForm({
      title: "",
      date: new Date().toISOString().split("T")[0],
      start_time: "",
      status: "to_be_played",
      starting_balance: "",
      target_balance: "",
      ending_balance: "",
      average_bet: "",
      highest_win: "",
      highest_multiplier: "",
      currency: "USD",
      winner_points: "1000",
    });
    setEditingHunt(null);
    setWizardStep(1);
    setTempSlots([]);
    setNewSlotForm({ slot_name: "", provider: "", bet_amount: "" });
  };

  const resetSlotForm = () => {
    setSlotForm({
      slot_name: "",
      provider: "",
      bet_amount: "",
      win_amount: "",
      multiplier: "",
      is_played: false,
      sort_order: (slots?.length || 0) + 1,
    });
    setEditingSlot(null);
  };

  // Create hunt with slots in one go
  const createHuntWithSlotsMutation = useMutation({
    mutationFn: async () => {
      const huntPayload = {
        title: huntForm.title,
        date: huntForm.date,
        start_time: huntForm.start_time ? new Date(huntForm.start_time).toISOString() : null,
        status: huntForm.status,
        starting_balance: huntForm.starting_balance ? parseFloat(huntForm.starting_balance) : null,
        target_balance: huntForm.target_balance ? parseFloat(huntForm.target_balance) : null,
        ending_balance: huntForm.ending_balance ? parseFloat(huntForm.ending_balance) : null,
        average_bet: huntForm.average_bet ? parseFloat(huntForm.average_bet) : null,
        highest_win: huntForm.highest_win ? parseFloat(huntForm.highest_win) : null,
        highest_multiplier: huntForm.highest_multiplier ? parseFloat(huntForm.highest_multiplier) : null,
        currency: huntForm.currency,
        winner_points: huntForm.winner_points ? parseInt(huntForm.winner_points) : 1000,
      };

      // Create the hunt first
      const { data: newHunt, error: huntError } = await supabase
        .from("bonus_hunts")
        .insert(huntPayload)
        .select()
        .single();
      
      if (huntError) throw huntError;

      // Then add all slots
      if (tempSlots.length > 0) {
        const slotsPayload = tempSlots.map((slot, index) => ({
          hunt_id: newHunt.id,
          slot_name: slot.slot_name,
          provider: slot.provider || null,
          bet_amount: slot.bet_amount ? parseFloat(slot.bet_amount) : null,
          sort_order: index + 1,
        }));

        const { error: slotsError } = await supabase
          .from("bonus_hunt_slots")
          .insert(slotsPayload);

        if (slotsError) throw slotsError;
      }

      return newHunt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
      toast({ title: "Hunt created with slots!" });
      setIsHuntDialogOpen(false);
      resetHuntForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const huntMutation = useMutation({
    mutationFn: async (data: typeof huntForm) => {
      const payload = {
        title: data.title,
        date: data.date,
        start_time: data.start_time ? new Date(data.start_time).toISOString() : null,
        status: data.status,
        starting_balance: data.starting_balance ? parseFloat(data.starting_balance) : null,
        target_balance: data.target_balance ? parseFloat(data.target_balance) : null,
        ending_balance: data.ending_balance ? parseFloat(data.ending_balance) : null,
        average_bet: data.average_bet ? parseFloat(data.average_bet) : null,
        highest_win: data.highest_win ? parseFloat(data.highest_win) : null,
        highest_multiplier: data.highest_multiplier ? parseFloat(data.highest_multiplier) : null,
        currency: data.currency,
        winner_points: data.winner_points ? parseInt(data.winner_points) : 1000,
      };

      if (editingHunt) {
        const { error } = await supabase.from("bonus_hunts").update(payload).eq("id", editingHunt.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
      toast({ title: "Hunt updated" });
      setIsHuntDialogOpen(false);
      resetHuntForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteHuntMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bonus_hunts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
      toast({ title: "Hunt deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Auto-calculate multiplier when bet and win amounts change
  const autoCalculateMultiplier = useCallback((betAmount: string, winAmount: string) => {
    const bet = parseFloat(betAmount);
    const win = parseFloat(winAmount);
    const multiplier = calculateMultiplier(bet, win);
    if (multiplier !== null) {
      return multiplier.toFixed(2);
    }
    return "";
  }, []);

  // Handle slot form changes with auto-calculation
  const handleSlotFormChange = (field: string, value: string | boolean) => {
    const newForm = { ...slotForm, [field]: value };
    
    // Auto-calculate multiplier when bet or win changes
    if ((field === "bet_amount" || field === "win_amount") && newForm.is_played) {
      const calculatedMultiplier = autoCalculateMultiplier(
        field === "bet_amount" ? value as string : newForm.bet_amount,
        field === "win_amount" ? value as string : newForm.win_amount
      );
      if (calculatedMultiplier) {
        newForm.multiplier = calculatedMultiplier;
      }
    }
    
    // Auto-mark as played when win_amount is entered
    if (field === "win_amount" && value && parseFloat(value as string) >= 0) {
      newForm.is_played = true;
    }
    
    setSlotForm(newForm);
  };

  const slotMutation = useMutation({
    mutationFn: async (data: typeof slotForm) => {
      if (!selectedHuntForSlots) throw new Error("No hunt selected");
      
      const betAmount = data.bet_amount ? parseFloat(data.bet_amount) : null;
      const winAmount = data.win_amount ? parseFloat(data.win_amount) : null;
      
      // Auto-calculate multiplier if not provided but bet and win exist
      let multiplier = data.multiplier ? parseFloat(data.multiplier) : null;
      if (!multiplier && betAmount && winAmount !== null) {
        multiplier = calculateMultiplier(betAmount, winAmount);
      }
      
      const payload = {
        hunt_id: selectedHuntForSlots.id,
        slot_name: data.slot_name,
        provider: data.provider || null,
        bet_amount: betAmount,
        win_amount: winAmount,
        multiplier: multiplier,
        is_played: data.is_played,
        sort_order: data.sort_order,
      };

      if (editingSlot) {
        const { error } = await supabase.from("bonus_hunt_slots").update(payload).eq("id", editingSlot.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bonus_hunt_slots").insert(payload);
        if (error) throw error;
      }
      
      // Return hunt ID for stats update
      return selectedHuntForSlots.id;
    },
    onSuccess: async (huntId) => {
      // Auto-update hunt stats after slot change
      await updateBonusHuntStats(huntId);
      
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunt-slots"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
      toast({ title: editingSlot ? "Slot updated - Stats recalculated!" : "Slot added - Stats recalculated!" });
      setIsSlotDialogOpen(false);
      resetSlotForm();
      
      // Check if all slots are played and auto-complete
      await checkAutoComplete(huntId);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bonus_hunt_slots").delete().eq("id", id);
      if (error) throw error;
      return selectedHuntForSlots?.id;
    },
    onSuccess: async (huntId) => {
      // Auto-update hunt stats after slot deletion
      if (huntId) {
        await updateBonusHuntStats(huntId);
      }
      
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunt-slots"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
      toast({ title: "Slot deleted - Stats recalculated!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Manual recalculate stats function
  const recalculateStats = async () => {
    if (!selectedHuntForSlots) return;
    await updateBonusHuntStats(selectedHuntForSlots.id);
    queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
    toast({ title: "Stats recalculated successfully!" });
  };

  // Bulk add slots mutation
  const bulkAddSlotsMutation = useMutation({
    mutationFn: async ({ huntId, slotsToAdd }: { huntId: string; slotsToAdd: { slot_name: string; provider: string; bet_amount: string }[] }) => {
      // Fetch current slot count for this specific hunt
      const { data: existingSlots } = await supabase
        .from("bonus_hunt_slots")
        .select("id")
        .eq("hunt_id", huntId);
      
      const currentSlotCount = existingSlots?.length || 0;
      const payload = slotsToAdd.map((slot, index) => ({
        hunt_id: huntId,
        slot_name: slot.slot_name,
        provider: slot.provider || null,
        bet_amount: slot.bet_amount ? parseFloat(slot.bet_amount) : null,
        sort_order: currentSlotCount + index + 1,
      }));

      const { error } = await supabase.from("bonus_hunt_slots").insert(payload);
      if (error) throw error;
      
      return huntId;
    },
    onSuccess: async (huntId) => {
      await updateBonusHuntStats(huntId);
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunt-slots"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunts"] });
      toast({ title: `Slots added - Stats recalculated!` });
      setIsQuickAddOpen(false);
      setQuickAddHuntId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEditHunt = (hunt: BonusHunt) => {
    setEditingHunt(hunt);
    setHuntForm({
      title: hunt.title,
      date: hunt.date,
      start_time: hunt.start_time ? hunt.start_time.slice(0, 16) : "",
      status: hunt.status,
      starting_balance: hunt.starting_balance?.toString() || "",
      target_balance: hunt.target_balance?.toString() || "",
      ending_balance: hunt.ending_balance?.toString() || "",
      average_bet: hunt.average_bet?.toString() || "",
      highest_win: hunt.highest_win?.toString() || "",
      highest_multiplier: hunt.highest_multiplier?.toString() || "",
      currency: hunt.currency || "USD",
      winner_points: hunt.winner_points?.toString() || "1000",
    });
    setWizardStep(1);
    setIsHuntDialogOpen(true);
  };

  const handleEditSlot = (slot: BonusHuntSlot) => {
    setEditingSlot(slot);
    setSlotForm({
      slot_name: slot.slot_name,
      provider: slot.provider || "",
      bet_amount: slot.bet_amount?.toString() || "",
      win_amount: slot.win_amount?.toString() || "",
      multiplier: slot.multiplier?.toString() || "",
      is_played: slot.is_played,
      sort_order: slot.sort_order,
    });
    setIsSlotDialogOpen(true);
  };

  const addTempSlot = () => {
    if (!newSlotForm.slot_name.trim()) {
      toast({ title: "Please enter a slot name", variant: "destructive" });
      return;
    }
    setTempSlots([...tempSlots, { 
      id: crypto.randomUUID(),
      ...newSlotForm 
    }]);
    setNewSlotForm({ slot_name: "", provider: "", bet_amount: "" });
  };

  const removeTempSlot = (id: string) => {
    setTempSlots(tempSlots.filter(s => s.id !== id));
  };

  const handleCreateHunt = () => {
    if (editingHunt) {
      huntMutation.mutate(huntForm);
    } else {
      createHuntWithSlotsMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bonus Hunt Manager</h2>
          <p className="text-muted-foreground">Create and manage bonus hunts</p>
        </div>
        <Dialog open={isHuntDialogOpen} onOpenChange={(open) => { setIsHuntDialogOpen(open); if (!open) resetHuntForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetHuntForm}>
              <Plus className="w-4 h-4" />
              New Hunt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingHunt ? "Edit Hunt" : `Create New Hunt - Step ${wizardStep} of 2`}
              </DialogTitle>
            </DialogHeader>

            {/* Step Indicators */}
            {!editingHunt && (
              <div className="flex items-center justify-center gap-4 py-4">
                <div className={`flex items-center gap-2 ${wizardStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${wizardStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Hunt Details</span>
                </div>
                <div className="w-8 h-0.5 bg-muted" />
                <div className={`flex items-center gap-2 ${wizardStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${wizardStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Add Slots</span>
                </div>
              </div>
            )}

            {/* Step 1: Hunt Details */}
            {wizardStep === 1 && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={huntForm.title}
                      onChange={(e) => setHuntForm({ ...huntForm, title: e.target.value })}
                      placeholder="BONUS HUNT #1234"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={huntForm.date}
                      onChange={(e) => setHuntForm({ ...huntForm, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={huntForm.start_time}
                      onChange={(e) => setHuntForm({ ...huntForm, start_time: e.target.value })}
                      placeholder="YYYY-MM-DDTHH:mm"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Guesses lock automatically at this time.</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={huntForm.status}
                      onValueChange={(value: "ongoing" | "complete" | "to_be_played") => setHuntForm({ ...huntForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to_be_played">To Be Played</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={huntForm.currency}
                      onValueChange={(value) => setHuntForm({ ...huntForm, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="EUR">€ EUR</SelectItem>
                        <SelectItem value="GBP">£ GBP</SelectItem>
                        <SelectItem value="SEK">kr SEK</SelectItem>
                        <SelectItem value="CAD">C$ CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Starting Balance</Label>
                    <Input
                      type="number"
                      value={huntForm.starting_balance}
                      onChange={(e) => setHuntForm({ ...huntForm, starting_balance: e.target.value })}
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <Label>Target Balance</Label>
                    <Input
                      type="number"
                      value={huntForm.target_balance}
                      onChange={(e) => setHuntForm({ ...huntForm, target_balance: e.target.value })}
                      placeholder="10000"
                    />
                  </div>
                </div>
                {editingHunt && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ending Balance</Label>
                        <Input
                          type="number"
                          value={huntForm.ending_balance}
                          onChange={(e) => setHuntForm({ ...huntForm, ending_balance: e.target.value })}
                          placeholder="15000"
                        />
                      </div>
                      <div>
                        <Label>Average Bet</Label>
                        <Input
                          type="number"
                          value={huntForm.average_bet}
                          onChange={(e) => setHuntForm({ ...huntForm, average_bet: e.target.value })}
                          placeholder="5"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Highest Win</Label>
                        <Input
                          type="number"
                          value={huntForm.highest_win}
                          onChange={(e) => setHuntForm({ ...huntForm, highest_win: e.target.value })}
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <Label>Highest Multiplier</Label>
                        <Input
                          type="number"
                          value={huntForm.highest_multiplier}
                          onChange={(e) => setHuntForm({ ...huntForm, highest_multiplier: e.target.value })}
                          placeholder="1000"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <Label>Winner Points Award</Label>
                  <Input
                    type="number"
                    value={huntForm.winner_points}
                    onChange={(e) => setHuntForm({ ...huntForm, winner_points: e.target.value })}
                    placeholder="1000"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setIsHuntDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  {editingHunt ? (
                    <Button 
                      onClick={() => huntMutation.mutate(huntForm)} 
                      disabled={huntMutation.isPending || !huntForm.title}
                      className="flex-1"
                    >
                      {huntMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Update Hunt
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setWizardStep(2)} 
                      disabled={!huntForm.title}
                      className="flex-1 gap-2"
                    >
                      Next: Add Slots
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Add Slots */}
            {wizardStep === 2 && !editingHunt && (
              <div className="space-y-4 mt-4">
                {/* Add Slot Form */}
                <div className="p-4 bg-secondary/30 rounded-xl space-y-4">
                  <h4 className="font-medium">Add Slot/Bonus</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <SlotPicker
                        value={{ slot_name: newSlotForm.slot_name, provider: newSlotForm.provider }}
                        onChange={(data) => setNewSlotForm({ ...newSlotForm, slot_name: data.slot_name, provider: data.provider })}
                        placeholder="Search for a slot..."
                        showProviderField={true}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bet Amount</Label>
                      <Input
                        type="number"
                        value={newSlotForm.bet_amount}
                        onChange={(e) => setNewSlotForm({ ...newSlotForm, bet_amount: e.target.value })}
                        placeholder="5.00"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <Button onClick={addTempSlot} variant="outline" className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Add Slot
                  </Button>
                </div>

                {/* Slots List */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Slots ({tempSlots.length}) {tempSlots.length === 0 && "- Optional"}
                  </h4>
                  {tempSlots.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {tempSlots.map((slot, index) => (
                        <div key={slot.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                          <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{slot.slot_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {slot.provider || "No provider"} • {slot.bet_amount ? `$${slot.bet_amount}` : "No bet"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeTempSlot(slot.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground bg-secondary/20 rounded-lg">
                      <ListPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No slots added yet</p>
                      <p className="text-xs">You can add slots now or after creating the hunt</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setWizardStep(1)} className="flex-1 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleCreateHunt}
                    disabled={createHuntWithSlotsMutation.isPending || !huntForm.title}
                    className="flex-1"
                  >
                    {createHuntWithSlotsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Hunt {tempSlots.length > 0 && `with ${tempSlots.length} Slots`}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Hunts List */}
      <div className="space-y-4">
        {hunts?.map((hunt) => {
          const guessCount = guessCounts?.[hunt.id] || 0;
          const hasWinner = !!hunt.winner_user_id;
          const canDetermineWinner = hunt.ending_balance && guessCount > 0 && !hasWinner;
          
          return (
            <motion.div
              key={hunt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    hunt.status === "ongoing" ? "bg-green-500 animate-pulse" : 
                    hunt.status === "to_be_played" ? "bg-amber-500" : "bg-muted"
                  }`} />
                  <div>
                    <h3 className="font-semibold">{hunt.title}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(hunt.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Guess Count Badge */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground"
                    onClick={() => setViewingGuessesHuntId(hunt.id)}
                  >
                    <Users className="w-4 h-4" />
                    {guessCount} {guessCount === 1 ? "guess" : "guesses"}
                  </Button>
                  
                  {hunt.ending_balance && (
                    <span className="text-green-500 font-bold">${hunt.ending_balance.toLocaleString()}</span>
                  )}
                  
                  {/* Winner Badge */}
                  {hasWinner && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Winner Picked
                    </span>
                  )}
                  
                  <div className="flex gap-2">
                    {/* Determine Winner Button - only show if no winner picked yet */}
                    {canDetermineWinner && !hasWinner && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                        onClick={() => {
                          if (confirm(`Determine winner from ${guessCount} guesses? This will award ${hunt.winner_points || 1000} points to the closest guess.`)) {
                            determineWinnerMutation.mutate(hunt.id);
                          }
                        }}
                        disabled={determineWinnerMutation.isPending}
                      >
                        {determineWinnerMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Award className="w-4 h-4" />
                        )}
                        Pick Winner
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedHuntForSlots(hunt)}
                    >
                      <ListPlus className="w-4 h-4 mr-1" />
                      Slots
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditHunt(hunt)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("Delete this hunt?")) deleteHuntMutation.mutate(hunt.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Guesses Modal */}
      <Dialog open={!!viewingGuessesHuntId} onOpenChange={(open) => !open && setViewingGuessesHuntId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Guesses ({huntGuesses?.length || 0})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {huntGuesses?.map((guess, index) => {
              const viewingHunt = hunts?.find(h => h.id === viewingGuessesHuntId);
              const diff = viewingHunt?.ending_balance 
                ? Math.abs(guess.guess_amount - viewingHunt.ending_balance)
                : null;
              
              return (
                <div 
                  key={guess.id} 
                  className={`p-3 bg-secondary/30 rounded-lg flex items-center justify-between ${
                    guess.points_earned ? "ring-2 ring-yellow-500/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                    <div>
                      <p className="font-medium">
                        {guess.profiles?.display_name || guess.profiles?.username || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(guess.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${guess.guess_amount.toLocaleString()}</p>
                    {diff !== null && (
                      <p className="text-xs text-muted-foreground">Diff: ${diff.toLocaleString()}</p>
                    )}
                    {guess.points_earned && (
                      <span className="text-xs text-yellow-500 flex items-center gap-1 justify-end">
                        <Trophy className="w-3 h-3" />
                        +{guess.points_earned} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {(!huntGuesses || huntGuesses.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No guesses yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Slots Management Panel */}
      {selectedHuntForSlots && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{selectedHuntForSlots.title} - Slots</h3>
              <p className="text-sm text-muted-foreground">{slots?.length || 0} slots</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={recalculateStats}
              >
                <RefreshCw className="w-4 h-4" />
                Recalculate
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  setQuickAddHuntId(selectedHuntForSlots.id);
                  setIsQuickAddOpen(true);
                }}
              >
                <Zap className="w-4 h-4" />
                Quick Add
              </Button>
              <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={resetSlotForm}>
                    <Plus className="w-4 h-4" />
                    Add Slot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSlot ? "Edit Slot" : "Add Slot"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <SlotPicker
                      value={{ slot_name: slotForm.slot_name, provider: slotForm.provider }}
                      onChange={(data) => {
                        handleSlotFormChange("slot_name", data.slot_name);
                        handleSlotFormChange("provider", data.provider);
                      }}
                      placeholder="Search for a slot..."
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bet Amount</Label>
                        <Input
                          type="number"
                          value={slotForm.bet_amount}
                          onChange={(e) => handleSlotFormChange("bet_amount", e.target.value)}
                          placeholder="5.00"
                        />
                      </div>
                      <div>
                        <Label>Win Amount</Label>
                        <Input
                          type="number"
                          value={slotForm.win_amount}
                          onChange={(e) => handleSlotFormChange("win_amount", e.target.value)}
                          placeholder="1000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          Multiplier
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calculator className="w-3 h-3" />
                            Auto-calculated
                          </span>
                        </Label>
                        <Input
                          type="number"
                          value={slotForm.multiplier}
                          onChange={(e) => handleSlotFormChange("multiplier", e.target.value)}
                          placeholder="Auto or manual"
                        />
                      </div>
                      <div>
                        <Label>Sort Order</Label>
                        <Input
                          type="number"
                          value={slotForm.sort_order}
                          onChange={(e) => handleSlotFormChange("sort_order", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={slotForm.is_played}
                        onChange={(e) => handleSlotFormChange("is_played", e.target.checked)}
                        className="rounded"
                      />
                      <Label>Played (auto-checked when win is entered)</Label>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Auto-calculation:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Multiplier = Win Amount / Bet Amount</li>
                        <li>Hunt stats update automatically when slots change</li>
                      </ul>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button variant="ghost" onClick={() => setIsSlotDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => slotMutation.mutate(slotForm)} 
                        disabled={slotMutation.isPending || !slotForm.slot_name}
                        className="flex-1"
                      >
                        {slotMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingSlot ? "Update" : "Add"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" onClick={() => setSelectedHuntForSlots(null)}>
                Close
              </Button>
            </div>
          </div>

          {/* Slots Table with Drag-Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={async (event: DragEndEvent) => {
              const { active, over } = event;
              if (over && active.id !== over.id && slots) {
                const oldIndex = slots.findIndex((s) => s.id === active.id);
                const newIndex = slots.findIndex((s) => s.id === over.id);
                const newOrder = arrayMove(slots, oldIndex, newIndex);
                
                // Update sort_order for all affected slots
                for (let i = 0; i < newOrder.length; i++) {
                  if (newOrder[i].sort_order !== i + 1) {
                    await supabase
                      .from("bonus_hunt_slots")
                      .update({ sort_order: i + 1 })
                      .eq("id", newOrder[i].id);
                  }
                }
                queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunt-slots"] });
              }
            }}
          >
            <SortableContext items={slots?.map(s => s.id) || []} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {slots?.map((slot) => (
                  <SortableSlotRow
                    key={slot.id}
                    slot={slot}
                    onEdit={handleEditSlot}
                    onDelete={(id) => deleteSlotMutation.mutate(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {(!slots || slots.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <ListPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No slots yet. Click "Add Slot" to add your first slot.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Add Dialog - Outside selectedHuntForSlots block to prevent blank page */}
      <Dialog 
        open={isQuickAddOpen && !!quickAddHuntId} 
        onOpenChange={(open) => {
          setIsQuickAddOpen(open);
          if (!open) setQuickAddHuntId(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick Add Slots</DialogTitle>
          </DialogHeader>
          {quickAddHuntId && (
            <QuickAddSlotsContent
              huntId={quickAddHuntId}
              onAddSlots={async (slotsToAdd) => {
                await bulkAddSlotsMutation.mutateAsync({ huntId: quickAddHuntId, slotsToAdd });
              }}
              isLoading={bulkAddSlotsMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate component that fetches its own slot count
function QuickAddSlotsContent({ 
  huntId, 
  onAddSlots, 
  isLoading 
}: { 
  huntId: string; 
  onAddSlots: (slots: { slot_name: string; provider: string; bet_amount: string }[]) => Promise<void>;
  isLoading: boolean;
}) {
  const { data: slotCount } = useQuery({
    queryKey: ["quick-add-slot-count", huntId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bonus_hunt_slots")
        .select("*", { count: "exact", head: true })
        .eq("hunt_id", huntId);
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <QuickSlotEntry
      onAddSlots={onAddSlots}
      isLoading={isLoading}
      existingSlotCount={slotCount || 0}
    />
  );
}
