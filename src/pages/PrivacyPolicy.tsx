import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

  const defaultContent = `
    <h2>Privacy Policy</h2>
    <p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.</p>
    <h3 id="data-collection">Information We Collect</h3>
    <p>We may collect information you provide directly to us, such as when you create an account, participate in giveaways, or contact us.</p>
    <h3 id="data-usage">How We Use Your Information</h3>
    <p>We use the information we collect to provide, maintain, and improve our services.</p>
    <h3 id="security">Security</h3>
    <p>We implement appropriate security measures to protect your personal information.</p>
    <h3 id="your-rights">Your Rights</h3>
    <p>You have the right to access, correct, or delete your personal data at any time.</p>
    <h3 id="contact">Contact Us</h3>
    <p>If you have any questions about this Privacy Policy, please contact us.</p>
  `;

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
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
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
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 md:p-10 prose prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-0 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-4
            prose-h3:text-xl prose-h3:text-primary prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-ul:text-muted-foreground prose-li:marker:text-primary
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || defaultContent) }}
        />
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
