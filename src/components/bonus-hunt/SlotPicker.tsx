import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface SlotData {
  name: string;
  provider: string;
}

interface SlotPickerProps {
  value: { slot_name: string; provider: string };
  onChange: (data: { slot_name: string; provider: string }) => void;
  placeholder?: string;
  showProviderField?: boolean;
}

// Comprehensive slot database with providers
const SLOT_DATABASE: SlotData[] = [
  // Pragmatic Play
  { name: "Gates of Olympus", provider: "Pragmatic Play" },
  { name: "Gates of Olympus 1000", provider: "Pragmatic Play" },
  { name: "Sweet Bonanza", provider: "Pragmatic Play" },
  { name: "Sweet Bonanza 1000", provider: "Pragmatic Play" },
  { name: "Sugar Rush", provider: "Pragmatic Play" },
  { name: "Sugar Rush 1000", provider: "Pragmatic Play" },
  { name: "Starlight Princess", provider: "Pragmatic Play" },
  { name: "Starlight Princess 1000", provider: "Pragmatic Play" },
  { name: "The Dog House", provider: "Pragmatic Play" },
  { name: "The Dog House Megaways", provider: "Pragmatic Play" },
  { name: "Big Bass Bonanza", provider: "Pragmatic Play" },
  { name: "Fruit Party", provider: "Pragmatic Play" },
  { name: "Madame Destiny Megaways", provider: "Pragmatic Play" },
  { name: "Wild West Gold", provider: "Pragmatic Play" },
  { name: "5 Lions Megaways", provider: "Pragmatic Play" },
  { name: "Buffalo King Megaways", provider: "Pragmatic Play" },
  { name: "Zeus vs Hades", provider: "Pragmatic Play" },
  { name: "Cleocatra", provider: "Pragmatic Play" },
  { name: "Gems Bonanza", provider: "Pragmatic Play" },
  { name: "Gates of Gatot Kaca", provider: "Pragmatic Play" },
  
  // Hacksaw Gaming
  { name: "Wanted Dead or a Wild", provider: "Hacksaw Gaming" },
  { name: "Chaos Crew", provider: "Hacksaw Gaming" },
  { name: "Chaos Crew 2", provider: "Hacksaw Gaming" },
  { name: "Stack 'Em", provider: "Hacksaw Gaming" },
  { name: "RIP City", provider: "Hacksaw Gaming" },
  { name: "Xpander", provider: "Hacksaw Gaming" },
  { name: "Fruity Treats", provider: "Hacksaw Gaming" },
  { name: "Hand of Anubis", provider: "Hacksaw Gaming" },
  { name: "IteroClassic", provider: "Hacksaw Gaming" },
  { name: "Toshi Video Club", provider: "Hacksaw Gaming" },
  { name: "Le Bandit", provider: "Hacksaw Gaming" },
  { name: "Gladiator Legends", provider: "Hacksaw Gaming" },
  { name: "Cube Loco", provider: "Hacksaw Gaming" },
  { name: "Cash Crew", provider: "Hacksaw Gaming" },
  
  // Nolimit City
  { name: "Mental", provider: "Nolimit City" },
  { name: "San Quentin", provider: "Nolimit City" },
  { name: "San Quentin xWays", provider: "Nolimit City" },
  { name: "Tombstone RIP", provider: "Nolimit City" },
  { name: "Tombstone", provider: "Nolimit City" },
  { name: "Punk Rocker", provider: "Nolimit City" },
  { name: "Fire in the Hole", provider: "Nolimit City" },
  { name: "Fire in the Hole 2", provider: "Nolimit City" },
  { name: "Misery Mining", provider: "Nolimit City" },
  { name: "El Paso Gunfight xNudge", provider: "Nolimit City" },
  { name: "Book of Shadows", provider: "Nolimit City" },
  { name: "Deadwood", provider: "Nolimit City" },
  { name: "Karen Maneater", provider: "Nolimit City" },
  { name: "Remember Gulag", provider: "Nolimit City" },
  { name: "xWays Hoarder xSplit", provider: "Nolimit City" },
  { name: "Gaelic Gold", provider: "Nolimit City" },
  { name: "Serial", provider: "Nolimit City" },
  { name: "Folsom Prison", provider: "Nolimit City" },
  { name: "Road Rage", provider: "Nolimit City" },
  { name: "Warrior Graveyard", provider: "Nolimit City" },
  
  // Play'n GO
  { name: "Book of Dead", provider: "Play'n GO" },
  { name: "Reactoonz", provider: "Play'n GO" },
  { name: "Reactoonz 2", provider: "Play'n GO" },
  { name: "Fire Joker", provider: "Play'n GO" },
  { name: "Legacy of Dead", provider: "Play'n GO" },
  { name: "Rise of Olympus", provider: "Play'n GO" },
  { name: "Rise of Olympus 100", provider: "Play'n GO" },
  { name: "Moon Princess", provider: "Play'n GO" },
  { name: "Moon Princess 100", provider: "Play'n GO" },
  { name: "Hugo 2", provider: "Play'n GO" },
  { name: "Wizard of Gems", provider: "Play'n GO" },
  { name: "Rich Wilde", provider: "Play'n GO" },
  { name: "Cat Wilde", provider: "Play'n GO" },
  
  // NetEnt
  { name: "Gonzo's Quest", provider: "NetEnt" },
  { name: "Gonzo's Quest Megaways", provider: "NetEnt" },
  { name: "Dead or Alive 2", provider: "NetEnt" },
  { name: "Dead or Alive", provider: "NetEnt" },
  { name: "Starburst", provider: "NetEnt" },
  { name: "Starburst XXXtreme", provider: "NetEnt" },
  { name: "Narcos", provider: "NetEnt" },
  { name: "Divine Fortune", provider: "NetEnt" },
  { name: "Divine Fortune Megaways", provider: "NetEnt" },
  { name: "Jack and the Beanstalk", provider: "NetEnt" },
  { name: "Twin Spin", provider: "NetEnt" },
  { name: "Blood Suckers", provider: "NetEnt" },
  { name: "Blood Suckers 2", provider: "NetEnt" },
  
  // Big Time Gaming
  { name: "Bonanza", provider: "Big Time Gaming" },
  { name: "Extra Chilli", provider: "Big Time Gaming" },
  { name: "Extra Chilli Epic Spins", provider: "Big Time Gaming" },
  { name: "White Rabbit", provider: "Big Time Gaming" },
  { name: "Danger High Voltage", provider: "Big Time Gaming" },
  { name: "Danger High Voltage 2", provider: "Big Time Gaming" },
  { name: "Rasputin Megaways", provider: "Big Time Gaming" },
  { name: "Lil Devil", provider: "Big Time Gaming" },
  { name: "Who Wants to Be a Millionaire", provider: "Big Time Gaming" },
  { name: "Kingmaker", provider: "Big Time Gaming" },
  
  // Push Gaming
  { name: "Jammin' Jars", provider: "Push Gaming" },
  { name: "Jammin' Jars 2", provider: "Push Gaming" },
  { name: "Razor Shark", provider: "Push Gaming" },
  { name: "Fat Rabbit", provider: "Push Gaming" },
  { name: "Wild Swarm", provider: "Push Gaming" },
  { name: "Wild Swarm 2", provider: "Push Gaming" },
  { name: "Mystery Mission: To The Moon", provider: "Push Gaming" },
  { name: "Space Stacks", provider: "Push Gaming" },
  
  // Relax Gaming
  { name: "Money Train", provider: "Relax Gaming" },
  { name: "Money Train 2", provider: "Relax Gaming" },
  { name: "Money Train 3", provider: "Relax Gaming" },
  { name: "Money Train 4", provider: "Relax Gaming" },
  { name: "Temple Tumble", provider: "Relax Gaming" },
  { name: "Temple Tumble 2", provider: "Relax Gaming" },
  { name: "Dream Drop Diamonds", provider: "Relax Gaming" },
  { name: "Snake Arena", provider: "Relax Gaming" },
  
  // Red Tiger
  { name: "Gonzo's Quest Megaways", provider: "Red Tiger" },
  { name: "Dragon's Fire Megaways", provider: "Red Tiger" },
  { name: "Piggy Riches Megaways", provider: "Red Tiger" },
  { name: "Reel King Megaways", provider: "Red Tiger" },
  
  // ELK Studios
  { name: "Kaiju", provider: "ELK Studios" },
  { name: "Wild Toro", provider: "ELK Studios" },
  { name: "Wild Toro 2", provider: "ELK Studios" },
  { name: "Cygnus", provider: "ELK Studios" },
  { name: "Cygnus 2", provider: "ELK Studios" },
  { name: "Pirots", provider: "ELK Studios" },
  { name: "Pirots 2", provider: "ELK Studios" },
  { name: "Pirots 3", provider: "ELK Studios" },
  
  // Thunderkick
  { name: "Beat the Beast", provider: "Thunderkick" },
  { name: "Pink Elephants", provider: "Thunderkick" },
  { name: "Pink Elephants 2", provider: "Thunderkick" },
  { name: "Esqueleto Explosivo", provider: "Thunderkick" },
  { name: "Esqueleto Explosivo 2", provider: "Thunderkick" },
  
  // Yggdrasil
  { name: "Valley of the Gods", provider: "Yggdrasil" },
  { name: "Valley of the Gods 2", provider: "Yggdrasil" },
  { name: "Vikings Go Berzerk", provider: "Yggdrasil" },
  { name: "Vikings Go Wild", provider: "Yggdrasil" },
  { name: "Hades: Gigablox", provider: "Yggdrasil" },
  
  // Blueprint Gaming
  { name: "Eye of Horus", provider: "Blueprint Gaming" },
  { name: "Eye of Horus Megaways", provider: "Blueprint Gaming" },
  { name: "Legacy of Ra Megaways", provider: "Blueprint Gaming" },
  { name: "Genie Jackpots Megaways", provider: "Blueprint Gaming" },
  
  // Microgaming
  { name: "Immortal Romance", provider: "Microgaming" },
  { name: "Mega Moolah", provider: "Microgaming" },
  { name: "Thunderstruck 2", provider: "Microgaming" },
  { name: "9 Masks of Fire", provider: "Microgaming" },
  
  // Evolution / Red Tiger
  { name: "Crazy Time", provider: "Evolution" },
  { name: "Lightning Roulette", provider: "Evolution" },
  { name: "Monopoly Live", provider: "Evolution" },
];

export function SlotPicker({ value, onChange, placeholder = "Search slots...", showProviderField = true }: SlotPickerProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value.slot_name || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input - search both name and provider
  const filteredSlots = SLOT_DATABASE.filter(slot => {
    const query = searchQuery.toLowerCase();
    return slot.name.toLowerCase().includes(query) || 
           slot.provider.toLowerCase().includes(query);
  }).slice(0, 10);

  const handleSelectSlot = (slot: SlotData) => {
    setSearchQuery(slot.name);
    onChange({ slot_name: slot.name, provider: slot.provider });
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange({ ...value, slot_name: newValue });
    setShowSuggestions(true);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, provider: e.target.value });
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync search query with value prop
  useEffect(() => {
    if (value.slot_name !== searchQuery && !showSuggestions) {
      setSearchQuery(value.slot_name || "");
    }
  }, [value.slot_name]);

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="relative">
        <Label className="text-xs">Slot Name</Label>
        <div className="relative">
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="h-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                onChange({ slot_name: "", provider: "" });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && filteredSlots.length > 0 && searchQuery && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSlots.map((slot, index) => (
              <button
                key={`${slot.name}-${slot.provider}-${index}`}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center justify-between"
                onClick={() => handleSelectSlot(slot)}
              >
                <span className="font-medium text-sm">{slot.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {slot.provider}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {showProviderField && (
        <div>
          <Label className="text-xs">Provider</Label>
          <Input
            value={value.provider}
            onChange={handleProviderChange}
            placeholder="Provider (auto-filled)"
            className="h-9"
          />
        </div>
      )}
    </div>
  );
}

export { SLOT_DATABASE };
