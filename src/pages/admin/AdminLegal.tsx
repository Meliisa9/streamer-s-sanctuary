import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, FileText, Shield, Cookie, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RichTextEditor } from "@/components/RichTextEditor";

interface LegalSettings {
  legal_privacy_policy: string;
  legal_terms_of_service: string;
  legal_cookie_policy: string;
  legal_responsible_gambling: string;
}

const defaultSettings: LegalSettings = {
  legal_privacy_policy: "",
  legal_terms_of_service: "",
  legal_cookie_policy: "",
  legal_responsible_gambling: "",
};

const legalPages = [
  { key: "legal_privacy_policy", label: "Privacy Policy", icon: Shield },
  { key: "legal_terms_of_service", label: "Terms of Service", icon: FileText },
  { key: "legal_cookie_policy", label: "Cookie Policy", icon: Cookie },
  { key: "legal_responsible_gambling", label: "Responsible Gambling", icon: AlertTriangle },
];

// Premium pre-made legal content for casino streaming sites
const premadeLegalContent: LegalSettings = {
  legal_privacy_policy: `<h2>Privacy Policy</h2>
<p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>

<h3>1. Introduction</h3>
<p>Welcome to our casino streaming community platform. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>

<h3>2. Information We Collect</h3>
<h4>Personal Information</h4>
<ul>
  <li><strong>Account Data:</strong> Username, email address, and profile information you provide during registration</li>
  <li><strong>Social Media Data:</strong> Information from connected platforms like Twitch, Kick, or Discord</li>
  <li><strong>Communication Data:</strong> Comments, messages, and content you post on our platform</li>
</ul>

<h4>Automatically Collected Information</h4>
<ul>
  <li>Device information (browser type, operating system)</li>
  <li>IP address and general location data</li>
  <li>Usage data (pages visited, time spent, interactions)</li>
  <li>Cookies and similar tracking technologies</li>
</ul>

<h3>3. How We Use Your Information</h3>
<p>We use the information we collect to:</p>
<ul>
  <li>Provide, maintain, and improve our services</li>
  <li>Process giveaway entries and distribute prizes</li>
  <li>Send notifications about events, streams, and promotions</li>
  <li>Personalize your experience and content recommendations</li>
  <li>Maintain leaderboards and achievement systems</li>
  <li>Prevent fraud and ensure platform security</li>
  <li>Comply with legal obligations</li>
</ul>

<h3>4. Information Sharing</h3>
<p>We do not sell your personal information. We may share information with:</p>
<ul>
  <li><strong>Service Providers:</strong> Third parties that help us operate our platform</li>
  <li><strong>Streaming Partners:</strong> When participating in giveaways or promotions</li>
  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
</ul>

<h3>5. Data Retention</h3>
<p>We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us.</p>

<h3>6. Your Rights</h3>
<p>Depending on your location, you may have rights to:</p>
<ul>
  <li>Access your personal data</li>
  <li>Correct inaccurate data</li>
  <li>Request deletion of your data</li>
  <li>Object to data processing</li>
  <li>Data portability</li>
</ul>

<h3>7. Security</h3>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h3>8. Contact Us</h3>
<p>If you have questions about this Privacy Policy, please contact us through our platform.</p>`,

  legal_terms_of_service: `<h2>Terms of Service</h2>
<p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>

<h3>1. Acceptance of Terms</h3>
<p>By accessing and using this casino streaming community platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>

<h3>2. Eligibility</h3>
<ul>
  <li>You must be at least 18 years old (or the legal age in your jurisdiction) to use this platform</li>
  <li>You must be legally permitted to view gambling-related content in your jurisdiction</li>
  <li>You are responsible for ensuring compliance with local laws regarding gambling content</li>
</ul>

<h3>3. Account Responsibilities</h3>
<p>When creating an account, you agree to:</p>
<ul>
  <li>Provide accurate and complete information</li>
  <li>Maintain the security of your account credentials</li>
  <li>Immediately notify us of any unauthorized access</li>
  <li>Accept responsibility for all activities under your account</li>
</ul>

<h3>4. Community Guidelines</h3>
<p>Users must not:</p>
<ul>
  <li>Post offensive, harassing, or discriminatory content</li>
  <li>Spam, advertise, or promote external services without permission</li>
  <li>Attempt to manipulate giveaways or voting systems</li>
  <li>Impersonate other users or staff members</li>
  <li>Share illegal content or engage in illegal activities</li>
  <li>Use automated tools or bots without authorization</li>
</ul>

<h3>5. Giveaways and Promotions</h3>
<ul>
  <li>Giveaways are subject to specific rules stated at the time of entry</li>
  <li>Winners are selected fairly using random or specified selection methods</li>
  <li>We reserve the right to disqualify entries that violate rules</li>
  <li>Prizes may be subject to tax obligations in your jurisdiction</li>
  <li>We are not responsible for prize delivery issues beyond our control</li>
</ul>

<h3>6. Intellectual Property</h3>
<p>All content on this platform, including logos, graphics, and text, is protected by intellectual property laws. Users retain ownership of content they create but grant us a license to display it on our platform.</p>

<h3>7. Disclaimers</h3>
<ul>
  <li><strong>Entertainment Only:</strong> This platform showcases gambling entertainment. We do not operate a casino or accept bets</li>
  <li><strong>No Gambling Advice:</strong> Content is for entertainment; we do not provide gambling advice</li>
  <li><strong>Affiliate Links:</strong> We may earn commissions from casino affiliate links</li>
  <li><strong>Service Availability:</strong> We do not guarantee uninterrupted service access</li>
</ul>

<h3>8. Limitation of Liability</h3>
<p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.</p>

<h3>9. Termination</h3>
<p>We reserve the right to suspend or terminate accounts that violate these terms, without prior notice. Users may also delete their accounts at any time.</p>

<h3>10. Changes to Terms</h3>
<p>We may modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>

<h3>11. Governing Law</h3>
<p>These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.</p>`,

  legal_cookie_policy: `<h2>Cookie Policy</h2>
<p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>

<h3>1. What Are Cookies?</h3>
<p>Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and how you use our site.</p>

<h3>2. Types of Cookies We Use</h3>

<h4>Essential Cookies</h4>
<p>These cookies are necessary for the website to function properly:</p>
<ul>
  <li>Authentication and login sessions</li>
  <li>Security and fraud prevention</li>
  <li>User preferences and settings</li>
</ul>

<h4>Analytics Cookies</h4>
<p>We use analytics to understand how visitors interact with our site:</p>
<ul>
  <li>Page views and navigation patterns</li>
  <li>Popular content and features</li>
  <li>Error reporting and performance monitoring</li>
</ul>

<h4>Functional Cookies</h4>
<p>These enhance your experience:</p>
<ul>
  <li>Remembering your display preferences (theme, layout)</li>
  <li>Storing your notification settings</li>
  <li>Keeping you signed in between visits</li>
</ul>

<h4>Third-Party Cookies</h4>
<p>Some cookies are set by third-party services we use:</p>
<ul>
  <li>Embedded stream players (Twitch, Kick)</li>
  <li>Social media integrations</li>
  <li>Analytics providers</li>
</ul>

<h3>3. Managing Cookies</h3>
<p>You can control cookies through your browser settings:</p>
<ul>
  <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
  <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
  <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
  <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
</ul>

<h3>4. Impact of Disabling Cookies</h3>
<p>Disabling cookies may affect functionality:</p>
<ul>
  <li>You may need to log in more frequently</li>
  <li>Some personalization features may not work</li>
  <li>Embedded content may not display properly</li>
</ul>

<h3>5. Updates to This Policy</h3>
<p>We may update this Cookie Policy periodically. We will notify you of significant changes through our website.</p>

<h3>6. Contact Us</h3>
<p>If you have questions about our use of cookies, please contact us through our platform.</p>`,

  legal_responsible_gambling: `<h2>Responsible Gambling</h2>
<p><em>Your wellbeing is our priority</em></p>

<h3>Important Notice</h3>
<div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0;">
  <p style="color: #fca5a5; margin: 0;"><strong>This platform is for entertainment purposes only.</strong> We showcase gambling content but do not operate a casino or accept bets. If you choose to gamble, please do so responsibly.</p>
</div>

<h3>Understanding Gambling Risks</h3>
<p>Gambling should always be viewed as entertainment, not a way to make money. Important facts to remember:</p>
<ul>
  <li>The house always has an edge – losses are expected over time</li>
  <li>Past results do not predict future outcomes</li>
  <li>Big wins shown on streams are rare exceptions, not the norm</li>
  <li>Never gamble money you cannot afford to lose</li>
  <li>Gambling does not solve financial problems</li>
</ul>

<h3>Signs of Problem Gambling</h3>
<p>Seek help if you experience any of these warning signs:</p>
<ul>
  <li>Spending more money or time gambling than intended</li>
  <li>Chasing losses by betting more to recover money</li>
  <li>Neglecting responsibilities (work, family, health)</li>
  <li>Borrowing money or selling possessions to gamble</li>
  <li>Feeling anxious, irritable, or depressed about gambling</li>
  <li>Lying to others about gambling habits</li>
  <li>Failed attempts to cut back or stop gambling</li>
</ul>

<h3>Tools for Responsible Gambling</h3>
<p>If you choose to gamble, use these protective measures:</p>
<ul>
  <li><strong>Set Limits:</strong> Decide on time and money limits before you start</li>
  <li><strong>Self-Exclusion:</strong> Use casino self-exclusion tools if needed</li>
  <li><strong>Reality Checks:</strong> Enable reminders about session length</li>
  <li><strong>Deposit Limits:</strong> Set daily, weekly, or monthly deposit caps</li>
  <li><strong>Cool-Off Periods:</strong> Take breaks from gambling activities</li>
</ul>

<h3>Getting Help</h3>
<p>If you or someone you know needs support, contact these resources:</p>

<div style="display: grid; gap: 12px; margin: 20px 0;">
  <div style="background: rgba(59, 130, 246, 0.1); padding: 16px; border-radius: 12px;">
    <p style="margin: 0;"><strong>🌍 Gamblers Anonymous:</strong> <a href="https://www.gamblersanonymous.org" target="_blank" style="color: #60a5fa;">www.gamblersanonymous.org</a></p>
  </div>
  <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 12px;">
    <p style="margin: 0;"><strong>🇺🇸 National Council on Problem Gambling (US):</strong> 1-800-522-4700</p>
  </div>
  <div style="background: rgba(139, 92, 246, 0.1); padding: 16px; border-radius: 12px;">
    <p style="margin: 0;"><strong>🇬🇧 GamCare (UK):</strong> 0808 8020 133 | <a href="https://www.gamcare.org.uk" target="_blank" style="color: #a78bfa;">www.gamcare.org.uk</a></p>
  </div>
  <div style="background: rgba(236, 72, 153, 0.1); padding: 16px; border-radius: 12px;">
    <p style="margin: 0;"><strong>🇪🇺 European Gaming & Betting Association:</strong> <a href="https://www.egba.eu" target="_blank" style="color: #f472b6;">www.egba.eu</a></p>
  </div>
</div>

<h3>Our Commitment</h3>
<p>We are committed to promoting responsible gambling awareness:</p>
<ul>
  <li>We clearly label affiliate partnerships with casinos</li>
  <li>We do not target advertising to minors</li>
  <li>We encourage viewers to set limits before gambling</li>
  <li>We remind viewers that gambling should be entertainment</li>
  <li>We support self-exclusion and cooling-off periods</li>
</ul>

<h3>Age Verification</h3>
<p style="background: rgba(250, 204, 21, 0.1); padding: 16px; border-radius: 12px; border-left: 4px solid #facc15;">
  <strong>⚠️ You must be 18+ (or the legal age in your jurisdiction) to gamble.</strong> Underage gambling is illegal. Casinos employ verification measures to prevent underage gambling.
</p>

<p style="margin-top: 24px; color: #94a3b8; font-style: italic;">Remember: Gambling should be fun. If it stops being fun, stop gambling.</p>`
};

export default function AdminLegal() {
  const [settings, setSettings] = useState<LegalSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("legal_privacy_policy");
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", Object.keys(defaultSettings));
      if (error) throw error;

      const loadedSettings: LegalSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof LegalSettings;
        if (key in loadedSettings) {
          loadedSettings[key] = (row.value as string) || "";
        }
      });
      setSettings(loadedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!isAdmin) {
      toast({ title: "Only admins can change settings", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      toast({ title: "Legal pages saved" });
    } catch (error: any) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const loadPremadeContent = () => {
    setSettings(premadeLegalContent);
    toast({ title: "Premium legal content loaded", description: "Don't forget to save your changes!" });
  };

  const allEmpty = Object.values(settings).every((v) => !v || v.trim() === "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Legal Pages</h1>
          <p className="text-muted-foreground">Edit your legal documents (HTML supported)</p>
        </div>
        <div className="flex items-center gap-2">
          {allEmpty && (
            <Button variant="outline" onClick={loadPremadeContent} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Load Premium Content
            </Button>
          )}
          <Button variant="glow" onClick={saveSettings} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            {legalPages.map((page) => (
              <TabsTrigger key={page.key} value={page.key} className="gap-2">
                <page.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{page.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {legalPages.map((page) => (
            <TabsContent key={page.key} value={page.key}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <page.icon className="w-5 h-5 text-primary" />
                  {page.label}
                </div>
                <p className="text-sm text-muted-foreground">
                  Use the rich text editor below to format your content. Click on the toolbar buttons to apply formatting.
                </p>
                <RichTextEditor
                  content={settings[page.key as keyof LegalSettings]}
                  onChange={(html) => setSettings({ ...settings, [page.key]: html })}
                  placeholder={`Start writing your ${page.label} content...`}
                  minHeight="400px"
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
}
