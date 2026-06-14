import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "@/contexts/AuthProvider";
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
const DreamJournalVoice = lazy(() => import("./pages/DreamJournalVoice"));
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
const CommandPalette = lazy(() => import("@/components/ui/command-palette").then((mod) => ({ default: mod.CommandPalette })));
const OnboardingTour = lazy(() => import("@/components/onboarding/OnboardingTour").then((mod) => ({ default: mod.OnboardingTour })));
const InstallPrompt = lazy(() => import("@/components/pwa/InstallPrompt").then((mod) => ({ default: mod.InstallPrompt })));

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
  return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
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
          <Route path="/ruya-gunlugum/sesli" element={<DreamJournalVoice />} />
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
  );
}

const App = () => {
  const content = (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <WebVitals />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <OfflineIndicator />
              <Suspense fallback={null}>
                <CommandPalette />
                <OnboardingTour />
                <InstallPrompt />
              </Suspense>
              <MaintenanceModeGuard>
                <AnimatedRoutes />
              </MaintenanceModeGuard>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );

  if (!import.meta.env.VITE_SENTRY_DSN) return content;

  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog>
      {content}
    </Sentry.ErrorBoundary>
  );
};

function ErrorFallback({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Bilinmeyen hata";
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-lg">
        <div className="text-5xl mb-4">🌙</div>
        <h1 className="text-2xl font-bold mb-2">Bir sorun oluştu</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          Rüya dünyasında geçici bir sis var. Sayfayı yenilemeyi deneyin.
        </p>
        <pre className="text-xs bg-muted p-3 rounded text-left overflow-auto max-h-32 mb-4">
          {message}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-medium hover:bg-primary/90"
        >
          Sayfayı Yenile
        </button>
      </div>
    </div>
  );
}

export default App;
