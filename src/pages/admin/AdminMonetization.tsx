import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, CreditCard, Gift, Crown, Star, TrendingUp, 
  Users, Zap, Settings, Plus, Trash2, Save, Loader2,
  ArrowUpRight, Wallet, PiggyBank, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";


interface TipOption {
  id: string;
  amount: number;
  label: string;
  emoji: string;
}

interface PremiumTier {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  color: string;
  isPopular: boolean;
}

interface MonetizationConfig {
  tips_enabled: boolean;
  tips_min_amount: number;
  tips_max_amount: number;
  tips_quick_options: TipOption[];
  premium_enabled: boolean;
  premium_tiers: PremiumTier[];
  donations_enabled: boolean;
  donations_goal: number;
  donations_current: number;
  donations_message: string;
  exclusive_content_enabled: boolean;
  points_to_currency_rate: number;
}

const defaultConfig: MonetizationConfig = {
  tips_enabled: false,
  tips_min_amount: 1,
  tips_max_amount: 500,
  tips_quick_options: [
    { id: "1", amount: 5, label: "Coffee", emoji: "☕" },
    { id: "2", amount: 10, label: "Snack", emoji: "🍕" },
    { id: "3", amount: 25, label: "Meal", emoji: "🍔" },
    { id: "4", amount: 50, label: "Big Thanks", emoji: "🎉" },
  ],
  premium_enabled: false,
  premium_tiers: [
    {
      id: "basic",
      name: "Basic",
      price: 4.99,
      interval: "month",
      features: ["Ad-free experience", "Custom badge", "Priority support"],
      color: "from-blue-500 to-cyan-500",
      isPopular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: 9.99,
      interval: "month",
      features: ["All Basic features", "Exclusive content", "Early access", "Custom profile theme"],
      color: "from-purple-500 to-pink-500",
      isPopular: true,
    },
    {
      id: "elite",
      name: "Elite",
      price: 24.99,
      interval: "month",
      features: ["All Pro features", "Direct chat access", "Monthly merch", "VIP events"],
      color: "from-amber-500 to-orange-500",
      isPopular: false,
    },
  ],
  donations_enabled: false,
  donations_goal: 1000,
  donations_current: 0,
  donations_message: "Help us reach our goal!",
  exclusive_content_enabled: false,
  points_to_currency_rate: 100,
};

export default function AdminMonetization() {
  const [config, setConfig] = useState<MonetizationConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 12450,
    monthlyRevenue: 2340,
    totalTips: 456,
    premiumMembers: 89,
    conversionRate: 4.2,
  });
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .like("key", "monetization_%");

      if (error) throw error;

      const loadedConfig = { ...defaultConfig };
      data?.forEach((row) => {
        const key = row.key.replace("monetization_", "") as keyof MonetizationConfig;
        if (key in loadedConfig) {
          (loadedConfig as any)[key] = row.value ?? defaultConfig[key];
        }
      });

      setConfig(loadedConfig);
    } catch (error) {
      console.error("Error fetching monetization config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!isAdmin) {
      toast({ title: "Admin access required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(config)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key: `monetization_${key}`, value }, { onConflict: "key" });
        if (error) throw error;
      }
      toast({ title: "Monetization settings saved" });
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addTipOption = () => {
    setConfig({
      ...config,
      tips_quick_options: [
        ...config.tips_quick_options,
        { id: Date.now().toString(), amount: 10, label: "New Tip", emoji: "💝" },
      ],
    });
  };

  const removeTipOption = (id: string) => {
    setConfig({
      ...config,
      tips_quick_options: config.tips_quick_options.filter((opt) => opt.id !== id),
    });
  };

  const updateTipOption = (id: string, field: keyof TipOption, value: any) => {
    setConfig({
      ...config,
      tips_quick_options: config.tips_quick_options.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      ),
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Monetization</h2>
            <p className="text-muted-foreground">Configure tips, subscriptions, and premium features</p>
          </div>
        </div>
        <Button variant="glow" onClick={saveConfig} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-green-500", bgColor: "bg-green-500/10" },
          { label: "This Month", value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-blue-500", bgColor: "bg-blue-500/10", trend: "+18%" },
          { label: "Total Tips", value: stats.totalTips.toString(), icon: Gift, color: "text-purple-500", bgColor: "bg-purple-500/10" },
          { label: "Premium Members", value: stats.premiumMembers.toString(), icon: Crown, color: "text-amber-500", bgColor: "bg-amber-500/10" },
          { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: Zap, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass rounded-2xl p-4 border border-border/50"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              {stat.trend && (
                <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {stat.trend}
                </Badge>
              )}
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="tips" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tips" className="gap-2">
            <Gift className="w-4 h-4" />
            Tips
          </TabsTrigger>
          <TabsTrigger value="premium" className="gap-2">
            <Crown className="w-4 h-4" />
            Premium Tiers
          </TabsTrigger>
          <TabsTrigger value="donations" className="gap-2">
            <PiggyBank className="w-4 h-4" />
            Donations
          </TabsTrigger>
          <TabsTrigger value="exclusive" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Exclusive Content
          </TabsTrigger>
        </TabsList>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Gift className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Tip Settings</h3>
                  <p className="text-sm text-muted-foreground">Allow viewers to send tips</p>
                </div>
              </div>
              <Switch
                checked={config.tips_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, tips_enabled: checked })}
              />
            </div>

            {config.tips_enabled && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Amount ($)</Label>
                    <Input
                      type="number"
                      value={config.tips_min_amount}
                      onChange={(e) => setConfig({ ...config, tips_min_amount: Number(e.target.value) })}
                      min={1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Maximum Amount ($)</Label>
                    <Input
                      type="number"
                      value={config.tips_max_amount}
                      onChange={(e) => setConfig({ ...config, tips_max_amount: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Quick Tip Options</Label>
                    <Button variant="outline" size="sm" onClick={addTipOption} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {config.tips_quick_options.map((option, index) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border"
                      >
                        <Input
                          value={option.emoji}
                          onChange={(e) => updateTipOption(option.id, "emoji", e.target.value)}
                          className="w-16 text-center text-xl"
                        />
                        <Input
                          value={option.label}
                          onChange={(e) => updateTipOption(option.id, "label", e.target.value)}
                          placeholder="Label"
                          className="flex-1"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            type="number"
                            value={option.amount}
                            onChange={(e) => updateTipOption(option.id, "amount", Number(e.target.value))}
                            className="w-20"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTipOption(option.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-6 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-sm font-medium mb-4">Preview</p>
                  <div className="flex flex-wrap gap-3">
                    {config.tips_quick_options.map((option) => (
                      <button
                        key={option.id}
                        className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
                      >
                        <span className="text-xl block mb-1">{option.emoji}</span>
                        <span className="text-sm font-medium">${option.amount}</span>
                        <span className="text-xs text-muted-foreground block">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Premium Tiers Tab */}
        <TabsContent value="premium" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Premium Subscriptions</h3>
                  <p className="text-sm text-muted-foreground">Offer premium membership tiers</p>
                </div>
              </div>
              <Switch
                checked={config.premium_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, premium_enabled: checked })}
              />
            </div>

            {config.premium_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {config.premium_tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`relative p-6 rounded-2xl border ${
                      tier.isPopular ? "border-primary" : "border-border"
                    } bg-gradient-to-br ${tier.color} bg-opacity-10`}
                  >
                    {tier.isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        Most Popular
                      </Badge>
                    )}
                    <h4 className="text-xl font-bold mb-2">{tier.name}</h4>
                    <p className="text-3xl font-bold mb-1">
                      ${tier.price}
                      <span className="text-sm font-normal text-muted-foreground">/{tier.interval}</span>
                    </p>
                    <ul className="space-y-2 mt-4">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Donations Tab */}
        <TabsContent value="donations" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                  <PiggyBank className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Donation Goals</h3>
                  <p className="text-sm text-muted-foreground">Set up fundraising campaigns</p>
                </div>
              </div>
              <Switch
                checked={config.donations_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, donations_enabled: checked })}
              />
            </div>

            {config.donations_enabled && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Goal Amount ($)</Label>
                    <Input
                      type="number"
                      value={config.donations_goal}
                      onChange={(e) => setConfig({ ...config, donations_goal: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Current Amount ($)</Label>
                    <Input
                      type="number"
                      value={config.donations_current}
                      onChange={(e) => setConfig({ ...config, donations_current: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Campaign Message</Label>
                  <Textarea
                    value={config.donations_message}
                    onChange={(e) => setConfig({ ...config, donations_message: e.target.value })}
                    placeholder="Help us reach our goal!"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Progress Preview */}
                <div className="p-6 rounded-xl bg-secondary/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{config.donations_message}</span>
                    <span className="text-sm text-muted-foreground">
                      ${config.donations_current} / ${config.donations_goal}
                    </span>
                  </div>
                  <div className="h-4 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min((config.donations_current / config.donations_goal) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {Math.round((config.donations_current / config.donations_goal) * 100)}% funded
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Exclusive Content Tab */}
        <TabsContent value="exclusive" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Exclusive Content</h3>
                  <p className="text-sm text-muted-foreground">Gate content for premium members</p>
                </div>
              </div>
              <Switch
                checked={config.exclusive_content_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, exclusive_content_enabled: checked })}
              />
            </div>

            {config.exclusive_content_enabled && (
              <div className="space-y-6">
                <div>
                  <Label>Points to Currency Rate</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    How many points equal $1 in value
                  </p>
                  <Input
                    type="number"
                    value={config.points_to_currency_rate}
                    onChange={(e) => setConfig({ ...config, points_to_currency_rate: Number(e.target.value) })}
                    className="w-48"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Exclusive Videos", desc: "Premium-only video content", count: 12 },
                    { title: "Early Access", desc: "Get content before everyone else", count: 8 },
                    { title: "Behind the Scenes", desc: "Exclusive BTS content", count: 15 },
                    { title: "Premium Articles", desc: "In-depth exclusive articles", count: 6 },
                  ].map((item) => (
                    <div key={item.title} className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <Badge variant="secondary">{item.count} items</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
