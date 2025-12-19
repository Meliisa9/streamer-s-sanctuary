import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2, Loader2, RotateCcw } from "lucide-react";

interface InlineWinEditorProps {
  slotId: string;
  currentWin: number | null;
  betAmount: number | null;
  currencySymbol: string;
  isPlayed: boolean;
  onSave: (slotId: string, winAmount: number) => Promise<void>;
  onReset?: (slotId: string) => Promise<void>;
  isSaving: boolean;
}

export function InlineWinEditor({
  slotId,
  currentWin,
  betAmount,
  currencySymbol,
  isPlayed,
  onSave,
  onReset,
  isSaving,
}: InlineWinEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [winValue, setWinValue] = useState(currentWin?.toString() || "");
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = async () => {
    const amount = parseFloat(winValue);
    if (isNaN(amount) || amount < 0) return;
    
    await onSave(slotId, amount);
    setIsEditing(false);
  };

  const handleReset = async () => {
    if (!onReset) return;
    setIsResetting(true);
    try {
      await onReset(slotId);
      setWinValue("");
      setIsEditing(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setWinValue(currentWin?.toString() || "");
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={winValue}
          onChange={(e) => setWinValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 w-24 text-sm font-mono"
          autoFocus
          disabled={isSaving || isResetting}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
          disabled={isSaving || isResetting}
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3 text-green-500" />
          )}
        </Button>
        {onReset && isPlayed && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleReset}
            disabled={isSaving || isResetting}
            title="Reset slot"
          >
            {isResetting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RotateCcw className="w-3 h-3 text-orange-500" />
            )}
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => {
            setIsEditing(false);
            setWinValue(currentWin?.toString() || "");
          }}
          disabled={isSaving || isResetting}
        >
          <X className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    );
  }

  const isBigWin = (currentWin || 0) >= (betAmount || 1) * 50;

  return (
    <button
      onClick={() => {
        setWinValue(currentWin?.toString() || "");
        setIsEditing(true);
      }}
      className="group flex items-center gap-1 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
    >
      {isPlayed && currentWin !== null ? (
        <span
          className={`text-sm font-bold font-mono ${
            isBigWin
              ? "text-yellow-500"
              : currentWin > 0
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {currencySymbol}
          {currentWin.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )}
      <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
