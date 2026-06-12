import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthProvider";
import { CommandPalette } from "@/components/ui/command-palette";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { MaintenanceModeGuard } from "@/components/layout/MaintenanceModeGuard";
import { WebVitals } from "@/components/perf/WebVitals";

// Eager load: en çok kullanılan sayfalar (initial bundle)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load: daha az kullanılan sayfalar (code splitting)
const Search = lazy(() => import("./pages/Search"));
const DreamDetail = lazy(() => import("./pages/DreamDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const Popular = lazy(() => import("./pages/Popular"));
const AlphabetList = lazy(() => import("./pages/AlphabetList"));
const Profile = lazy(() => import("./pages/Profile"));
const DreamJournal = lazy(() => import("./pages/DreamJournal"));
const Favorites = lazy(() => import("./pages/Favorites"));
const History = lazy(() => import("./pages/History"));
const Admin = lazy(() => import("./pages/Admin"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogTag = lazy(() => import("./pages/BlogTag"));
const Auth = lazy(() => import("./pages/Auth"));
const Install = lazy(() => import("./pages/Install"));
const SubscriptionVerify = lazy(() => import("./pages/SubscriptionVerify"));
const SubscriptionCancel = lazy(() => import("./pages/SubscriptionCancel"));
const DreamInterpret = lazy(() => import("./pages/DreamInterpret"));

import { queryClient } from "@/lib/query/client";

// Loading fallback for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Yükleniyor...</p>
    </div>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />} key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/ruya-yorumlat" element={<DreamInterpret />} />
          <Route path="/giris" element={<Auth mode="login" />} />
          <Route path="/kayit" element={<Auth mode="register" />} />
          <Route path="/ara" element={<Search />} />
          <Route path="/ruya/:slug" element={<DreamDetail />} />
          <Route path="/ruya-tabirleri" element={<Navigate replace to="/populer" />} />
          <Route path="/kategoriler" element={<Categories />} />
          <Route path="/kategori/:slug" element={<CategoryDetail />} />
          <Route path="/populer" element={<Popular />} />
          <Route path="/az" element={<AlphabetList />} />
          <Route path="/az/:letter" element={<AlphabetList />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/ruya-gunlugum" element={<DreamJournal />} />
          <Route path="/favorilerim" element={<Favorites />} />
          <Route path="/gecmis" element={<History />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/hakkimizda" element={<About />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/gizlilik" element={<Privacy />} />
          <Route path="/kullanim-kosullari" element={<Terms />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/etiket/:tag" element={<BlogTag />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/yukle" element={<Install />} />
          <Route path="/abonelik-dogrula" element={<SubscriptionVerify />} />
          <Route path="/abonelik-iptal" element={<SubscriptionCancel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <WebVitals />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <CommandPalette />
            <OnboardingTour />
            <InstallPrompt />
            <MaintenanceModeGuard>
              <AnimatedRoutes />
            </MaintenanceModeGuard>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
