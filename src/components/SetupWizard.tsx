import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Globe, 
  Palette, 
  Bell, 
  Shield, 
  Users, 
  Zap,
  Settings,
  ImageIcon,
  Link2,
  Save,
  Rocket,
  X,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SetupWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const steps: WizardStep[] = [
  { id: "welcome", title: "Welcome", description: "Let's set up your platform", icon: Sparkles },
  { id: "branding", title: "Branding", description: "Customize your identity", icon: Palette },
  { id: "social", title: "Social Links", description: "Connect your platforms", icon: Link2 },
  { id: "features", title: "Features", description: "Choose what to enable", icon: Settings },
  { id: "security", title: "Security", description: "Set up admin access", icon: Shield },
  { id: "complete", title: "Complete", description: "You're all set!", icon: Rocket },
];

export default function SetupWizard({ open, onClose, onComplete }: SetupWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Branding
    site_name: "StreamerX",
    site_tagline: "Casino Streams",
    site_title: "StreamerX - Casino Streams",
    logo_url: "",
    favicon_url: "",
    primary_color: "#9b87f5",
    
    // Social
    twitch_url: "",
    twitch_follow_url: "",
    social_twitter: "",
    social_youtube: "",
    social_discord: "",
    social_instagram: "",
    stream_channel: "",
    
    // Features
    nav_videos_visible: true,
    nav_bonuses_visible: true,
    nav_news_visible: true,
    nav_giveaways_visible: true,
    nav_streamers_visible: true,
    nav_store_visible: true,
    nav_events_visible: true,
    nav_bonus_hunt_visible: true,
    nav_wins_visible: true,
    nav_leaderboard_visible: true,
    nav_polls_visible: true,
    
    // Security
    admin_access_code: "",
  });

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error("You must be logged in to complete setup");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save all settings to database
      const settingsToSave = [
        { key: "site_name", value: formData.site_name },
        { key: "site_tagline", value: formData.site_tagline },
        { key: "site_title", value: formData.site_title },
        { key: "logo_url", value: formData.logo_url },
        { key: "favicon_url", value: formData.favicon_url },
        { key: "twitch_url", value: formData.twitch_url },
        { key: "twitch_follow_url", value: formData.twitch_follow_url },
        { key: "social_twitter", value: formData.social_twitter },
        { key: "social_youtube", value: formData.social_youtube },
        { key: "social_discord", value: formData.social_discord },
        { key: "social_instagram", value: formData.social_instagram },
        { key: "stream_channel", value: formData.stream_channel },
        { key: "nav_videos_visible", value: formData.nav_videos_visible },
        { key: "nav_bonuses_visible", value: formData.nav_bonuses_visible },
        { key: "nav_news_visible", value: formData.nav_news_visible },
        { key: "nav_giveaways_visible", value: formData.nav_giveaways_visible },
        { key: "nav_streamers_visible", value: formData.nav_streamers_visible },
        { key: "nav_store_visible", value: formData.nav_store_visible },
        { key: "nav_events_visible", value: formData.nav_events_visible },
        { key: "nav_bonus_hunt_visible", value: formData.nav_bonus_hunt_visible },
        { key: "nav_wins_visible", value: formData.nav_wins_visible },
        { key: "nav_leaderboard_visible", value: formData.nav_leaderboard_visible },
        { key: "nav_polls_visible", value: formData.nav_polls_visible },
        { key: "setup_completed", value: true },
      ];

      // Upsert all settings
      for (const setting of settingsToSave) {
        await supabase
          .from("site_settings")
          .upsert({ key: setting.key, value: setting.value }, { onConflict: "key" });
      }

      // Save admin access code if provided (using edge function to hash it properly)
      if (formData.admin_access_code.length >= 6) {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        
        if (accessToken) {
          const { error: codeError } = await supabase.functions.invoke("admin-code", {
            body: { action: "set", code: formData.admin_access_code },
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          
          if (codeError) {
            console.error("Error setting admin access code:", codeError);
          }
        }
      }

      toast.success("Setup completed successfully!");
      onComplete();
    } catch (error) {
      console.error("Error saving setup:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case "welcome":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">Welcome to StreamerX</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's get your casino streaming platform set up in just a few minutes. 
                We'll walk you through the essential configuration.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              {[
                { icon: Palette, label: "Custom Branding" },
                { icon: Link2, label: "Social Integration" },
                { icon: Settings, label: "Feature Control" },
                { icon: Shield, label: "Secure Access" },
                { icon: Users, label: "User Management" },
                { icon: Zap, label: "Quick Setup" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-card/50 border border-border/50"
                >
                  <feature.icon className="w-6 h-6 text-primary mb-2 mx-auto" />
                  <p className="text-sm font-medium">{feature.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "branding":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Customize Your Brand</h2>
              <p className="text-muted-foreground">Set up your platform's identity</p>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={formData.site_name}
                  onChange={(e) => updateFormData("site_name", e.target.value)}
                  placeholder="Your platform name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_tagline">Tagline</Label>
                <Input
                  id="site_tagline"
                  value={formData.site_tagline}
                  onChange={(e) => updateFormData("site_tagline", e.target.value)}
                  placeholder="A short description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_title">Browser Tab Title</Label>
                <Input
                  id="site_title"
                  value={formData.site_title}
                  onChange={(e) => updateFormData("site_title", e.target.value)}
                  placeholder="Title shown in browser tab"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => updateFormData("logo_url", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon_url">Favicon URL</Label>
                  <Input
                    id="favicon_url"
                    value={formData.favicon_url}
                    onChange={(e) => updateFormData("favicon_url", e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-3">Preview</p>
                <div className="flex items-center gap-3">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{formData.site_name || "Your Site Name"}</h3>
                    <p className="text-sm text-muted-foreground">{formData.site_tagline || "Your tagline"}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "social":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Connect Your Platforms</h2>
              <p className="text-muted-foreground">Add your streaming and social media links</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="stream_channel">Stream Channel Username</Label>
                <Input
                  id="stream_channel"
                  value={formData.stream_channel}
                  onChange={(e) => updateFormData("stream_channel", e.target.value)}
                  placeholder="your_channel_name"
                />
                <p className="text-xs text-muted-foreground">Used for Twitch/Kick embed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitch_url">Twitch Channel URL</Label>
                <Input
                  id="twitch_url"
                  value={formData.twitch_url}
                  onChange={(e) => updateFormData("twitch_url", e.target.value)}
                  placeholder="https://twitch.tv/your_channel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitch_follow_url">Twitch Follow URL</Label>
                <Input
                  id="twitch_follow_url"
                  value={formData.twitch_follow_url}
                  onChange={(e) => updateFormData("twitch_follow_url", e.target.value)}
                  placeholder="https://twitch.tv/your_channel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_twitter">Twitter/X</Label>
                  <Input
                    id="social_twitter"
                    value={formData.social_twitter}
                    onChange={(e) => updateFormData("social_twitter", e.target.value)}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_youtube">YouTube</Label>
                  <Input
                    id="social_youtube"
                    value={formData.social_youtube}
                    onChange={(e) => updateFormData("social_youtube", e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_discord">Discord</Label>
                  <Input
                    id="social_discord"
                    value={formData.social_discord}
                    onChange={(e) => updateFormData("social_discord", e.target.value)}
                    placeholder="https://discord.gg/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_instagram">Instagram</Label>
                  <Input
                    id="social_instagram"
                    value={formData.social_instagram}
                    onChange={(e) => updateFormData("social_instagram", e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "features":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Enable Features</h2>
              <p className="text-muted-foreground">Choose which sections to show on your site</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "nav_videos_visible", label: "Videos", desc: "Video gallery" },
                { key: "nav_bonuses_visible", label: "Bonuses", desc: "Casino bonuses" },
                { key: "nav_news_visible", label: "News", desc: "Blog & updates" },
                { key: "nav_giveaways_visible", label: "Giveaways", desc: "Prize giveaways" },
                { key: "nav_streamers_visible", label: "Streamers", desc: "Team members" },
                { key: "nav_store_visible", label: "Store", desc: "Points shop" },
                { key: "nav_events_visible", label: "Events", desc: "Scheduled events" },
                { key: "nav_bonus_hunt_visible", label: "Bonus Hunt", desc: "Hunt tracker" },
                { key: "nav_wins_visible", label: "Win Gallery", desc: "Big wins" },
                { key: "nav_leaderboard_visible", label: "Leaderboard", desc: "User rankings" },
                { key: "nav_polls_visible", label: "Polls", desc: "Community voting" },
              ].map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50"
                >
                  <div>
                    <p className="font-medium">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                  <Switch
                    checked={formData[feature.key as keyof typeof formData] as boolean}
                    onCheckedChange={(checked) => updateFormData(feature.key, checked)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "security":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Secure Your Admin Panel</h2>
              <p className="text-muted-foreground">Set up an access code for extra security</p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">Admin Access Code</p>
                    <p className="text-sm text-muted-foreground">
                      This code will be required to access the admin panel, providing an extra layer of security.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_access_code">Access Code (min. 6 characters)</Label>
                <div className="relative">
                  <Input
                    id="admin_access_code"
                    type={showAccessCode ? "text" : "password"}
                    value={formData.admin_access_code}
                    onChange={(e) => updateFormData("admin_access_code", e.target.value)}
                    placeholder="Enter a secure access code"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.admin_access_code && formData.admin_access_code.length < 6 && (
                  <p className="text-xs text-destructive">Code must be at least 6 characters</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                <h4 className="font-medium mb-2">Security Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use a unique code you haven't used elsewhere</li>
                  <li>• Mix letters, numbers, and symbols</li>
                  <li>• Store your code in a safe place</li>
                  <li>• You can change this later in Admin Settings</li>
                </ul>
              </div>
            </div>
          </motion.div>
        );

      case "complete":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"
            >
              <Check className="w-12 h-12 text-green-500" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold mb-3">You're All Set!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your platform is ready to go. You can always adjust these settings later in the admin panel.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card/50 border border-border/50 max-w-md mx-auto text-left">
              <h4 className="font-semibold mb-4">Quick Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Site Name</span>
                  <span className="font-medium">{formData.site_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Features Enabled</span>
                  <span className="font-medium">
                    {Object.entries(formData).filter(([k, v]) => k.startsWith("nav_") && v).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin Code Set</span>
                  <span className="font-medium">
                    {formData.admin_access_code.length >= 6 ? (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-500">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">Skip</Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl">
        {/* Progress Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <span className="text-sm font-medium">{steps[currentStep].title}</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <Progress value={progress} className="h-1" />
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, i) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    i < currentStep
                      ? "bg-primary text-primary-foreground"
                      : i === currentStep
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-[10px] mt-1 text-muted-foreground hidden md:block">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px] max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-between">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={handleComplete} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Save className="w-4 h-4" />
                  </motion.div>
                  Saving...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Launch Platform
                </>
              )}
            </Button>
          ) : (
            <Button onClick={goNext} className="gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
