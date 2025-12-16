import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, Target, Gift, Star, Crown, ArrowUp, ArrowDown, Minus } from "lucide-react";

const leaderboardData = [
  { rank: 1, prevRank: 1, username: "SlotMaster99", points: 45000, wins: 38, giveawaysWon: 5, gtwWins: 12, avatar: "🏆", streak: 5 },
  { rank: 2, prevRank: 3, username: "LuckySpinner", points: 42500, wins: 35, giveawaysWon: 4, gtwWins: 10, avatar: "🥈", streak: 3 },
  { rank: 3, prevRank: 2, username: "BonusKing", points: 41000, wins: 32, giveawaysWon: 6, gtwWins: 9, avatar: "🥉", streak: 2 },
  { rank: 4, prevRank: 4, username: "CasinoQueen", points: 38500, wins: 30, giveawaysWon: 3, gtwWins: 8, avatar: "👑", streak: 0 },
  { rank: 5, prevRank: 7, username: "BigWinPro", points: 35000, wins: 27, giveawaysWon: 4, gtwWins: 7, avatar: "⭐", streak: 4 },
  { rank: 6, prevRank: 5, username: "StreamFan123", points: 32500, wins: 25, giveawaysWon: 2, gtwWins: 6, avatar: "🎰", streak: 1 },
  { rank: 7, prevRank: 6, username: "SlotEnjoyer", points: 30800, wins: 23, giveawaysWon: 3, gtwWins: 5, avatar: "🎲", streak: 0 },
  { rank: 8, prevRank: 8, username: "WinChaser", points: 28200, wins: 21, giveawaysWon: 2, gtwWins: 5, avatar: "💎", streak: 2 },
  { rank: 9, prevRank: 10, username: "ProGambler", points: 25600, wins: 19, giveawaysWon: 1, gtwWins: 4, avatar: "🃏", streak: 1 },
  { rank: 10, prevRank: 9, username: "BonusHunter", points: 24100, wins: 18, giveawaysWon: 2, gtwWins: 4, avatar: "🎯", streak: 0 },
];

const getRankChange = (current: number, prev: number) => {
  if (current < prev) return { icon: ArrowUp, color: "text-green-500", change: prev - current };
  if (current > prev) return { icon: ArrowDown, color: "text-red-500", change: current - prev };
  return { icon: Minus, color: "text-muted-foreground", change: 0 };
};

export default function Leaderboard() {
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
            <span className="gradient-text-gold">Leaderboard</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Top community members ranked by points and achievements
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto"
        >
          {/* 2nd Place */}
          <div className="order-1 flex flex-col items-center pt-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-4xl mb-4 shadow-xl">
              {leaderboardData[1].avatar}
            </div>
            <h3 className="font-bold text-center">{leaderboardData[1].username}</h3>
            <p className="text-2xl font-bold text-gray-400 mb-1">2nd</p>
            <p className="text-sm text-muted-foreground">{leaderboardData[1].points.toLocaleString()} pts</p>
            <div className="mt-4 w-full h-24 bg-gradient-to-t from-gray-500/30 to-transparent rounded-t-xl" />
          </div>

          {/* 1st Place */}
          <div className="order-2 flex flex-col items-center">
            <Crown className="w-8 h-8 text-yellow-500 mb-2 animate-pulse" />
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-5xl mb-4 shadow-xl glow-gold">
              {leaderboardData[0].avatar}
            </div>
            <h3 className="font-bold text-lg text-center">{leaderboardData[0].username}</h3>
            <p className="text-3xl font-bold gradient-text-gold mb-1">1st</p>
            <p className="text-sm text-muted-foreground">{leaderboardData[0].points.toLocaleString()} pts</p>
            <div className="mt-4 w-full h-32 bg-gradient-to-t from-yellow-500/30 to-transparent rounded-t-xl" />
          </div>

          {/* 3rd Place */}
          <div className="order-3 flex flex-col items-center pt-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-3xl mb-4 shadow-xl">
              {leaderboardData[2].avatar}
            </div>
            <h3 className="font-bold text-center text-sm">{leaderboardData[2].username}</h3>
            <p className="text-xl font-bold text-amber-600 mb-1">3rd</p>
            <p className="text-sm text-muted-foreground">{leaderboardData[2].points.toLocaleString()} pts</p>
            <div className="mt-4 w-full h-16 bg-gradient-to-t from-amber-600/30 to-transparent rounded-t-xl" />
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          <div className="glass rounded-2xl p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{leaderboardData.reduce((a, b) => a + b.wins, 0)}</p>
            <p className="text-sm text-muted-foreground">Total Wins</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{leaderboardData.reduce((a, b) => a + b.giveawaysWon, 0)}</p>
            <p className="text-sm text-muted-foreground">Giveaways Won</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{leaderboardData.reduce((a, b) => a + b.gtwWins, 0)}</p>
            <p className="text-sm text-muted-foreground">GTW Victories</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{leaderboardData.reduce((a, b) => a + b.points, 0).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </div>
        </motion.div>

        {/* Full Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Rank</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Player</th>
                  <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Points</th>
                  <th className="text-center p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Wins</th>
                  <th className="text-center p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Giveaways</th>
                  <th className="text-center p-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">GTW Wins</th>
                  <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((player, index) => {
                  const rankChange = getRankChange(player.rank, player.prevRank);
                  const RankIcon = rankChange.icon;

                  return (
                    <motion.tr
                      key={player.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className={`border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors ${
                        player.rank <= 3 ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            player.rank === 1
                              ? "text-yellow-500"
                              : player.rank === 2
                              ? "text-gray-400"
                              : player.rank === 3
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}>
                            #{player.rank}
                          </span>
                          <RankIcon className={`w-4 h-4 ${rankChange.color}`} />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{player.avatar}</span>
                          <span className="font-medium">{player.username}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-primary">{player.points.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-center hidden md:table-cell">
                        <span className="text-muted-foreground">{player.wins}</span>
                      </td>
                      <td className="p-4 text-center hidden md:table-cell">
                        <span className="text-muted-foreground">{player.giveawaysWon}</span>
                      </td>
                      <td className="p-4 text-center hidden lg:table-cell">
                        <span className="text-muted-foreground">{player.gtwWins}</span>
                      </td>
                      <td className="p-4 text-center">
                        {player.streak > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-500 text-xs font-medium rounded-full">
                            🔥 {player.streak}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* How Points Work */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 glass rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            How to Earn Points
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-secondary/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Guess The Win</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Earn up to 1,000 points per session. Closer guesses = more points!
              </p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-primary" />
                <span className="font-semibold">Giveaway Entries</span>
              </div>
              <p className="text-sm text-muted-foreground">
                100 points per giveaway entry. Winners get 5,000 bonus points!
              </p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-accent" />
                <span className="font-semibold">Activity Bonus</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Daily login: 50 pts. Watch streams: 10 pts/hour. Comments: 25 pts.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
