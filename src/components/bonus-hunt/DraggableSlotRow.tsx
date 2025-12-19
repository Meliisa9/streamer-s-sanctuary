import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, GripVertical } from "lucide-react";

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

interface DraggableSlotRowProps {
  slot: BonusHuntSlot;
  onEdit: (slot: BonusHuntSlot) => void;
  onDelete: (id: string) => void;
}

export function DraggableSlotRow({ slot, onEdit, onDelete }: DraggableSlotRowProps) {
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
