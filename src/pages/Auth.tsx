import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Twitch,
  MessageCircle,
  Mail,
  Lock,
  User,
  X,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  Info,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWhiteLabelSettings } from "@/hooks/useWhiteLabelSettings";
import { z } from "zod";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { GlobalSearch } from "@/components/GlobalSearch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const passwordRequirements = [
  { label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
  { label: "Contains special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; confirmPassword?: string }>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const navigate = useNavigate();
  const { user, isModerator } = useAuth();
  const { settings: wl } = useWhiteLabelSettings();
  const { toast } = useToast();

  const isMaintenanceMode = !!wl.maintenance_mode;
  const isAdminLogin = searchParams.get("admin") === "true";

  // During maintenance, force login mode only (no signup)
  useEffect(() => {
    if (isMaintenanceMode && mode === "signup") {
      setMode("login");
    }
  }, [isMaintenanceMode, mode]);

  useEffect(() => {
    if (user) {
      // If maintenance mode is on, only allow admin/mod users
      if (isMaintenanceMode && !isModerator) {
        supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "Only administrators and moderators can access the site during maintenance.",
          variant: "destructive",
        });
        return;
      }
      navigate("/");
    }
  }, [user, isModerator, isMaintenanceMode, navigate, toast]);

  // Check for password reset mode from URL
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "reset") {
      setMode("reset");
    }
  }, [searchParams]);

  useEffect(() => {
    if (isMaintenanceMode) return; // Skip sidebar detection in maintenance mode
    
    const checkSidebarState = () => {
      const sidebar = document.querySelector("aside");
      if (sidebar) {
        setSidebarCollapsed(sidebar.clientWidth < 100);
      }
    };

    const observer = new ResizeObserver(checkSidebarState);
    const sidebar = document.querySelector("aside");
    if (sidebar) {
      observer.observe(sidebar);
    }

    return () => observer.disconnect();
  }, [isMaintenanceMode]);

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
    const newErrors: { email?: string; password?: string; username?: string; confirmPassword?: string } = {};
    
    // Email validation (not needed for reset mode)
    if (mode !== "reset") {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
    }
    
    // Password validation for login, signup, and reset
    if (mode !== "forgot") {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    
    // Confirm password for reset mode
    if (mode === "reset") {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
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
      if (mode === "reset") {
        // Handle password reset
        const { error } = await supabase.auth.updateUser({
          password: password,
        });
        
        if (error) throw error;
        
        setPasswordResetSuccess(true);
        toast({
          title: "Password updated!",
          description: "Your password has been successfully changed. You can now log in.",
        });
        
        // Sign out and redirect to login after a short delay
        setTimeout(async () => {
          await supabase.auth.signOut();
          setMode("login");
          setPasswordResetSuccess(false);
          setPassword("");
          setConfirmPassword("");
          navigate("/auth");
        }, 2000);
      } else if (mode === "forgot") {
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
        // Set session persistence based on "Remember me" checkbox
        // When rememberMe is false, we'll sign out when the browser closes
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.session) {
          // If "Remember me" is unchecked, store a flag to clear session on browser close
          if (!rememberMe) {
            sessionStorage.setItem('session_temporary', 'true');
          } else {
            sessionStorage.removeItem('session_temporary');
          }
        }

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

  const getPasswordStrength = () => {
    const passed = passwordRequirements.filter(req => req.test(password)).length;
    return passed;
  };

  const strengthColors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

  // Maintenance mode layout (no sidebar, simplified)
  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {/* Modal Overlay */}
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            style={
              wl.login_background_url
                ? {
                    backgroundImage: `url(${wl.login_background_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {wl.login_background_url && (
              <div className="absolute inset-0 bg-background/70" />
            )}
          </div>
          
          {/* Auth Popup - Maintenance Mode */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            {/* Form Card */}
            <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-2xl shadow-black/20">
              {/* Back Button */}
              <button
                onClick={() => navigate("/")}
                className="absolute top-4 left-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-8 mt-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20 overflow-hidden">
                  {wl.login_logo_url ? (
                    <img
                      src={wl.login_logo_url}
                      alt="Login logo"
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                    />
                  ) : (
                    <Lock className="w-8 h-8 text-white" />
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-2">Staff Login</h1>
                <p className="text-muted-foreground text-sm">
                  Site is under maintenance. Only admins and moderators can access.
                </p>
              </div>

              {/* Email/Password Form Only */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                      className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                      className="w-full pl-11 pr-12 py-3 bg-secondary/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full py-6 text-lg font-medium rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <motion.main
        className="flex-1 flex flex-col min-h-screen relative"
        animate={{
          marginLeft: sidebarCollapsed ? 80 : 260,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-4 p-4">
          <div className="flex-1 flex justify-center">
            <GlobalSearch />
          </div>
        </div>

        {/* Background content placeholder */}
        <div className="flex-1 px-6 opacity-30 pointer-events-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-card/50 border border-border/30" />
            ))}
          </div>
        </div>

        <Footer />
      </motion.main>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          style={
            wl.login_background_url
              ? {
                  backgroundImage: `url(${wl.login_background_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {wl.login_background_url && (
            <div className="absolute inset-0 bg-background/70" />
          )}
        </div>
        
        {/* Auth Popup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          {/* Form Card */}
          <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-2xl shadow-black/20">
            {/* Close Button */}
            <button
              onClick={() => navigate("/")}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg shadow-primary/20 overflow-hidden">
                    {wl.login_logo_url && mode === "login" ? (
                      <img
                        src={wl.login_logo_url}
                        alt="Login logo"
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                      />
                    ) : mode === "forgot" ? (
                      <Mail className="w-8 h-8 text-primary-foreground" />
                    ) : mode === "signup" ? (
                      <User className="w-8 h-8 text-primary-foreground" />
                    ) : mode === "reset" ? (
                      <KeyRound className="w-8 h-8 text-primary-foreground" />
                    ) : (
                      <Lock className="w-8 h-8 text-primary-foreground" />
                    )}
                  </div>
                  <h1 className="text-2xl font-bold mb-2">
                    {mode === "login"
                      ? wl.login_welcome_text || "Welcome Back"
                      : mode === "signup"
                      ? "Create Account"
                      : mode === "reset"
                      ? "Set New Password"
                      : "Reset Password"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {mode === "login"
                      ? wl.login_subtitle || "Sign in to access your account"
                      : mode === "signup"
                      ? "Join the community today"
                      : mode === "reset"
                      ? "Enter your new password below"
                      : "Enter your email to receive a reset link"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Back to Login button for reset/forgot modes */}
            {(mode === "forgot" || mode === "reset") && (
              <button
                type="button"
                onClick={() => { 
                  setMode("login"); 
                  setResetEmailSent(false); 
                  setPasswordResetSuccess(false);
                  setErrors({});
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            )}

            {/* OAuth Buttons */}
            {(mode === "login" || mode === "signup") && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 bg-[#9146FF]/10 border-[#9146FF]/30 hover:bg-[#9146FF]/20 hover:border-[#9146FF]/50 transition-all"
                          onClick={() => handleOAuthLogin("twitch")}
                          disabled={isLoading}
                        >
                          <Twitch className="w-5 h-5 text-[#9146FF]" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Sign in with Twitch</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 bg-[#5865F2]/10 border-[#5865F2]/30 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50 transition-all"
                          onClick={() => handleOAuthLogin("discord")}
                          disabled={isLoading}
                        >
                          <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Sign in with Discord</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 bg-[#53FC18]/10 border-[#53FC18]/30 hover:bg-[#53FC18]/20 hover:border-[#53FC18]/50 transition-all"
                          onClick={() => handleKickLogin()}
                          disabled={isLoading}
                        >
                          <span className="w-5 h-5 flex items-center justify-center font-bold text-[#53FC18]">K</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Sign in with Kick</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

              {/* Email field - hidden for reset mode */}
              {mode !== "reset" && (
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
              )}

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Password</label>
                      {mode === "signup" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-muted-foreground hover:text-foreground">
                                <Info className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="w-64 p-3">
                              <p className="font-medium mb-2">Password Requirements</p>
                              <ul className="space-y-1.5">
                                {passwordRequirements.map((req, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                      req.test(password) ? "bg-green-500" : "bg-muted"
                                    }`}>
                                      {req.test(password) && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={req.test(password) ? "text-foreground" : "text-muted-foreground"}>
                                      {req.label}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
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
                  {mode === "signup" && password.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i < getPasswordStrength() ? strengthColors[getPasswordStrength() - 1] : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getPasswordStrength() <= 1 && "Weak password"}
                        {getPasswordStrength() === 2 && "Fair password"}
                        {getPasswordStrength() === 3 && "Good password"}
                        {getPasswordStrength() === 4 && "Strong password"}
                        {getPasswordStrength() === 5 && "Excellent password"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password - for reset mode only */}
              {mode === "reset" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }}
                      placeholder="Confirm your new password"
                      className={`w-full pl-10 pr-12 py-3 bg-secondary/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                        errors.confirmPassword ? "border-destructive" : "border-border/50 focus:border-primary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}
              {mode === "login" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="h-5 w-5 border-2 border-muted-foreground/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary rounded-md transition-all"
                  />
                  <label 
                    htmlFor="rememberMe" 
                    className="text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                  >
                    Remember me
                  </label>
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
                disabled={isLoading || (mode === "forgot" && resetEmailSent) || passwordResetSuccess}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : passwordResetSuccess ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Password Updated!
                  </span>
                ) : mode === "login" ? (
                  "Sign In"
                ) : mode === "signup" ? (
                  "Create Account"
                ) : mode === "reset" ? (
                  "Update Password"
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

            {/* Toggle Mode - hidden for reset mode */}
            {mode !== "reset" && (
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
            )}
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
