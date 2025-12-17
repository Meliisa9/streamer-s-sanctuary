import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminCodeGateProps {
  children: React.ReactNode;
}

const SESSION_KEY = "admin_code_verified";
const SESSION_EXPIRY_KEY = "admin_code_expiry";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function AdminCodeGate({ children }: AdminCodeGateProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiredCode, setRequiredCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAccessCode();
  }, []);

  const checkAccessCode = async () => {
    try {
      // First check if there's a valid session
      const storedVerified = sessionStorage.getItem(SESSION_KEY);
      const storedExpiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (storedVerified === "true" && storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        if (Date.now() < expiryTime) {
          setIsVerified(true);
          setIsLoading(false);
          return;
        }
        // Session expired, clear it
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_EXPIRY_KEY);
      }

      // Fetch the required access code from settings
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "admin_access_code")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching access code:", error);
      }

      const accessCode = data?.value as string | null;
      
      // If no code is set, allow access
      if (!accessCode || accessCode.trim() === "") {
        setIsVerified(true);
      } else {
        setRequiredCode(accessCode);
      }
    } catch (error) {
      console.error("Error checking access code:", error);
      // On error, show gate to be safe
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requiredCode) return;

    setIsSubmitting(true);

    // Simple comparison - in production you might want to hash this
    if (code === requiredCode) {
      // Store verification in session storage
      sessionStorage.setItem(SESSION_KEY, "true");
      sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
      setIsVerified(true);
      toast({ title: "Access granted" });
    } else {
      toast({ 
        title: "Invalid code", 
        description: "Please enter the correct admin access code",
        variant: "destructive" 
      });
    }

    setIsSubmitting(false);
    setCode("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 max-w-md w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Admin Access</h1>
        <p className="text-muted-foreground mb-6">
          Enter the access code to continue to the admin panel
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter access code"
              className="pl-10 text-center text-lg tracking-wider"
              autoFocus
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting || code.length < 6}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Verify Access
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4">
          Contact an administrator if you don't know the access code
        </p>
      </motion.div>
    </div>
  );
}
