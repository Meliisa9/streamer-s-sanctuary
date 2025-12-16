import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Videos from "./pages/Videos";
import Bonuses from "./pages/Bonuses";
import News from "./pages/News";
import Giveaways from "./pages/Giveaways";
import Events from "./pages/Events";
import GuessTheWin from "./pages/GuessTheWin";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/bonuses" element={<Bonuses />} />
            <Route path="/news" element={<News />} />
            <Route path="/giveaways" element={<Giveaways />} />
            <Route path="/events" element={<Events />} />
            <Route path="/guess-the-win" element={<GuessTheWin />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
