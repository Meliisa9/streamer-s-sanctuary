import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import { MainLayout } from "@/components/layout/MainLayout";
import { DailyRewardsManager } from "@/components/DailyRewardsManager";
import { DailyRewardPopup } from "@/components/DailyRewardPopup";
import Index from "./pages/Index";
import Videos from "./pages/Videos";
import Bonuses from "./pages/Bonuses";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import Giveaways from "./pages/Giveaways";
import Events from "./pages/Events";
import { Navigate } from "react-router-dom";
import Leaderboard from "./pages/Leaderboard";
import Polls from "./pages/Polls";
import About from "./pages/About";
import Streamers from "./pages/Streamers";
import Stream from "./pages/Stream";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import ResponsibleGambling from "./pages/ResponsibleGambling";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import Auth from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminBonuses from "./pages/admin/AdminBonuses";
import AdminGiveaways from "./pages/admin/AdminGiveaways";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminNews from "./pages/admin/AdminNews";
import AdminEvents from "./pages/admin/AdminEvents";

import AdminSettings from "./pages/admin/AdminSettings";
import AdminBranding from "./pages/admin/AdminBranding";
import AdminNavigation from "./pages/admin/AdminNavigation";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminPermissions from "./pages/admin/AdminPermissions";
import AdminPolls from "./pages/admin/AdminPolls";
import AdminAbout from "./pages/admin/AdminAbout";
import AdminStreamers from "./pages/admin/AdminStreamers";
import AdminStream from "./pages/admin/AdminStream";
import AdminLegal from "./pages/admin/AdminLegal";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminProfileSync from "./pages/admin/AdminProfileSync";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminSendNotifications from "./pages/admin/AdminSendNotifications";
import AdminUserBans from "./pages/admin/AdminUserBans";
import AdminScheduledPosts from "./pages/admin/AdminScheduledPosts";
import AdminModerationQueue from "./pages/admin/AdminModerationQueue";
import AdminBulkActions from "./pages/admin/AdminBulkActions";
import BonusHunt from "./pages/BonusHunt";
import UserProfile from "./pages/UserProfile";
import AdminBonusHunt from "./pages/admin/AdminBonusHunt";
import AdminAuthHealth from "./pages/admin/AdminAuthHealth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SiteSettingsProvider>
        <TooltipProvider>
          <DailyRewardsManager />
          <DailyRewardPopup />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />

              {/* Public routes with MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/bonuses" element={<Bonuses />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:slug" element={<NewsArticle />} />
                <Route path="/giveaways" element={<Giveaways />} />
                <Route path="/events" element={<Events />} />
                <Route path="/guess-the-win" element={<Navigate to="/bonus-hunt" replace />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/polls" element={<Polls />} />
                <Route path="/about" element={<About />} />
                <Route path="/streamers" element={<Streamers />} />
                <Route path="/stream" element={<Stream />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/responsible-gambling" element={<ResponsibleGambling />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/bonus-hunt" element={<BonusHunt />} />
                <Route path="/user/:usernameOrId" element={<UserProfile />} />
              </Route>

              {/* Admin routes - completely separate from MainLayout */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="videos" element={<AdminVideos />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="bonuses" element={<AdminBonuses />} />
                <Route path="giveaways" element={<AdminGiveaways />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="gtw" element={<Navigate to="/admin/bonus-hunt" replace />} />
                <Route path="polls" element={<AdminPolls />} />
                <Route path="streamers" element={<AdminStreamers />} />
                <Route path="stream" element={<AdminStream />} />
                <Route path="legal" element={<AdminLegal />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="profile-sync" element={<AdminProfileSync />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="settings/branding" element={<AdminBranding />} />
                <Route path="settings/navigation" element={<AdminNavigation />} />
                <Route path="settings/statistics" element={<AdminStatistics />} />
                <Route path="settings/permissions" element={<AdminPermissions />} />
                <Route path="settings/about" element={<AdminAbout />} />
                <Route path="settings/notifications" element={<AdminSendNotifications />} />
                <Route path="settings/bans" element={<AdminUserBans />} />
                <Route path="settings/scheduled" element={<AdminScheduledPosts />} />
                <Route path="settings/moderation" element={<AdminModerationQueue />} />
                <Route path="settings/bulk-actions" element={<AdminBulkActions />} />
                <Route path="settings/auth-health" element={<AdminAuthHealth />} />
                <Route path="bonus-hunt" element={<AdminBonusHunt />} />
                <Route path="audit" element={<AdminAuditLog />} />
                <Route path="activity" element={<AdminActivityLog />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
