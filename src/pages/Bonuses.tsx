import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ExternalLink, Search, Filter, Shield, Globe, Percent, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Casino {
  id: string;
  name: string;
  logo_url: string | null;
  rating: number | null;
  bonus_text: string;
  bonus_type: string | null;
  wagering: string | null;
  min_deposit: string | null;
  free_spins: number | null;
  countries: string[] | null;
  features: string[] | null;
  is_exclusive: boolean | null;
  promo_code: string | null;
  affiliate_url: string | null;
}

const filters = ["All", "Top Rated", "No Deposit", "Free Spins", "Crypto"];

export default function Bonuses() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCasinos();
  }, []);

  const fetchCasinos = async () => {
    try {
      const { data, error } = await supabase
        .from("casino_bonuses")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");

      if (error) throw error;
      setCasinos(data || []);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
      toast.error("Failed to load bonuses");
    } finally {
      setLoading(false);
    }
  };

  const filteredCasinos = casinos.filter((casino) => {
    const matchesSearch = casino.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "All") return matchesSearch;
    if (selectedFilter === "Top Rated") return matchesSearch && (casino.rating || 0) >= 4.5;
    if (selectedFilter === "No Deposit") return matchesSearch && casino.bonus_type?.toLowerCase().includes("no deposit");
    if (selectedFilter === "Free Spins") return matchesSearch && (casino.free_spins || 0) > 0;
    if (selectedFilter === "Crypto") return matchesSearch && casino.features?.some(f => f.toLowerCase().includes("crypto"));
    
    return matchesSearch;
  });

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Promo code copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          {filteredCasinos.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {searchQuery ? "No casinos found matching your search" : "No bonuses available yet"}
            </div>
          ) : (
            filteredCasinos.map((casino, index) => (
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
                        {casino.logo_url ? (
                          <img
                            src={casino.logo_url}
                            alt={casino.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary">
                            <Gift className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{casino.name}</h3>
                          {casino.is_exclusive && (
                            <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs font-bold rounded">
                              EXCLUSIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          <span className="font-semibold">{casino.rating || 4.0}</span>
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
                        <p className="font-bold text-accent">{casino.bonus_text}</p>
                        <p className="text-xs text-muted-foreground">{casino.bonus_type || "Welcome Bonus"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Wagering
                        </p>
                        <p className="font-semibold">{casino.wagering || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Min Deposit
                        </p>
                        <p className="font-semibold">{casino.min_deposit || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          Countries
                        </p>
                        <p className="font-semibold text-sm">
                          {casino.countries?.join(", ") || "Worldwide"}
                        </p>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="lg:w-48 flex flex-col gap-2">
                      <Button variant="gold" className="w-full gap-2" asChild>
                        <a href={casino.affiliate_url || "#"} target="_blank" rel="noopener noreferrer">
                          Claim Bonus
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      {casino.promo_code && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Promo Code</p>
                          <button
                            onClick={() => copyPromoCode(casino.promo_code!)}
                            className="w-full px-3 py-1.5 bg-secondary border border-dashed border-primary/50 rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <code className="text-sm font-mono text-primary">{casino.promo_code}</code>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                    {casino.features?.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 bg-secondary text-xs font-medium rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                    {(casino.free_spins || 0) > 0 && (
                      <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                        {casino.free_spins} Free Spins
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
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
