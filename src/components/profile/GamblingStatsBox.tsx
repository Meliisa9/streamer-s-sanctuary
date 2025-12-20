import { motion } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, TrendingUp, Sparkles, Zap, Target } from "lucide-react";

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

interface GamblingStatsBoxProps {
  favoriteSlot?: string | null;
  favoriteCasino?: string | null;
  biggestWin?: string | null;
}

export function GamblingStatsBox({ favoriteSlot, favoriteCasino, biggestWin }: GamblingStatsBoxProps) {
  // Pick a random dice icon for visual variety
  const RandomDice = diceIcons[Math.floor(Math.random() * diceIcons.length)];

  const tips = [
    { icon: Target, text: "Set limits before you play", color: "text-blue-400" },
    { icon: Zap, text: "Take breaks regularly", color: "text-yellow-400" },
    { icon: TrendingUp, text: "Only bet what you can afford", color: "text-green-400" },
    { icon: Sparkles, text: "Enjoy the entertainment!", color: "text-purple-400" },
  ];

  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  const TipIcon = randomTip.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl p-6 mt-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <RandomDice className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Casino Corner</h3>
          <p className="text-xs text-muted-foreground">Streaming & slots stats</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      {(favoriteSlot || favoriteCasino || biggestWin) ? (
        <div className="grid grid-cols-1 gap-3 mb-4">
          {favoriteSlot && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Favorite Slot</p>
                <p className="font-medium text-sm truncate">{favoriteSlot}</p>
              </div>
            </div>
          )}
          {favoriteCasino && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
              <Dice5 className="w-4 h-4 text-green-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Favorite Casino</p>
                <p className="font-medium text-sm truncate">{favoriteCasino}</p>
              </div>
            </div>
          )}
          {biggestWin && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <TrendingUp className="w-4 h-4 text-yellow-500" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-yellow-500/80">Biggest Win</p>
                <p className="font-bold text-sm truncate text-yellow-500">{biggestWin}</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Responsible Gambling Tip */}
      <div className="p-3 rounded-xl bg-secondary/20 border border-border/50">
        <div className="flex items-center gap-2">
          <TipIcon className={`w-4 h-4 ${randomTip.color}`} />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Tip:</span> {randomTip.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
