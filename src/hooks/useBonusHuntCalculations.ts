import { supabase } from "@/integrations/supabase/client";

interface BonusHuntSlot {
  id: string;
  hunt_id: string;
  bet_amount: number | null;
  win_amount: number | null;
  multiplier: number | null;
  is_played: boolean;
}

interface CalculatedStats {
  ending_balance: number;
  average_bet: number;
  highest_win: number;
  highest_multiplier: number;
  average_x: number;
  break_even_x: number;
  total_bets: number;
  played_count: number;
  remaining_count: number;
}

/**
 * Calculate all bonus hunt statistics from slots
 * 
 * Formulas:
 * - Ending Balance: Sum of all win_amounts from played slots
 * - Average Bet: Sum of all bet_amounts / number of slots
 * - Average X: Sum of all multipliers / number of played slots with results
 * - Break-Even X: (Starting Balance - Current Wins) / (Remaining Slots Total Bets)
 * - Highest Win: Max win_amount from all slots
 * - Highest Multiplier: Max multiplier from all slots
 */
export function calculateBonusHuntStats(
  slots: BonusHuntSlot[],
  startingBalance: number | null
): CalculatedStats {
  if (!slots || slots.length === 0) {
    return {
      ending_balance: 0,
      average_bet: 0,
      highest_win: 0,
      highest_multiplier: 0,
      average_x: 0,
      break_even_x: 0,
      total_bets: 0,
      played_count: 0,
      remaining_count: 0,
    };
  }

  const totalSlots = slots.length;
  const playedSlots = slots.filter(s => s.is_played);
  const remainingSlots = slots.filter(s => !s.is_played);
  
  // Calculate total bets (sum of all bet amounts)
  const totalBets = slots.reduce((sum, slot) => sum + (slot.bet_amount || 0), 0);
  
  // Calculate average bet (total bets / number of slots)
  const averageBet = totalSlots > 0 ? totalBets / totalSlots : 0;
  
  // Calculate ending balance (sum of all wins from played slots)
  const endingBalance = playedSlots.reduce((sum, slot) => sum + (slot.win_amount || 0), 0);
  
  // Calculate highest win
  const highestWin = Math.max(...slots.map(s => s.win_amount || 0), 0);
  
  // Calculate highest multiplier
  const highestMultiplier = Math.max(...slots.map(s => s.multiplier || 0), 0);
  
  // Calculate average X (sum of multipliers / number of played slots with multipliers)
  const slotsWithMultipliers = playedSlots.filter(s => s.multiplier !== null && s.multiplier !== undefined);
  const totalMultiplier = slotsWithMultipliers.reduce((sum, slot) => sum + (slot.multiplier || 0), 0);
  const averageX = slotsWithMultipliers.length > 0 ? totalMultiplier / slotsWithMultipliers.length : 0;
  
  // Calculate Break-Even X
  // How much is needed on average for every remaining slot so end balance = starting balance
  // Formula: (Starting Balance - Current Wins) / (Remaining Slots Total Bets)
  let breakEvenX = 0;
  if (startingBalance && remainingSlots.length > 0) {
    const remainingTotalBets = remainingSlots.reduce((sum, slot) => sum + (slot.bet_amount || 0), 0);
    if (remainingTotalBets > 0) {
      const neededWins = startingBalance - endingBalance;
      breakEvenX = neededWins / remainingTotalBets;
    }
  } else if (startingBalance && totalBets > 0) {
    // If all slots are played, show what was needed
    breakEvenX = startingBalance / totalBets;
  }
  
  return {
    ending_balance: endingBalance,
    average_bet: averageBet,
    highest_win: highestWin,
    highest_multiplier: highestMultiplier,
    average_x: averageX,
    break_even_x: Math.max(0, breakEvenX),
    total_bets: totalBets,
    played_count: playedSlots.length,
    remaining_count: remainingSlots.length,
  };
}

/**
 * Calculate multiplier from bet and win amount
 * Multiplier = Win Amount / Bet Amount
 */
export function calculateMultiplier(betAmount: number | null, winAmount: number | null): number | null {
  if (!betAmount || betAmount === 0 || winAmount === null || winAmount === undefined) {
    return null;
  }
  return winAmount / betAmount;
}

/**
 * Update bonus hunt stats in the database based on current slots
 */
export async function updateBonusHuntStats(huntId: string): Promise<void> {
  // Fetch all slots for this hunt
  const { data: slots, error: slotsError } = await supabase
    .from("bonus_hunt_slots")
    .select("*")
    .eq("hunt_id", huntId);
  
  if (slotsError) {
    console.error("Error fetching slots for stats update:", slotsError);
    return;
  }

  // Fetch the hunt to get starting balance
  const { data: hunt, error: huntError } = await supabase
    .from("bonus_hunts")
    .select("starting_balance")
    .eq("id", huntId)
    .single();
  
  if (huntError) {
    console.error("Error fetching hunt for stats update:", huntError);
    return;
  }

  const stats = calculateBonusHuntStats(slots || [], hunt?.starting_balance);

  // Update the hunt with calculated stats
  const { error: updateError } = await supabase
    .from("bonus_hunts")
    .update({
      ending_balance: stats.ending_balance,
      average_bet: stats.average_bet,
      highest_win: stats.highest_win,
      highest_multiplier: stats.highest_multiplier,
    })
    .eq("id", huntId);

  if (updateError) {
    console.error("Error updating hunt stats:", updateError);
  }
}
