import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Zap, FileText, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SlotEntry {
  slot_name: string;
  provider: string;
  bet_amount: string;
}

interface QuickSlotEntryProps {
  onAddSlots: (slots: SlotEntry[]) => Promise<void>;
  isLoading: boolean;
  existingSlotCount: number;
}

// Common slot providers for autocomplete
const COMMON_PROVIDERS = [
  "Pragmatic Play",
  "NetEnt",
  "Play'n GO",
  "Big Time Gaming",
  "Nolimit City",
  "Hacksaw Gaming",
  "Push Gaming",
  "Red Tiger",
  "Relax Gaming",
  "Evolution",
  "Microgaming",
  "Yggdrasil",
  "ELK Studios",
  "Thunderkick",
  "Blueprint Gaming"
];

// Common slots for quick entry
const POPULAR_SLOTS = [
  { name: "Gates of Olympus", provider: "Pragmatic Play" },
  { name: "Sweet Bonanza", provider: "Pragmatic Play" },
  { name: "Sugar Rush", provider: "Pragmatic Play" },
  { name: "Starlight Princess", provider: "Pragmatic Play" },
  { name: "Wanted Dead or a Wild", provider: "Hacksaw Gaming" },
  { name: "Mental", provider: "Nolimit City" },
  { name: "San Quentin", provider: "Nolimit City" },
  { name: "Tombstone RIP", provider: "Nolimit City" },
  { name: "Book of Dead", provider: "Play'n GO" },
  { name: "Reactoonz", provider: "Play'n GO" },
  { name: "Gonzo's Quest", provider: "NetEnt" },
  { name: "Dead or Alive 2", provider: "NetEnt" },
];

export function QuickSlotEntry({ onAddSlots, isLoading, existingSlotCount }: QuickSlotEntryProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"quick" | "bulk">("quick");
  
  // Quick entry state
  const [quickSlot, setQuickSlot] = useState<SlotEntry>({ slot_name: "", provider: "", bet_amount: "" });
  const [pendingSlots, setPendingSlots] = useState<SlotEntry[]>([]);
  const [showProviderSuggestions, setShowProviderSuggestions] = useState(false);
  const [showSlotSuggestions, setShowSlotSuggestions] = useState(false);
  const slotInputRef = useRef<HTMLInputElement>(null);
  const providerInputRef = useRef<HTMLInputElement>(null);
  
  // Bulk entry state
  const [bulkText, setBulkText] = useState("");
  const [defaultBet, setDefaultBet] = useState("");

  // Filter suggestions based on input
  const filteredProviders = COMMON_PROVIDERS.filter(p => 
    p.toLowerCase().includes(quickSlot.provider.toLowerCase())
  ).slice(0, 5);
  
  const filteredSlots = POPULAR_SLOTS.filter(s => 
    s.name.toLowerCase().includes(quickSlot.slot_name.toLowerCase())
  ).slice(0, 5);

  const handleQuickAdd = () => {
    if (!quickSlot.slot_name.trim()) {
      toast({ title: "Enter a slot name", variant: "destructive" });
      return;
    }
    
    setPendingSlots([...pendingSlots, { ...quickSlot }]);
    setQuickSlot({ slot_name: "", provider: quickSlot.provider, bet_amount: quickSlot.bet_amount });
    slotInputRef.current?.focus();
  };

  const handleSelectSlotSuggestion = (slot: typeof POPULAR_SLOTS[0]) => {
    setQuickSlot({ ...quickSlot, slot_name: slot.name, provider: slot.provider });
    setShowSlotSuggestions(false);
  };

  const handleSelectProviderSuggestion = (provider: string) => {
    setQuickSlot({ ...quickSlot, provider });
    setShowProviderSuggestions(false);
  };

  const removePendingSlot = (index: number) => {
    setPendingSlots(pendingSlots.filter((_, i) => i !== index));
  };

  const handleSubmitAll = async () => {
    const slotsToAdd = mode === "quick" ? pendingSlots : parseBulkText();
    
    if (slotsToAdd.length === 0) {
      toast({ title: "No slots to add", variant: "destructive" });
      return;
    }
    
    await onAddSlots(slotsToAdd);
    setPendingSlots([]);
    setBulkText("");
  };

  const parseBulkText = (): SlotEntry[] => {
    const lines = bulkText.split("\n").filter(line => line.trim());
    return lines.map(line => {
      // Try to parse "SlotName - Provider" or "SlotName (Provider)" or just "SlotName"
      let slot_name = line.trim();
      let provider = "";
      
      // Check for "SlotName - Provider" format
      if (line.includes(" - ")) {
        const parts = line.split(" - ");
        slot_name = parts[0].trim();
        provider = parts[1]?.trim() || "";
      }
      // Check for "SlotName (Provider)" format
      else if (line.includes("(") && line.includes(")")) {
        const match = line.match(/^(.+?)\s*\((.+?)\)\s*$/);
        if (match) {
          slot_name = match[1].trim();
          provider = match[2].trim();
        }
      }
      // Check for tab-separated
      else if (line.includes("\t")) {
        const parts = line.split("\t");
        slot_name = parts[0].trim();
        provider = parts[1]?.trim() || "";
      }
      
      return {
        slot_name,
        provider,
        bet_amount: defaultBet
      };
    });
  };

  const previewBulkSlots = parseBulkText();

  // Handle Enter key for quick add
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && quickSlot.slot_name.trim()) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "quick" | "bulk")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick" className="gap-2">
            <Zap className="w-4 h-4" />
            Quick Entry
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <FileText className="w-4 h-4" />
            Bulk Paste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-4 mt-4">
          {/* Quick entry form */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-5 relative">
              <Label className="text-xs">Slot Name</Label>
              <Input
                ref={slotInputRef}
                value={quickSlot.slot_name}
                onChange={(e) => {
                  setQuickSlot({ ...quickSlot, slot_name: e.target.value });
                  setShowSlotSuggestions(true);
                }}
                onFocus={() => setShowSlotSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSlotSuggestions(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder="Gates of Olympus"
                className="h-9"
              />
              {showSlotSuggestions && filteredSlots.length > 0 && quickSlot.slot_name && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredSlots.map((slot) => (
                    <button
                      key={slot.name}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      onClick={() => handleSelectSlotSuggestion(slot)}
                    >
                      <span className="font-medium">{slot.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{slot.provider}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="col-span-4 relative">
              <Label className="text-xs">Provider</Label>
              <Input
                ref={providerInputRef}
                value={quickSlot.provider}
                onChange={(e) => {
                  setQuickSlot({ ...quickSlot, provider: e.target.value });
                  setShowProviderSuggestions(true);
                }}
                onFocus={() => setShowProviderSuggestions(true)}
                onBlur={() => setTimeout(() => setShowProviderSuggestions(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder="Pragmatic"
                className="h-9"
              />
              {showProviderSuggestions && filteredProviders.length > 0 && quickSlot.provider && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredProviders.map((provider) => (
                    <button
                      key={provider}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      onClick={() => handleSelectProviderSuggestion(provider)}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="col-span-2">
              <Label className="text-xs">Bet</Label>
              <Input
                type="number"
                value={quickSlot.bet_amount}
                onChange={(e) => setQuickSlot({ ...quickSlot, bet_amount: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="5"
                className="h-9"
              />
            </div>
            
            <div className="col-span-1 flex items-end">
              <Button 
                size="sm" 
                className="h-9 w-full"
                onClick={handleQuickAdd}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Pending slots list */}
          {pendingSlots.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Pending ({pendingSlots.length} slots)
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setPendingSlots([])}
                  className="h-6 text-xs"
                >
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                {pendingSlots.map((slot, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {slot.slot_name}
                    {slot.bet_amount && <span className="text-muted-foreground">${slot.bet_amount}</span>}
                    <button 
                      onClick={() => removePendingSlot(index)}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Popular slots shortcuts */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Popular Slots</Label>
            <div className="flex flex-wrap gap-1">
              {POPULAR_SLOTS.slice(0, 8).map((slot) => (
                <Button
                  key={slot.name}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setPendingSlots([...pendingSlots, { 
                      slot_name: slot.name, 
                      provider: slot.provider, 
                      bet_amount: quickSlot.bet_amount 
                    }]);
                  }}
                >
                  {slot.name}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Paste slot list</Label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Default bet:</Label>
                <Input
                  type="number"
                  value={defaultBet}
                  onChange={(e) => setDefaultBet(e.target.value)}
                  placeholder="5"
                  className="h-7 w-20"
                />
              </div>
            </div>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Paste slot names, one per line:\nGates of Olympus - Pragmatic Play\nSweet Bonanza (Pragmatic Play)\nMental\nSan Quentin`}
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Formats: "Slot Name - Provider", "Slot Name (Provider)", or just "Slot Name"
            </p>
          </div>

          {/* Preview */}
          {previewBulkSlots.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Preview ({previewBulkSlots.length} slots)
              </Label>
              <div className="max-h-32 overflow-y-auto p-2 bg-muted/30 rounded-lg space-y-1">
                {previewBulkSlots.slice(0, 10).map((slot, index) => (
                  <div key={index} className="text-xs flex items-center gap-2">
                    <span className="text-muted-foreground w-4">{index + 1}.</span>
                    <span className="font-medium">{slot.slot_name}</span>
                    {slot.provider && <span className="text-muted-foreground">({slot.provider})</span>}
                  </div>
                ))}
                {previewBulkSlots.length > 10 && (
                  <div className="text-xs text-muted-foreground">
                    ...and {previewBulkSlots.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit button */}
      <Button 
        className="w-full gap-2" 
        onClick={handleSubmitAll}
        disabled={isLoading || (mode === "quick" ? pendingSlots.length === 0 : previewBulkSlots.length === 0)}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        Add {mode === "quick" ? pendingSlots.length : previewBulkSlots.length} Slots
        {existingSlotCount > 0 && (
          <span className="text-muted-foreground text-xs">(#{existingSlotCount + 1}+)</span>
        )}
      </Button>
    </div>
  );
}
