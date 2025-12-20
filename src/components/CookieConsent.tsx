import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, BarChart3, Settings, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'cookie-consent';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true, // Always required
  analytics: false,
  functional: false,
  marketing: false,
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already made a choice
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      functional: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const acceptSelected = () => {
    savePreferences(preferences);
  };

  const rejectAll = () => {
    savePreferences(defaultPreferences);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="glass border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">We value your privacy</h3>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                    By clicking "Accept All", you consent to our use of cookies.{' '}
                    <Link to="/cookies" className="text-primary hover:underline">
                      Learn more
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Cookie Details (Expandable) */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border/50 overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {/* Essential Cookies */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="font-medium text-sm">Essential Cookies</p>
                          <p className="text-xs text-muted-foreground">Required for the website to function</p>
                        </div>
                      </div>
                      <Switch checked={true} disabled className="opacity-50" />
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="font-medium text-sm">Analytics Cookies</p>
                          <p className="text-xs text-muted-foreground">Help us understand how you use our site</p>
                        </div>
                      </div>
                      <Switch 
                        checked={preferences.analytics}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                      />
                    </div>

                    {/* Functional Cookies */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="font-medium text-sm">Functional Cookies</p>
                          <p className="text-xs text-muted-foreground">Remember your preferences and settings</p>
                        </div>
                      </div>
                      <Switch 
                        checked={preferences.functional}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, functional: checked })}
                      />
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Cookie className="w-5 h-5 text-amber-400" />
                        <div>
                          <p className="font-medium text-sm">Marketing Cookies</p>
                          <p className="text-xs text-muted-foreground">Used for targeted advertising</p>
                        </div>
                      </div>
                      <Switch 
                        checked={preferences.marketing}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="p-4 md:p-6 bg-secondary/30">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Customize Preferences
                    </>
                  )}
                </Button>
                
                <div className="flex gap-3 flex-wrap justify-center">
                  <Button variant="outline" onClick={rejectAll} className="min-w-[120px]">
                    Reject All
                  </Button>
                  {showDetails && (
                    <Button variant="outline" onClick={acceptSelected} className="min-w-[120px]">
                      Save Preferences
                    </Button>
                  )}
                  <Button onClick={acceptAll} className="min-w-[120px]">
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Utility function to check cookie consent
export function getCookieConsent(): CookiePreferences | null {
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return {
      essential: parsed.essential ?? true,
      analytics: parsed.analytics ?? false,
      functional: parsed.functional ?? false,
      marketing: parsed.marketing ?? false,
    };
  } catch {
    return null;
  }
}

// Utility function to check if a specific cookie type is allowed
export function isCookieAllowed(type: keyof CookiePreferences): boolean {
  const consent = getCookieConsent();
  if (!consent) return type === 'essential';
  return consent[type];
}
