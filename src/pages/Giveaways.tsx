import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Users, Clock, Trophy, CheckCircle2, Lock, Sparkles, ArrowRight, Calendar, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const giveaways = [
  {
    id: 1,
    title: "December Mega Giveaway",
    prize: "$10,000",
    prizeType: "Cash",
    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&h=400&fit=crop",
    entries: 15234,
    maxEntries: null,
    endDate: "2024-12-31T23:59:59",
    status: "active",
    requirements: [
      "Follow on Twitch",
      "Join Discord Server",
      "Subscribe to Newsletter",
    ],
    winners: 10,
    exclusive: true,
  },
  {
    id: 2,
    title: "Weekly Cash Drop",
    prize: "$1,000",
    prizeType: "Cash",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop",
    entries: 3456,
    maxEntries: 5000,
    endDate: "2024-12-22T20:00:00",
    status: "active",
    requirements: [
      "Be logged in",
      "Watch 1 hour of stream",
    ],
    winners: 5,
    exclusive: false,
  },
  {
    id: 3,
    title: "VIP Stake Package",
    prize: "$5,000",
    prizeType: "Bonus",
    image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800&h=400&fit=crop",
    entries: 8901,
    maxEntries: 10000,
    endDate: "2024-12-25T18:00:00",
    status: "active",
    requirements: [
      "Link Stake Account",
      "Make $100 deposit",
      "Wager $500",
    ],
    winners: 1,
    exclusive: true,
  },
  {
    id: 4,
    title: "November Winner Announcement",
    prize: "$3,000",
    prizeType: "Cash",
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&h=400&fit=crop",
    entries: 12456,
    maxEntries: null,
    endDate: "2024-11-30T23:59:59",
    status: "ended",
    requirements: [],
    winners: 3,
    winnerNames: ["@LuckyPlayer123", "@CasinoKing88", "@BigWinSarah"],
    exclusive: false,
  },
];

function CountdownTimer({ endDate }: { endDate: string }) {
  const calculateTimeLeft = () => {
    const difference = new Date(endDate).getTime() - new Date().getTime();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useState(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  });

  return (
    <div className="flex gap-3">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-1">
            <span className="text-2xl font-bold text-accent">{value}</span>
          </div>
          <span className="text-xs text-muted-foreground capitalize">{unit}</span>
        </div>
      ))}
    </div>
  );
}

export default function Giveaways() {
  const activeGiveaways = giveaways.filter((g) => g.status === "active");
  const endedGiveaways = giveaways.filter((g) => g.status === "ended");

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
            <span className="gradient-text-gold">Giveaways</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Enter for a chance to win amazing prizes from our community
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <div className="glass rounded-2xl p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{activeGiveaways.length}</p>
            <p className="text-sm text-muted-foreground">Active Giveaways</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">$150K+</p>
            <p className="text-sm text-muted-foreground">Total Given Away</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">2,500+</p>
            <p className="text-sm text-muted-foreground">Total Winners</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Crown className="w-8 h-8 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">$50,000</p>
            <p className="text-sm text-muted-foreground">Biggest Prize</p>
          </div>
        </motion.div>

        {/* Active Giveaways */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            Active Giveaways
          </h2>

          <div className="space-y-6">
            {activeGiveaways.map((giveaway, index) => (
              <motion.div
                key={giveaway.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass rounded-2xl overflow-hidden neon-border"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="lg:w-80 h-48 lg:h-auto relative overflow-hidden">
                    <img
                      src={giveaway.image}
                      alt={giveaway.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card lg:bg-gradient-to-t" />
                    {giveaway.exclusive && (
                      <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full">
                        EXCLUSIVE
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{giveaway.title}</h3>
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-3xl font-bold gradient-text-gold">
                            {giveaway.prize}
                          </span>
                          <span className="px-3 py-1 bg-secondary text-sm rounded-full">
                            {giveaway.prizeType}
                          </span>
                        </div>

                        {/* Requirements */}
                        <div className="space-y-2 mb-4">
                          {giveaway.requirements.map((req, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-muted-foreground">{req}</span>
                            </div>
                          ))}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {giveaway.entries.toLocaleString()} entries
                            {giveaway.maxEntries && ` / ${giveaway.maxEntries.toLocaleString()}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {giveaway.winners} {giveaway.winners === 1 ? "winner" : "winners"}
                          </span>
                        </div>
                      </div>

                      {/* Countdown & CTA */}
                      <div className="flex flex-col items-center lg:items-end gap-4">
                        <div className="text-center lg:text-right">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 justify-center lg:justify-end">
                            <Clock className="w-3 h-3" />
                            Ends in
                          </p>
                          <CountdownTimer endDate={giveaway.endDate} />
                        </div>
                        <Button variant="gold" size="lg" className="w-full lg:w-auto gap-2">
                          Enter Giveaway
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Ended Giveaways */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6 text-muted-foreground" />
            Past Giveaways
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {endedGiveaways.map((giveaway, index) => (
              <motion.div
                key={giveaway.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass rounded-2xl overflow-hidden opacity-80"
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={giveaway.image}
                    alt={giveaway.title}
                    className="w-full h-full object-cover grayscale"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  <span className="absolute top-4 right-4 px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                    ENDED
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-2">{giveaway.title}</h3>
                  <p className="text-xl font-bold text-muted-foreground mb-3">{giveaway.prize}</p>
                  {giveaway.winnerNames && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-accent" />
                        Winners
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {giveaway.winnerNames.map((winner) => (
                          <span key={winner} className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
                            {winner}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
