import { Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface Poll {
  id: string;
  title: string;
  description: string | null;
  options: string[];
  is_active: boolean;
  total_votes: number;
  ends_at: string | null;
}

interface PreviousPollModalProps {
  poll: Poll | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voteCountsData: Record<string, Record<number, number>>;
}

export function PreviousPollModal({
  poll,
  open,
  onOpenChange,
  voteCountsData,
}: PreviousPollModalProps) {
  if (!poll) return null;

  const getVotePercentage = (optionIndex: number) => {
    const pollVotes = voteCountsData[poll.id] || {};
    const totalPollVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);
    if (totalPollVotes === 0) return 0;
    return Math.round(((pollVotes[optionIndex] || 0) / totalPollVotes) * 100);
  };

  const getVoteCount = (optionIndex: number) => {
    return voteCountsData[poll.id]?.[optionIndex] || 0;
  };

  const getWinningOption = () => {
    const pollVotes = voteCountsData[poll.id] || {};
    let maxVotes = 0;
    let winningIndex = 0;
    Object.entries(pollVotes).forEach(([index, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winningIndex = parseInt(index);
      }
    });
    return { option: poll.options[winningIndex], votes: maxVotes, index: winningIndex };
  };

  const winner = getWinningOption();
  const expired = poll.ends_at ? new Date(poll.ends_at) <= new Date() : !poll.is_active;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {poll.title}
            {expired && poll.is_active && (
              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded">Expired</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {poll.description && (
          <p className="text-sm text-muted-foreground">{poll.description}</p>
        )}

        <div className="space-y-3 mt-2">
          {poll.options.map((option, optionIndex) => {
            const percentage = getVotePercentage(optionIndex);
            const voteCount = getVoteCount(optionIndex);
            const isWinner = optionIndex === winner.index && winner.votes > 0;

            return (
              <div
                key={optionIndex}
                className={`p-3 rounded-lg ${
                  isWinner ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
                }`}
              >
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2 font-medium">
                    {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                    {option}
                  </span>
                  <span className="text-muted-foreground">
                    {percentage}% ({voteCount} votes)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>

        <div className="text-sm text-muted-foreground mt-2">
          Total votes: {poll.total_votes || Object.values(voteCountsData[poll.id] || {}).reduce((a, b) => a + b, 0)}
        </div>
      </DialogContent>
    </Dialog>
  );
}