import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react";

interface BonusHuntProgressProps {
  startingBalance: number;
  currentBalance: number;
  targetBalance?: number;
  currency: string;
}

export function BonusHuntProgress({ 
  startingBalance, 
  currentBalance, 
  targetBalance,
  currency 
}: BonusHuntProgressProps) {
  const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "SEK" ? "kr" : currency === "CAD" ? "C$" : "$";
  
  // Calculate progress percentage
  const target = targetBalance || startingBalance;
  const progressPercent = target > 0 ? Math.min((currentBalance / target) * 100, 150) : 0;
  const vsStartPercent = startingBalance > 0 ? (currentBalance / startingBalance) * 100 : 0;
  
  const isProfit = currentBalance >= startingBalance;
  const profitLoss = currentBalance - startingBalance;
  const profitLossPercent = startingBalance > 0 ? ((profitLoss / startingBalance) * 100).toFixed(1) : "0";
  
  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Progress</span>
        <div className={`flex items-center gap-1 text-sm font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
          {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isProfit ? '+' : ''}{currencySymbol}{profitLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="text-xs font-normal">({profitLossPercent}%)</span>
        </div>
      </div>
      
      {/* Main progress bar */}
      <div className="space-y-2">
        <div className="relative">
          <Progress 
            value={Math.min(progressPercent, 100)} 
            className="h-4"
          />
          {/* Marker for starting balance position */}
          {targetBalance && targetBalance !== startingBalance && (
            <div 
              className="absolute top-0 h-full w-0.5 bg-yellow-500"
              style={{ left: `${(startingBalance / targetBalance) * 100}%` }}
              title={`Starting: ${currencySymbol}${startingBalance.toLocaleString()}`}
            />
          )}
        </div>
        
        {/* Progress labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span>Start: {currencySymbol}{startingBalance.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-foreground">
            Current: {currencySymbol}{currentBalance.toLocaleString()}
          </div>
          {targetBalance && (
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>Target: {currencySymbol}{targetBalance.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Secondary stat - vs starting */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <span className="text-xs text-muted-foreground">vs Starting Balance</span>
        <span className={`text-sm font-bold ${vsStartPercent >= 100 ? 'text-green-500' : 'text-red-500'}`}>
          {vsStartPercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
