import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    setShowPicker(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowPicker(!showPicker)}
        className="h-9 w-9 p-0"
      >
        <Smile className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
      </Button>
      
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="dark"
            previewPosition="none"
            skinTonePosition="none"
            maxFrequentRows={2}
          />
        </div>
      )}
    </div>
  );
}
