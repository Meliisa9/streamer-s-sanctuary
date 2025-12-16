import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Trophy, Users, Clock, Lock, CheckCircle2, ArrowRight, History, Medal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const currentSession = {
  id: 1,
  title: "Sunday Bonus Hunt",
  status: "active", // "upcoming", "active", "locked", "ended"
  startTime: "2024-12-22T20:00:00",
  lockTime: "2024-12-22T20:30:00",
  revealTime: "2024-12-22T23:00:00",
  totalEntries: 1234,
  userGuess: null,
  pot: "$15,000",
};

const leaderboard = [
  { rank: 1, username: "SlotMaster99", points: 15000, wins: 12, avatar: "🏆" },
  { rank: 2, username: "LuckySpinner", points: 12500, wins: 10, avatar: "🥈" },
  { rank: 3, username: "BonusKing", points: 11000, wins: 9, avatar: "🥉" },
  { rank: 4, username: "CasinoQueen", points: 9500, wins: 8, avatar: "👑" },
  { rank: 5, username: "BigWinPro", points: 8000, wins: 7, avatar: "⭐" },
  { rank: 6, username: "StreamFan123", points: 7500, wins: 6, avatar: "🎰" },
  { rank: 7, username: "SlotEnjoyer", points: 6800, wins: 5, avatar: "🎲" },
  { rank: 8, username: "WinChaser", points: 6200, wins: 5, avatar: "💎" },
];

const pastSessions = [
  { id: 1, date: "Dec 15, 2024", actualTotal: "$23,456", winner: "SlotMaster99", guess: "$23,100" },
  { id: 2, date: "Dec 8, 2024", actualTotal: "$18,234", winner: "LuckySpinner", guess: "$18,500" },
  { id: 3, date: "Dec 1, 2024", actualTotal: "$31,789", winner: "BonusKing", guess: "$31,200" },
];

export default function GuessTheWin() {
  const [guessAmount, setGuessAmount] = useState("");
  const isLocked = currentSession.status === "locked" || currentSession.status === "ended";

  const handleSubmitGuess = () => {
    // Handle guess submission
    console.log("Submitting guess:", guessAmount);
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Guess <span className="gradient-text">The Win</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Predict the total winnings and climb the leaderboard!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Session */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="glass rounded-2xl p-6 neon-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    currentSession.status === "active"
                      ? "bg-green-500/20 text-green-500"
                      : currentSession.status === "locked"
                      ? "bg-amber-500/20 text-amber-500"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {currentSession.status === "active" && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                    {currentSession.status === "active" ? "Accepting Guesses" : 
                     currentSession.status === "locked" ? "Locked - Results Soon" : "Ended"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {currentSession.totalEntries.toLocaleString()} entries
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2">{currentSession.title}</h2>
              <p className="text-muted-foreground mb-6">
                Guess the total winnings from today's bonus hunt session!
              </p>

              {/* Guess Input */}
              <div className="bg-secondary/50 rounded-xl p-6 mb-6">
                <label className="text-sm font-medium mb-2 block">
                  Your Guess (Total Winnings in $)
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={guessAmount}
                      onChange={(e) => setGuessAmount(e.target.value)}
                      disabled={isLocked}
                      placeholder="Enter your guess..."
                      className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <Button
                    variant="gold"
                    size="lg"
                    disabled={isLocked || !guessAmount}
                    onClick={handleSubmitGuess}
                    className="gap-2"
                  >
                    {isLocked ? (
                      <>
                        <Lock className="w-4 h-4" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
                {currentSession.userGuess && (
                  <p className="mt-3 text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Your guess: ${currentSession.userGuess.toLocaleString()}
                  </p>
                )}
              </div>

              {/* How It Works */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">1. Make Your Guess</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your prediction for the total winnings
                  </p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1">2. Guesses Lock</h3>
                  <p className="text-sm text-muted-foreground">
                    Guesses are locked 30 minutes into the stream
                  </p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                    <Trophy className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold mb-1">3. Win Points</h3>
                  <p className="text-sm text-muted-foreground">
                    Closest guess wins! Earn points for accuracy
                  </p>
                </div>
              </div>
            </div>

            {/* Past Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                Recent Results
              </h2>
              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Winner</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Winning Guess</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastSessions.map((session) => (
                      <tr key={session.id} className="border-b border-border/50 last:border-0">
                        <td className="p-4 text-sm">{session.date}</td>
                        <td className="p-4 text-sm font-semibold text-accent">{session.actualTotal}</td>
                        <td className="p-4 text-sm">{session.winner}</td>
                        <td className="p-4 text-sm text-primary">{session.guess}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Medal className="w-5 h-5 text-accent" />
                Leaderboard
              </h2>

              <div className="space-y-3">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.rank}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      player.rank <= 3
                        ? "bg-accent/10 border border-accent/20"
                        : "bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                      player.rank === 1
                        ? "bg-yellow-500/20"
                        : player.rank === 2
                        ? "bg-gray-400/20"
                        : player.rank === 3
                        ? "bg-amber-600/20"
                        : "bg-secondary"
                    }`}>
                      {player.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.wins} wins
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{player.points.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button variant="outline" className="w-full gap-2">
                  View Full Leaderboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Your Stats */}
            <div className="glass rounded-2xl p-6 mt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                Your Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-primary">--</p>
                  <p className="text-xs text-muted-foreground">Your Rank</p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-xl">
                  <p className="text-2xl font-bold text-accent">0</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Login to track your progress!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
