import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Shield, Lock, Eye, Database, UserCheck, Mail, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/sanitize";

const quickLinks = [
  { icon: Database, label: "Data Collection", id: "data-collection" },
  { icon: Eye, label: "How We Use Data", id: "data-usage" },
  { icon: Lock, label: "Security", id: "security" },
  { icon: UserCheck, label: "Your Rights", id: "your-rights" },
  { icon: Mail, label: "Contact", id: "contact" },
];

export default function PrivacyPolicy() {
  const location = useLocation();
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const { data: content, isLoading } = useQuery({
    queryKey: ["legal-privacy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "legal_privacy_policy")
        .maybeSingle();
      if (error) throw error;
      return data?.value as string | null;
    },
  });

  // Handle anchor scrolling after content loads
  useEffect(() => {
    if (!isLoading && location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const element = sectionRefs.current[id] || document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [isLoading, location.hash]);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    // Try refs first, then fall back to getElementById for content loaded via dangerouslySetInnerHTML
    const element = sectionRefs.current[id] || document.getElementById(id) || document.querySelector(`[id="${id}"]`) || document.querySelector(`h3:has(+ *), h2, h3`);
    
    // If still not found, try to find by text content in headings
    if (!element) {
      const headings = document.querySelectorAll('h2, h3');
      for (const heading of headings) {
        if (heading.textContent?.toLowerCase().includes(id.replace(/-/g, ' '))) {
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", `#${id}`);
          return;
        }
      }
    }
    
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 md:p-12"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              We value your privacy and are committed to protecting your personal information. Learn how we collect, use, and safeguard your data.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="relative mt-8 flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleAnchorClick(e, link.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer"
            >
              <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">{link.label}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-6 px-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-2/3 mt-8" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : content ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 md:p-12 prose prose-invert prose-lg max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-0 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-4
            prose-h3:text-2xl prose-h3:text-primary prose-h3:mt-10 prose-h3:mb-5
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg
            prose-ul:text-muted-foreground prose-ul:text-base md:prose-ul:text-lg
            prose-li:marker:text-primary prose-li:my-2
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            [&_h3]:scroll-mt-24"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 md:p-12 space-y-10"
        >
          <div>
            <h2 className="text-3xl font-bold mb-6 border-b border-border/50 pb-4">Privacy Policy</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.
            </p>
          </div>

          <div ref={(el) => (sectionRefs.current["data-collection"] = el)} id="data-collection" className="scroll-mt-24">
            <h3 className="text-2xl font-bold text-primary mb-5">Information We Collect</h3>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              We may collect information you provide directly to us, such as when you create an account, participate in giveaways, or contact us. This includes:
            </p>
            <ul className="text-muted-foreground text-lg space-y-2 list-disc list-inside">
              <li>Account information (username, email, avatar)</li>
              <li>Profile information you choose to provide</li>
              <li>Communications and interactions with our services</li>
              <li>Usage data and preferences</li>
            </ul>
          </div>

          <div ref={(el) => (sectionRefs.current["data-usage"] = el)} id="data-usage" className="scroll-mt-24">
            <h3 className="text-2xl font-bold text-primary mb-5">How We Use Your Information</h3>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="text-muted-foreground text-lg space-y-2 list-disc list-inside">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience</li>
              <li>Send you notifications about events, giveaways, and updates</li>
              <li>Protect against fraudulent or unauthorized activity</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div ref={(el) => (sectionRefs.current["security"] = el)} id="security" className="scroll-mt-24">
            <h3 className="text-2xl font-bold text-primary mb-5">Security</h3>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              We implement appropriate security measures to protect your personal information, including:
            </p>
            <ul className="text-muted-foreground text-lg space-y-2 list-disc list-inside">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure data storage practices</li>
            </ul>
          </div>

          <div ref={(el) => (sectionRefs.current["your-rights"] = el)} id="your-rights" className="scroll-mt-24">
            <h3 className="text-2xl font-bold text-primary mb-5">Your Rights</h3>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">You have the right to:</p>
            <ul className="text-muted-foreground text-lg space-y-2 list-disc list-inside">
              <li>Access your personal data at any time</li>
              <li>Correct or update inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </div>

          <div ref={(el) => (sectionRefs.current["contact"] = el)} id="contact" className="scroll-mt-24">
            <h3 className="text-2xl font-bold text-primary mb-5">Contact Us</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please reach out through our platform or contact our support team.
            </p>
          </div>
        </motion.div>
      )}

      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.2 }}
        className="text-center text-sm text-muted-foreground pb-8"
      >
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <p className="mt-2">If you have questions, please reach out through our platform.</p>
      </motion.div>
    </div>
  );
}