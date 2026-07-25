import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { onLCP, onCLS, onINP, onTTFB } from "web-vitals";
import App from "./App.tsx";
import "./index.css";

// Self-hosted fonts (replaces Google Fonts for better privacy/performance)
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) || "dev";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: `ruya-tabirleri@${APP_VERSION}`,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      const msg = event.exception?.values?.[0]?.value || "";
      if (msg.includes("ResizeObserver")) return null;
      if (msg.includes("Failed to fetch")) return null;
      return event;
    },
  });

  // Unhandled async errors (Promise rejections) — RouteErrorBoundary bunları yakalayamaz
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason));
    Sentry.captureException(error, {
      tags: { source: "unhandledrejection" },
    });
    // Geliştirme ortamında console'a da düşsün
    if (!import.meta.env.PROD) {
      console.error("[unhandledrejection]", error);
    }
  });

  // Global JS errors (Component boundary dışı)
  window.addEventListener("error", (event) => {
    if (event.error) {
      Sentry.captureException(event.error, {
        tags: { source: "window.error" },
      });
    }
  });
}

onLCP((metric) => {
  if (metric.value > 2500) Sentry.captureMessage(`LCP: ${metric.value}ms`, { level: 'warning', extra: { metric } });
});
onTTFB((metric) => {
  if (metric.value > 800) Sentry.captureMessage(`TTFB: ${metric.value}ms`, { level: 'warning', extra: { metric } });
});
onCLS((metric) => {
  if (metric.value > 0.1) Sentry.captureMessage(`CLS: ${metric.value}`, { level: 'warning', extra: { metric } });
});
onINP((metric) => {
  if (metric.value > 200) Sentry.captureMessage(`INP: ${metric.value}ms`, { level: 'warning', extra: { metric } });
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(<App />);

export { Sentry };
