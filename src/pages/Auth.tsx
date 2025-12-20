import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Twitch, MessageCircle, Mail, Lock, User, ArrowLeft, Loader2, 
  Eye, EyeOff, CheckCircle, Sparkles, Shield, Zap, Trophy, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const features = [
  { icon: Trophy, text: "Earn points & climb leaderboards", color: "text-yellow-400" },
  { icon: Gift, text: "Enter exclusive giveaways", color: "text-pink-400" },
  { icon: Zap, text: "Participate in bonus hunts", color: "text-blue-400" },
  { icon: Shield, text: "Unlock achievements & badges", color: "text-green-400" },
];

function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Safety: if an auth request gets stuck, auto-unlock the UI
  useEffect(() => {
    if (!isLoading) return;

    const t = window.setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Auth timed out",
        description: "That took too long. Please try again.",
        variant: "destructive",
      });
    }, 15000);

    return () => window.clearTimeout(t);
  }, [isLoading, toast]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; username?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    if (mode !== "forgot") {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    
    if (mode === "signup" && username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (mode === "signup" && !acceptTerms) {
      toast({
        title: "Please accept terms",
        description: "You must accept the terms to create an account.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    const backendUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const backendKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    if (!backendUrl || !backendKey) {
      toast({
        title: "Backend not configured",
        description: "Authentication service unavailable.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        
        if (error) throw error;
        
        setResetEmailSent(true);
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username || email.split("@")[0],
              name: username || email.split("@")[0],
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please log in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Account created!",
            description: "You can now log in with your credentials.",
          });
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      const message = String(error?.message || "");
      const isNetworkFail = /failed to fetch/i.test(message) || error?.name === "TypeError";

      toast({
        title: "Error",
        description: isNetworkFail
          ? "Network error. Please check your connection."
          : message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "twitch" | "discord") => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to connect with ${provider}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleKickLogin = async () => {
    setIsLoading(true);

    try {
      const frontendUrl = window.location.origin;
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const callbackBase = (localStorage.getItem("kick_callback_base") || "").trim();

      if (isLocalhost && !callbackBase) {
        throw new Error('For localhost testing, set localStorage "kick_callback_base" to your tunnel URL.');
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kick-oauth?action=authorize&frontend_url=${encodeURIComponent(frontendUrl)}${callbackBase ? `&callback_base=${encodeURIComponent(callbackBase)}` : ""}`;

      const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
      });

      const raw = await response.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const detail = data?.error || raw || `HTTP ${response.status}`;
        throw new Error(`Kick authorize failed: ${detail}`);
      }

      const authorizeUrl: string | undefined = data?.authorize_url;
      if (!authorizeUrl) {
        throw new Error(`Missing authorize_url in response`);
      }

      window.location.assign(authorizeUrl);
    } catch (error: any) {
      toast({
        title: "Failed to connect Kick",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/20 via-background to-purple-900/20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">StreamerX</h1>
                <p className="text-muted-foreground">Casino Entertainment Hub</p>
              </div>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
              Join the ultimate
              <span className="block bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                streaming community
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Connect with thousands of viewers, participate in exclusive events, and earn rewards.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-background/30 backdrop-blur-sm border border-border/30"
              >
                <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Mobile Background */}
        <div className="absolute inset-0 lg:hidden bg-hero-pattern pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          {/* Form Card */}
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                    {mode === "forgot" ? (
                      <Mail className="w-8 h-8 text-white" />
                    ) : mode === "signup" ? (
                      <User className="w-8 h-8 text-white" />
                    ) : (
                      <Lock className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h1 className="text-2xl font-bold mb-2">
                    {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {mode === "login"
                      ? "Sign in to access your account"
                      : mode === "signup"
                      ? "Join the community today"
                      : "Enter your email to receive a reset link"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* OAuth Buttons */}
            {mode !== "forgot" && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-[#9146FF]/10 border-[#9146FF]/30 hover:bg-[#9146FF]/20 hover:border-[#9146FF]/50 transition-all"
                    onClick={() => handleOAuthLogin("twitch")}
                    disabled={isLoading}
                  >
                    <Twitch className="w-5 h-5 text-[#9146FF]" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-[#5865F2]/10 border-[#5865F2]/30 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50 transition-all"
                    onClick={() => handleOAuthLogin("discord")}
                    disabled={isLoading}
                  >
                    <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-[#53FC18]/10 border-[#53FC18]/30 hover:bg-[#53FC18]/20 hover:border-[#53FC18]/50 transition-all"
                    onClick={() => handleKickLogin()}
                    disabled={isLoading}
                  >
                    <span className="w-5 h-5 flex items-center justify-center font-bold text-[#53FC18]">K</span>
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
                  </div>
                </div>
              </>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrors((prev) => ({ ...prev, username: undefined }));
                      }}
                      placeholder="Choose a username"
                      className={`w-full pl-10 pr-4 py-3 bg-secondary/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                        errors.username ? "border-destructive" : "border-border/50 focus:border-primary"
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-3 bg-secondary/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      errors.email ? "border-destructive" : "border-border/50 focus:border-primary"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setResetEmailSent(false); }}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-12 py-3 bg-secondary/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                        errors.password ? "border-destructive" : "border-border/50 focus:border-primary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  {mode === "signup" && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= i * 3
                              ? password.length >= 12
                                ? "bg-green-500"
                                : password.length >= 9
                                ? "bg-yellow-500"
                                : "bg-primary"
                              : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {mode === "signup" && (
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border bg-secondary accent-primary"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                    {" "}and{" "}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all"
                disabled={isLoading || (mode === "forgot" && resetEmailSent)}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === "login" ? (
                  "Sign In"
                ) : mode === "signup" ? (
                  "Create Account"
                ) : resetEmailSent ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Email Sent!
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            {/* Toggle Mode */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === "login" ? "Don't have an account?" : mode === "signup" ? "Already have an account?" : "Remember your password?"}{" "}
              <button
                type="button"
                onClick={() => { 
                  setMode(mode === "forgot" ? "login" : mode === "login" ? "signup" : "login"); 
                  setResetEmailSent(false);
                  setErrors({});
                }}
                className="text-primary hover:underline font-medium"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Auth;