import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Loader2, Key, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AdminCodeGateProps {
  children: React.ReactNode;
}

const SESSION_KEY = "admin_code_verified";
const SESSION_EXPIRY_KEY = "admin_code_expiry";
const SESSION_USER_KEY = "admin_code_user";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function AdminCodeGate({ children }: AdminCodeGateProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAccessCode, setHasAccessCode] = useState(false);
  const [isSettingCode, setIsSettingCode] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkAccessCode();
    }
  }, [user]);

  const checkAccessCode = async () => {
    if (!user) return;

    try {
      // First check if there's a valid session for this user
      const storedVerified = sessionStorage.getItem(SESSION_KEY);
      const storedExpiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
      const storedUser = sessionStorage.getItem(SESSION_USER_KEY);
      
      if (storedVerified === "true" && storedExpiry && storedUser === user.id) {
        const expiryTime = parseInt(storedExpiry, 10);
        if (Date.now() < expiryTime) {
          setIsVerified(true);
          setIsLoading(false);
          return;
        }
        // Session expired, clear it
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_EXPIRY_KEY);
        sessionStorage.removeItem(SESSION_USER_KEY);
      }

      // Fetch the user's personal access code
      const { data, error } = await supabase
        .from("admin_access_codes")
        .select("access_code")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching access code:", error);
      }

      // If user has no code set, they need to create one
      if (!data || !data.access_code) {
        setHasAccessCode(false);
        setIsSettingCode(true);
      } else {
        setHasAccessCode(true);
      }
    } catch (error) {
      console.error("Error checking access code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (newCode.length < 6) {
      toast({ title: "Code too short", description: "Access code must be at least 6 characters", variant: "destructive" });
      return;
    }

    if (newCode !== confirmCode) {
      toast({ title: "Codes don't match", description: "Please make sure both codes match", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("admin_access_codes")
        .upsert({
          user_id: user.id,
          access_code: newCode,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      // Store verification in session storage
      sessionStorage.setItem(SESSION_KEY, "true");
      sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
      sessionStorage.setItem(SESSION_USER_KEY, user.id);
      
      setIsVerified(true);
      toast({ title: "Access code created", description: "Your personal admin access code has been set" });
    } catch (error: any) {
      toast({ title: "Error setting code", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("admin_access_codes")
        .select("access_code")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (code === data.access_code) {
        // Store verification in session storage
        sessionStorage.setItem(SESSION_KEY, "true");
        sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
        sessionStorage.setItem(SESSION_USER_KEY, user.id);
        setIsVerified(true);
        toast({ title: "Access granted" });
      } else {
        toast({ 
          title: "Invalid code", 
          description: "Please enter your correct admin access code",
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      toast({ title: "Error verifying code", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setCode("");
    }
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

  // Show code setup form if user doesn't have a code
  if (isSettingCode && !hasAccessCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Set Your Access Code</h1>
          <p className="text-muted-foreground mb-6">
            Create a personal access code (minimum 6 characters) to secure your admin access
          </p>

          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-500 text-left">
              Remember this code! You'll need it every time you access the admin panel.
            </p>
          </div>

          <form onSubmit={handleSetCode} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Create access code"
                className="pl-10 text-center text-lg tracking-wider"
                autoFocus
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="Confirm access code"
                className="pl-10 text-center text-lg tracking-wider"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || newCode.length < 6 || newCode !== confirmCode}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Create Access Code
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Show verification form
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
          Enter your personal access code to continue to the admin panel
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your access code"
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
          Forgot your code? Contact an administrator to reset it.
        </p>
      </motion.div>
    </div>
  );
}
