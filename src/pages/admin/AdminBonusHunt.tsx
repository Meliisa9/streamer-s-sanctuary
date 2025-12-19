import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  ListPlus, Eye, CheckCircle2, ArrowRight, ArrowLeft, X
} from "lucide-react";

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
  currency?: string;
  winner_points?: number;
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

export default function AdminBonusHunt() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHuntDialogOpen, setIsHuntDialogOpen] = useState(false);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [editingHunt, setEditingHunt] = useState<BonusHunt | null>(null);
  const [selectedHuntForSlots, setSelectedHuntForSlots] = useState<BonusHunt | null>(null);
  const [editingSlot, setEditingSlot] = useState<BonusHuntSlot | null>(null);
  
  // Multi-step wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [tempSlots, setTempSlots] = useState<TempSlot[]>([]);
  const [newSlotForm, setNewSlotForm] = useState({ slot_name: "", provider: "", bet_amount: "" });

  const [huntForm, setHuntForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
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

  const resetHuntForm = () => {
    setHuntForm({
      title: "",
      date: new Date().toISOString().split("T")[0],
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

  const slotMutation = useMutation({
    mutationFn: async (data: typeof slotForm) => {
      if (!selectedHuntForSlots) throw new Error("No hunt selected");
      
      const payload = {
        hunt_id: selectedHuntForSlots.id,
        slot_name: data.slot_name,
        provider: data.provider || null,
        bet_amount: data.bet_amount ? parseFloat(data.bet_amount) : null,
        win_amount: data.win_amount ? parseFloat(data.win_amount) : null,
        multiplier: data.multiplier ? parseFloat(data.multiplier) : null,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunt-slots"] });
      toast({ title: editingSlot ? "Slot updated" : "Slot added" });
      setIsSlotDialogOpen(false);
      resetSlotForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bonus_hunt_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-hunt-slots"] });
      toast({ title: "Slot deleted" });
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
                    <div>
                      <Label className="text-xs">Slot Name *</Label>
                      <Input
                        value={newSlotForm.slot_name}
                        onChange={(e) => setNewSlotForm({ ...newSlotForm, slot_name: e.target.value })}
                        placeholder="Gates of Olympus"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Provider</Label>
                      <Input
                        value={newSlotForm.provider}
                        onChange={(e) => setNewSlotForm({ ...newSlotForm, provider: e.target.value })}
                        placeholder="Pragmatic Play"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bet Amount</Label>
                      <Input
                        type="number"
                        value={newSlotForm.bet_amount}
                        onChange={(e) => setNewSlotForm({ ...newSlotForm, bet_amount: e.target.value })}
                        placeholder="5.00"
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
        {hunts?.map((hunt) => (
          <motion.div
            key={hunt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-4">
                {hunt.ending_balance && (
                  <span className="text-green-500 font-bold">${hunt.ending_balance.toLocaleString()}</span>
                )}
                <div className="flex gap-2">
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
        ))}
      </div>

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
                    <div>
                      <Label>Slot Name</Label>
                      <Input
                        value={slotForm.slot_name}
                        onChange={(e) => setSlotForm({ ...slotForm, slot_name: e.target.value })}
                        placeholder="Gates of Olympus"
                      />
                    </div>
                    <div>
                      <Label>Provider</Label>
                      <Input
                        value={slotForm.provider}
                        onChange={(e) => setSlotForm({ ...slotForm, provider: e.target.value })}
                        placeholder="Pragmatic Play"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bet Amount</Label>
                        <Input
                          type="number"
                          value={slotForm.bet_amount}
                          onChange={(e) => setSlotForm({ ...slotForm, bet_amount: e.target.value })}
                          placeholder="5.00"
                        />
                      </div>
                      <div>
                        <Label>Win Amount</Label>
                        <Input
                          type="number"
                          value={slotForm.win_amount}
                          onChange={(e) => setSlotForm({ ...slotForm, win_amount: e.target.value })}
                          placeholder="1000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Multiplier</Label>
                        <Input
                          type="number"
                          value={slotForm.multiplier}
                          onChange={(e) => setSlotForm({ ...slotForm, multiplier: e.target.value })}
                          placeholder="200"
                        />
                      </div>
                      <div>
                        <Label>Sort Order</Label>
                        <Input
                          type="number"
                          value={slotForm.sort_order}
                          onChange={(e) => setSlotForm({ ...slotForm, sort_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={slotForm.is_played}
                        onChange={(e) => setSlotForm({ ...slotForm, is_played: e.target.checked })}
                        className="rounded"
                      />
                      <Label>Played</Label>
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

          {/* Slots Table */}
          <div className="space-y-2">
            {slots?.map((slot) => (
              <div key={slot.id} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground w-8">#{slot.sort_order}</span>
                <div className={`w-3 h-3 rounded-full ${slot.is_played ? "bg-green-500" : "bg-muted"}`} />
                <div className="flex-1">
                  <p className="font-medium">{slot.slot_name}</p>
                  <p className="text-xs text-muted-foreground">{slot.provider}</p>
                </div>
                <div className="text-right">
                  {slot.bet_amount && <p className="text-sm">Bet: ${slot.bet_amount}</p>}
                  {slot.win_amount && <p className="text-sm text-green-500">Win: ${slot.win_amount}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditSlot(slot)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete this slot?")) deleteSlotMutation.mutate(slot.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!slots || slots.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <ListPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No slots yet. Click "Add Slot" to add your first slot.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
