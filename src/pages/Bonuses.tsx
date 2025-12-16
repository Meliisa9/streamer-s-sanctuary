import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ExternalLink, Search, Filter, Shield, Globe, Percent, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const filters = ["All", "Top Rated", "No Deposit", "Free Spins", "Crypto"];

const casinos = [
  {
    id: 1,
    name: "Stake Casino",
    logo: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=200&h=200&fit=crop",
    rating: 4.9,
    bonus: "200% up to $3,000",
    bonusType: "Welcome Bonus",
    wagering: "40x",
    minDeposit: "$20",
    freeSpins: 50,
    countries: ["US", "CA", "UK", "DE", "AU"],
    features: ["Crypto", "Sports", "Live Casino"],
    exclusive: true,
    promoCode: "STREAMERX",
  },
  {
    id: 2,
    name: "Roobet",
    logo: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=200&fit=crop",
    rating: 4.7,
    bonus: "Free $5 No Deposit",
    bonusType: "No Deposit",
    wagering: "No Wagering",
    minDeposit: "$10",
    freeSpins: 0,
    countries: ["US", "CA", "AU"],
    features: ["Crypto Only", "Instant Withdrawals"],
    exclusive: true,
    promoCode: "FREE5X",
  },
  {
    id: 3,
    name: "Duelbits",
    logo: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=200&h=200&fit=crop",
    rating: 4.8,
    bonus: "100% Bonus + 15% Rakeback",
    bonusType: "Welcome Bonus",
    wagering: "35x",
    minDeposit: "$10",
    freeSpins: 100,
    countries: ["US", "CA", "UK", "DE"],
    features: ["Crypto", "Rakeback", "VIP Program"],
    exclusive: false,
    promoCode: "STREAMX100",
  },
  {
    id: 4,
    name: "BC.Game",
    logo: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=200&h=200&fit=crop",
    rating: 4.6,
    bonus: "300% up to $20,000",
    bonusType: "Welcome Package",
    wagering: "40x",
    minDeposit: "$30",
    freeSpins: 200,
    countries: ["CA", "UK", "DE", "AU"],
    features: ["Multi-Crypto", "Sports", "NFT"],
    exclusive: false,
    promoCode: null,
  },
  {
    id: 5,
    name: "Gamdom",
    logo: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=200&h=200&fit=crop",
    rating: 4.5,
    bonus: "15% Instant Rakeback",
    bonusType: "Rakeback",
    wagering: "No Wagering",
    minDeposit: "$10",
    freeSpins: 0,
    countries: ["US", "CA", "UK"],
    features: ["Crypto", "Instant Rakeback", "Originals"],
    exclusive: true,
    promoCode: "STRX15",
  },
];

export default function Bonuses() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCasinos = casinos.filter((casino) => {
    const matchesSearch = casino.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
            Casino <span className="gradient-text-gold">Bonuses</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Exclusive deals and bonuses from our trusted partners
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search casinos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedFilter === filter
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* Casino Cards */}
        <div className="space-y-6">
          {filteredCasinos.map((casino, index) => (
            <motion.div
              key={casino.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="glass rounded-2xl overflow-hidden card-hover neon-border"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Casino Info */}
                  <div className="flex items-start gap-4 lg:w-1/4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={casino.logo}
                        alt={casino.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{casino.name}</h3>
                        {casino.exclusive && (
                          <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs font-bold rounded">
                            EXCLUSIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-semibold">{casino.rating}</span>
                        <span className="text-muted-foreground text-sm">/ 5</span>
                      </div>
                    </div>
                  </div>

                  {/* Bonus Details */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        Bonus
                      </p>
                      <p className="font-bold text-accent">{casino.bonus}</p>
                      <p className="text-xs text-muted-foreground">{casino.bonusType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        Wagering
                      </p>
                      <p className="font-semibold">{casino.wagering}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Min Deposit
                      </p>
                      <p className="font-semibold">{casino.minDeposit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Countries
                      </p>
                      <p className="font-semibold text-sm">{casino.countries.join(", ")}</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="lg:w-48 flex flex-col gap-2">
                    <Button variant="gold" className="w-full gap-2">
                      Claim Bonus
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    {casino.promoCode && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Promo Code</p>
                        <div className="px-3 py-1.5 bg-secondary border border-dashed border-primary/50 rounded-lg">
                          <code className="text-sm font-mono text-primary">{casino.promoCode}</code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                  {casino.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 bg-secondary text-xs font-medium rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  {casino.freeSpins > 0 && (
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                      {casino.freeSpins} Free Spins
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-6 glass rounded-2xl"
        >
          <h3 className="font-semibold mb-2">⚠️ Responsible Gambling</h3>
          <p className="text-sm text-muted-foreground">
            Gambling can be addictive. Please play responsibly and only gamble with money you can
            afford to lose. If you feel you may have a gambling problem, please seek help. 18+ only.
            Terms and conditions apply to all bonuses.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
