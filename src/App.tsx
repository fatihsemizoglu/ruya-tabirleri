import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthProvider";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { SWUpdatePrompt } from "@/components/pwa/SWUpdatePrompt";
import { MaintenanceModeGuard } from "@/components/layout/MaintenanceModeGuard";
import { WebVitals } from "@/components/perf/WebVitals";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Eager load: en çok kullanılan sayfalar (initial bundle)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load: daha az kullanılan sayfalar (code splitting)
const Search = lazy(() => import("./pages/Search"));
const DreamDetail = lazy(() => import("./pages/DreamDetail"));
const DreamCompare = lazy(() => import("./pages/DreamCompare"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const Popular = lazy(() => import("./pages/Popular"));
const DreamFeed = lazy(() => import("./pages/DreamFeed"));
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
const Kvkk = lazy(() => import("./pages/Kvkk"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogTag = lazy(() => import("./pages/BlogTag"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const EmailConfirm = lazy(() => import("./pages/EmailConfirm"));
const Install = lazy(() => import("./pages/Install"));
const SubscriptionVerify = lazy(() => import("./pages/SubscriptionVerify"));
const SubscriptionCancel = lazy(() => import("./pages/SubscriptionCancel"));
const CommandPalette = lazy(() => import("@/components/ui/command-palette").then((mod) => ({ default: mod.CommandPalette })));
const OnboardingTour = lazy(() => import("@/components/onboarding/OnboardingTour").then((mod) => ({ default: mod.OnboardingTour })));
const InstallPrompt = lazy(() => import("@/components/pwa/InstallPrompt").then((mod) => ({ default: mod.InstallPrompt })));
const SentryErrorBoundary = import.meta.env.VITE_SENTRY_DSN
  ? lazy(() => import("@sentry/react").then((mod) => ({ default: mod.ErrorBoundary })))
  : null;

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

function DreamDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  return <RouteErrorBoundary label="DreamDetail" key={slug}><DreamDetail /></RouteErrorBoundary>;
}

function AnimatedRoutes() {
  return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/giris" element={<Auth mode="login" />} />
          <Route path="/kayit" element={<Auth mode="register" />} />
          <Route path="/sifremi-unuttum" element={<Auth mode="forgot" />} />
          <Route path="/sifre-sifirla" element={<Auth mode="reset" />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/email-dogrula" element={<EmailConfirm />} />
          <Route path="/ara" element={<RouteErrorBoundary label="Search"><Search /></RouteErrorBoundary>} />
          {/* Content routes - isolated boundary */}
          <Route path="/ruya/:slug" element={<DreamDetailPage />} />
          <Route path="/karsilastir" element={<RouteErrorBoundary label="DreamCompare"><DreamCompare /></RouteErrorBoundary>} />
          <Route path="/ruya-tabirleri" element={<Navigate replace to="/populer" />} />
          <Route path="/kategoriler" element={<Categories />} />
          <Route path="/kategori/:slug" element={<CategoryDetail />} />
          <Route path="/populer" element={<Popular />} />
          <Route path="/akis" element={<DreamFeed />} />
          <Route path="/az" element={<AlphabetList />} />
          <Route path="/az/:letter" element={<AlphabetList />} />
          {/* User routes - isolated boundary */}
          <Route path="/profil" element={<ProtectedRoute><RouteErrorBoundary label="Profile"><Profile /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/ruya-gunlugum" element={<ProtectedRoute><RouteErrorBoundary label="Journal"><DreamJournal /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/ruya-gunlugum/sesli" element={<ProtectedRoute><RouteErrorBoundary label="Journal"><DreamJournalVoice /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/favorilerim" element={<ProtectedRoute><RouteErrorBoundary label="Favorites"><Favorites /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/gecmis" element={<ProtectedRoute><RouteErrorBoundary label="History"><History /></RouteErrorBoundary></ProtectedRoute>} />
          {/* Admin routes - isolated boundary */}
          <Route path="/admin/*" element={<ProtectedRoute roles={['admin', 'moderator']}><RouteErrorBoundary label="Admin"><Admin /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/hakkimizda" element={<About />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/gizlilik" element={<Privacy />} />
          <Route path="/kullanim-kosullari" element={<Terms />} />
          <Route path="/kvkk" element={<Kvkk />} />
          <Route path="/cerez-politikasi" element={<CookiePolicy />} />
          {/* Blog routes - isolated boundary */}
          <Route path="/blog" element={<RouteErrorBoundary label="Blog"><Blog /></RouteErrorBoundary>} />
          <Route path="/blog/etiket/:tag" element={<RouteErrorBoundary label="Blog"><BlogTag /></RouteErrorBoundary>} />
          <Route path="/blog/:slug" element={<RouteErrorBoundary label="Blog"><BlogPost /></RouteErrorBoundary>} />
          <Route path="/yukle" element={<Install />} />
          <Route path="/abonelik-dogrula" element={<SubscriptionVerify />} />
          <Route path="/abonelik-iptal" element={<SubscriptionCancel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
  );
}

function DeferredGlobalUi() {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const requestIdleCallback = window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 1500));
    const cancelIdleCallback = window.cancelIdleCallback ?? window.clearTimeout;
    const idleId = requestIdleCallback(() => setShouldMount(true), { timeout: 2500 });

    return () => cancelIdleCallback(idleId);
  }, []);

  if (!shouldMount) return null;

  return (
    <Suspense fallback={null}>
      <CommandPalette />
      <OnboardingTour />
      <InstallPrompt />
    </Suspense>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
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
              <SWUpdatePrompt />
              <DeferredGlobalUi />
              <MaintenanceModeGuard>
                <ScrollToTop />
                <AnimatedRoutes />
              </MaintenanceModeGuard>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );

  if (!import.meta.env.VITE_SENTRY_DSN) return content;

  if (!SentryErrorBoundary) return content;

  return (
    <Suspense fallback={content}>
      <SentryErrorBoundary fallback={ErrorFallback} showDialog>
        {content}
      </SentryErrorBoundary>
    </Suspense>
  );
};

function ErrorFallback({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Bilinmeyen hata";
  const showDetails = import.meta.env.DEV;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-lg">
        <div className="text-5xl mb-4">🌙</div>
        <h1 className="text-2xl font-bold mb-2">Bir sorun oluştu</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          Rüya dünyasında geçici bir sis var. Sayfayı yenilemeyi deneyin.
        </p>
        {showDetails && (
          <pre className="text-xs bg-muted p-3 rounded text-left overflow-auto max-h-32 mb-4">
            {message}
          </pre>
        )}
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
