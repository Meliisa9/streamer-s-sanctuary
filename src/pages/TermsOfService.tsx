import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function TermsOfService() {
  const { data: content, isLoading } = useQuery({
    queryKey: ["legal-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "legal_terms_of_service")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as string | null;
    },
  });

  const defaultContent = `
    <h2>Terms of Service</h2>
    <p>Welcome to our platform. By using our services, you agree to these terms.</p>
    <h3>Use of Service</h3>
    <p>You must be at least 18 years old to use this service.</p>
    <h3>User Conduct</h3>
    <p>You agree to use our services only for lawful purposes.</p>
    <h3>Limitation of Liability</h3>
    <p>We are not liable for any damages arising from your use of our services.</p>
  `;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground">Rules and guidelines for using our platform</p>
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
          dangerouslySetInnerHTML={{ __html: content || defaultContent }}
        />
      )}
    </div>
  );
}
