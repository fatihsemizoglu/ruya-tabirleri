import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) || "dev";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: `ruya-tabirleri@${APP_VERSION}`,
    environment: import.meta.env.MODE,
    // Tunnel through our own domain to bypass ad-blockers and reduce
    // third-party DNS lookups. Requires vercel.json rewrite.
    ...(import.meta.env.VITE_SENTRY_TUNNEL ? {
      tunnel: import.meta.env.VITE_SENTRY_TUNNEL as string,
    } : {}),
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
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
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(<App />);

export { Sentry };
