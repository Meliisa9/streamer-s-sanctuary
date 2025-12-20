import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Mail, Loader2, Eye, Code, Copy, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import { useAuth } from "@/contexts/AuthContext";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  template_type: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const templateTypes = [
  { value: "system", label: "System" },
  { value: "giveaway", label: "Giveaway" },
  { value: "event", label: "Event" },
  { value: "bonus_hunt", label: "Bonus Hunt" },
  { value: "social", label: "Social" },
  { value: "notification", label: "Notification" },
];

const typeColors: Record<string, string> = {
  system: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  giveaway: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  event: "bg-green-500/10 text-green-500 border-green-500/20",
  bonus_hunt: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  social: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  notification: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

// Premium pre-made templates with modern, high-end designs
const premadeTemplates = [
  {
    name: "welcome_user",
    subject: "🎰 Welcome to {{site_name}} - Your Journey to Epic Wins Begins!",
    template_type: "system",
    variables: "username, site_name, site_url",
    body_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{site_name}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f;">
  <div style="max-width: 640px; margin: 0 auto; padding: 0;">
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%); padding: 4px;">
      <div style="background: linear-gradient(180deg, #12121a 0%, #1a1a2e 100%); padding: 48px 40px;">
        <!-- Logo Area -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); width: 90px; height: 90px; border-radius: 24px; box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);">
            <div style="padding: 20px;">
              <span style="font-size: 48px; line-height: 1;">🎰</span>
            </div>
          </div>
        </div>
        
        <!-- Welcome Text -->
        <h1 style="color: #ffffff; font-size: 32px; font-weight: 800; text-align: center; margin: 0 0 8px 0; letter-spacing: -0.5px;">Welcome, {{username}}!</h1>
        <p style="color: #a78bfa; font-size: 18px; text-align: center; margin: 0 0 40px 0; font-weight: 500;">Your journey to epic wins starts now</p>
        
        <!-- Feature Cards -->
        <div style="margin-bottom: 32px;">
          <div style="background: linear-gradient(145deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 12px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="50" valign="top">
                  <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #8b5cf6, #a78bfa); border-radius: 12px; text-align: center; line-height: 44px;">
                    <span style="font-size: 22px;">🎁</span>
                  </div>
                </td>
                <td style="padding-left: 16px;">
                  <h3 style="color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 4px 0;">Exclusive Giveaways</h3>
                  <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5;">Win cash, crypto & gaming prizes daily</p>
                </td>
              </tr>
            </table>
          </div>
          
          <div style="background: linear-gradient(145deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 12px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="50" valign="top">
                  <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #ec4899, #f472b6); border-radius: 12px; text-align: center; line-height: 44px;">
                    <span style="font-size: 22px;">🎯</span>
                  </div>
                </td>
                <td style="padding-left: 16px;">
                  <h3 style="color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 4px 0;">Bonus Hunt Predictions</h3>
                  <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5;">Guess the total & climb the leaderboard</p>
                </td>
              </tr>
            </table>
          </div>
          
          <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="50" valign="top">
                  <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #10b981, #34d399); border-radius: 12px; text-align: center; line-height: 44px;">
                    <span style="font-size: 22px;">🏆</span>
                  </div>
                </td>
                <td style="padding-left: 16px;">
                  <h3 style="color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 4px 0;">Earn Points & Rewards</h3>
                  <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5;">Level up your profile with every interaction</p>
                </td>
              </tr>
            </table>
          </div>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center;">
          <a href="{{site_url}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #fff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 12px 40px rgba(139, 92, 246, 0.4);">Start Exploring →</a>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #0a0a0f; padding: 32px 40px; text-align: center;">
      <p style="color: #64748b; font-size: 13px; margin: 0;">© {{site_name}} • The Ultimate Casino Streaming Experience</p>
      <p style="color: #475569; font-size: 11px; margin-top: 8px;">You received this email because you created an account on {{site_name}}</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "giveaway_winner",
    subject: "🏆 WINNER! You Won the {{giveaway_name}} Giveaway!",
    template_type: "giveaway",
    variables: "username, giveaway_name, prize, claim_link, site_name",
    body_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're a Winner!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f;">
  <div style="max-width: 640px; margin: 0 auto; padding: 0;">
    <!-- Header Banner with Gold Theme -->
    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%); padding: 4px;">
      <div style="background: linear-gradient(180deg, #12121a 0%, #1a1a2e 100%); padding: 48px 40px;">
        <!-- Confetti & Trophy -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 72px; line-height: 1; margin-bottom: 16px;">🎉🏆🎉</div>
        </div>
        
        <!-- Winner Announcement -->
        <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.05) 100%); border: 2px solid rgba(251, 191, 36, 0.5); border-radius: 24px; padding: 40px; margin-bottom: 32px; text-align: center;">
          <p style="color: #fbbf24; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 8px 0;">Congratulations</p>
          <h1 style="color: #fff; font-size: 36px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">YOU WON!</h1>
          <p style="color: #fde68a; font-size: 18px; margin: 0;">{{username}}, you're a winner!</p>
        </div>
        
        <!-- Prize Box -->
        <div style="background: linear-gradient(180deg, #1e1e2f 0%, #16162a 100%); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 20px; padding: 32px; margin-bottom: 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Your Prize</p>
          <h2 style="color: #fbbf24; font-size: 32px; font-weight: 800; margin: 0 0 8px 0; text-shadow: 0 0 40px rgba(251, 191, 36, 0.5);">{{prize}}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">from <strong style="color: #94a3b8;">{{giveaway_name}}</strong></p>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="{{claim_link}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #0a0a0f; text-decoration: none; padding: 20px 56px; border-radius: 14px; font-weight: 800; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 12px 40px rgba(251, 191, 36, 0.4);">Claim Your Prize</a>
        </div>
        
        <!-- Urgency Notice -->
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; text-align: center;">
          <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin: 0;">⚠️ Please claim within 48 hours or the prize may be forfeited</p>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #0a0a0f; padding: 32px 40px; text-align: center;">
      <p style="color: #64748b; font-size: 13px; margin: 0;">© {{site_name}} • Giveaway Notification</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "event_reminder",
    subject: "⏰ Starting Soon: {{event_name}} - Don't Miss Out!",
    template_type: "event",
    variables: "username, event_name, event_time, event_description, watch_link, site_name",
    body_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f;">
  <div style="max-width: 640px; margin: 0 auto; padding: 0;">
    <!-- Header Banner with Blue Theme -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 4px;">
      <div style="background: linear-gradient(180deg, #12121a 0%, #1a1a2e 100%); padding: 48px 40px;">
        <!-- Live Badge -->
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; font-size: 12px; font-weight: 700; padding: 8px 20px; border-radius: 50px; text-transform: uppercase; letter-spacing: 2px; animation: pulse 2s infinite;">
            🔴 Starting Soon
          </span>
        </div>
        
        <!-- Event Title -->
        <h1 style="color: #fff; font-size: 28px; font-weight: 800; text-align: center; margin: 0 0 8px 0; letter-spacing: -0.5px;">{{event_name}}</h1>
        <p style="color: #94a3b8; font-size: 16px; text-align: center; margin: 0 0 32px 0;">Hey {{username}}, the event you're waiting for is about to begin!</p>
        
        <!-- Event Details Card -->
        <div style="background: linear-gradient(145deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; padding: 32px; margin-bottom: 32px;">
          <!-- Time -->
          <div style="display: flex; margin-bottom: 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="56" valign="top">
                  <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #3b82f6, #60a5fa); border-radius: 14px; text-align: center; line-height: 52px;">
                    <span style="font-size: 26px;">🕐</span>
                  </div>
                </td>
                <td style="padding-left: 16px;">
                  <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">When</p>
                  <p style="color: #3b82f6; font-size: 22px; font-weight: 700; margin: 0;">{{event_time}}</p>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Description -->
          <div style="background: rgba(15, 23, 42, 0.5); border-radius: 12px; padding: 20px;">
            <p style="color: #e2e8f0; font-size: 15px; line-height: 1.7; margin: 0;">{{event_description}}</p>
          </div>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center;">
          <a href="{{watch_link}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #fff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);">Watch Live →</a>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #0a0a0f; padding: 32px 40px; text-align: center;">
      <p style="color: #64748b; font-size: 13px; margin: 0;">© {{site_name}} • Event Reminder</p>
      <p style="color: #475569; font-size: 11px; margin-top: 8px;">You subscribed to event notifications for this event</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "bonus_hunt_winner",
    subject: "🎯 Perfect Prediction! You Earned +{{points}} Points!",
    template_type: "bonus_hunt",
    variables: "username, hunt_name, guess, actual_result, points, site_name",
    body_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prediction Winner</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f;">
  <div style="max-width: 640px; margin: 0 auto; padding: 0;">
    <!-- Header Banner with Green Theme -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 4px;">
      <div style="background: linear-gradient(180deg, #12121a 0%, #1a1a2e 100%); padding: 48px 40px;">
        <!-- Success Icon -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 100px; height: 100px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05)); border: 2px solid rgba(16, 185, 129, 0.5); border-radius: 50%; line-height: 100px;">
            <span style="font-size: 52px;">🎯</span>
          </div>
        </div>
        
        <!-- Winner Text -->
        <h1 style="color: #10b981; font-size: 32px; font-weight: 800; text-align: center; margin: 0 0 8px 0;">Bullseye!</h1>
        <p style="color: #6ee7b7; font-size: 18px; text-align: center; margin: 0 0 32px 0;">{{username}}, your prediction was spot on!</p>
        
        <!-- Stats Grid -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td width="48%" style="padding-right: 8px;">
              <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 24px; text-align: center;">
                <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Your Guess</p>
                <p style="color: #fff; font-size: 28px; font-weight: 800; margin: 0;">{{guess}}</p>
              </div>
            </td>
            <td width="48%" style="padding-left: 8px;">
              <div style="background: linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 24px; text-align: center;">
                <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Actual Result</p>
                <p style="color: #10b981; font-size: 28px; font-weight: 800; margin: 0;">{{actual_result}}</p>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Points Earned Box -->
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.1) 100%); border: 2px solid rgba(16, 185, 129, 0.5); border-radius: 20px; padding: 32px; text-align: center; margin-bottom: 24px;">
          <p style="color: #6ee7b7; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Points Earned</p>
          <p style="color: #10b981; font-size: 48px; font-weight: 800; margin: 0; text-shadow: 0 0 40px rgba(16, 185, 129, 0.5);">+{{points}}</p>
        </div>
        
        <!-- Hunt Name -->
        <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">Hunt: <strong style="color: #94a3b8;">{{hunt_name}}</strong></p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #0a0a0f; padding: 32px 40px; text-align: center;">
      <p style="color: #64748b; font-size: 13px; margin: 0;">© {{site_name}} • Bonus Hunt Notification</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: "new_follower",
    subject: "👋 {{follower_name}} just followed you!",
    template_type: "social",
    variables: "username, follower_name, follower_link, site_name",
    body_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Follower</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f;">
  <div style="max-width: 640px; margin: 0 auto; padding: 0;">
    <!-- Header Banner with Pink Theme -->
    <div style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); padding: 4px;">
      <div style="background: linear-gradient(180deg, #12121a 0%, #1a1a2e 100%); padding: 48px 40px;">
        <!-- Avatar Placeholder -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 90px; height: 90px; background: linear-gradient(135deg, #ec4899, #f472b6); border-radius: 50%; line-height: 90px; box-shadow: 0 16px 48px rgba(236, 72, 153, 0.4);">
            <span style="font-size: 44px;">👋</span>
          </div>
        </div>
        
        <!-- Notification Text -->
        <h1 style="color: #fff; font-size: 28px; font-weight: 800; text-align: center; margin: 0 0 8px 0;">New Follower!</h1>
        <p style="color: #94a3b8; font-size: 16px; text-align: center; margin: 0 0 32px 0;">Hey {{username}}, you have a new follower!</p>
        
        <!-- Follower Card -->
        <div style="background: linear-gradient(145deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 20px; padding: 32px; margin-bottom: 32px; text-align: center;">
          <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 50%; line-height: 64px; margin-bottom: 16px;">
            <span style="font-size: 28px; color: #fff;">👤</span>
          </div>
          <h2 style="color: #f472b6; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">{{follower_name}}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0;">is now following you</p>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center;">
          <a href="{{follower_link}}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 12px 40px rgba(236, 72, 153, 0.4);">View Profile</a>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #0a0a0f; padding: 32px 40px; text-align: center;">
      <p style="color: #64748b; font-size: 13px; margin: 0;">© {{site_name}} • Social Notification</p>
      <p style="color: #475569; font-size: 11px; margin-top: 8px;">You received this because you enabled follower notifications</p>
    </div>
  </div>
</body>
</html>`,
  },
];

export default function AdminEmailTemplates() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body_html: "",
    body_text: "",
    template_type: "notification",
    variables: "",
    is_active: true,
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_type", { ascending: true });
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const variables = data.variables.split(",").map(v => v.trim()).filter(Boolean);
      const { error } = await supabase.from("email_templates").insert({
        name: data.name,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text || null,
        template_type: data.template_type,
        variables,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const variables = data.variables.split(",").map(v => v.trim()).filter(Boolean);
      const { error } = await supabase.from("email_templates").update({
        name: data.name,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text || null,
        template_type: data.template_type,
        variables,
        is_active: data.is_active,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("email_templates").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", subject: "", body_html: "", body_text: "", template_type: "notification", variables: "", is_active: true });
    setEditingTemplate(null);
    setPreviewTab("edit");
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text || "",
      template_type: template.template_type,
      variables: (template.variables || []).join(", "),
      is_active: template.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(`{{${varName}}}`);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const renderPreview = () => {
    let html = formData.body_html;
    const variables = formData.variables.split(",").map(v => v.trim()).filter(Boolean);
    variables.forEach(v => {
      html = html.replace(new RegExp(`{{${v}}}`, "g"), `<span class="bg-primary/20 px-1 rounded">[${v}]</span>`);
    });
    return html;
  };

  // Add premade templates
  const addPremadeTemplates = useMutation({
    mutationFn: async () => {
      for (const template of premadeTemplates) {
        const variables = template.variables.split(",").map(v => v.trim());
        const { error } = await supabase.from("email_templates").insert({
          name: template.name,
          subject: template.subject,
          body_html: template.body_html,
          template_type: template.template_type,
          variables,
          is_active: true,
        });
        if (error && !error.message.includes("duplicate")) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Premium templates added!", description: "5 professionally designed templates are now available." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Manage email notification templates</p>
        </div>
        <div className="flex items-center gap-2">
          {templates.length === 0 && (
            <Button 
              variant="outline" 
              onClick={() => addPremadeTemplates.mutate()}
              disabled={addPremadeTemplates.isPending}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Add Premium Templates
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Template" : "Add New Template"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., welcome, giveaway_winner"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.template_type} onValueChange={(value) => setFormData({ ...formData, template_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject Line *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Welcome to {{site_name}}!"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Variables (comma-separated)</Label>
                  <Input
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    placeholder="username, site_name, prize"
                  />
                  <p className="text-xs text-muted-foreground">Use {"{{variable_name}}"} in your template to insert dynamic content</p>
                </div>

                <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as "edit" | "preview")}>
                  <TabsList>
                    <TabsTrigger value="edit" className="gap-2"><Code className="w-4 h-4" /> Edit HTML</TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2"><Eye className="w-4 h-4" /> Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="space-y-2">
                    <Label>HTML Body *</Label>
                    <Textarea
                      value={formData.body_html}
                      onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                      placeholder="<h1>Hello {{username}}!</h1>"
                      rows={10}
                      className="font-mono text-sm"
                      required
                    />
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="border border-border rounded-xl p-4 bg-white text-black min-h-[200px]">
                      <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label>Plain Text Body (fallback)</Label>
                  <Textarea
                    value={formData.body_text}
                    onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                    placeholder="Hello {{username}}! ..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AdminSettingsNav />

      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge variant="outline" className={typeColors[template.template_type]}>
                      {template.template_type}
                    </Badge>
                    {!template.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((v: string) => (
                        <button
                          key={v}
                          onClick={() => copyVariable(v)}
                          className="px-2 py-0.5 bg-secondary text-xs rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          {copiedVar === v ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={template.is_active}
                  onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: template.id, is_active: checked })}
                />
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No email templates yet. Click "Add Premium Templates" to get started with professionally designed templates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
