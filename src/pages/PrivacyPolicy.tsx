import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/sanitize";

export default function PrivacyPolicy() {
  const { data: content, isLoading } = useQuery({
    queryKey: ["legal-privacy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "legal_privacy_policy")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as string | null;
    },
  });

  const defaultContent = `
    <h2>Privacy Policy</h2>
    <p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.</p>
    <h3>Information We Collect</h3>
    <p>We may collect information you provide directly to us, such as when you create an account, participate in giveaways, or contact us.</p>
    <h3>How We Use Your Information</h3>
    <p>We use the information we collect to provide, maintain, and improve our services.</p>
    <h3>Contact Us</h3>
    <p>If you have any questions about this Privacy Policy, please contact us.</p>
  `;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">How we handle your data</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || defaultContent) }}
        />
      )}
    </div>
  );
}
