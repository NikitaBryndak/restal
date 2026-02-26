import { AuthProvider } from "@/components/Providers";
import Footer from "../components/navigation/Footer";
import Navbar from "../components/navigation/Navbar";
import "./globals.css";
import { Spotlight } from "@/components/ui/spotlight-new";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BASE_URL } from "@/config/constants";
import { PWARegistration } from "@/components/pwa/pwa-registration";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "RestAL",
    template: "%s | RestAL",
  },
  description:
    "Перетворюємо мрії про подорожі на реальність. Ваш комфорт — наш пріоритет. Повний супровід 24/7, глибока експертиза в напрямках та увага до кожної деталі вашої відпустки. Забронюйте тур онлайн!",
  keywords: [
    "тури", "подорожі", "відпочинок", "бронювання турів", "турагенція",
    "гарячі тури", "тури з України", "відпустка", "тур онлайн",
    "Туреччина", "Єгипет", "Мальдіви", "RestAL"
  ],
  authors: [{ name: "RestAL" }],
  creator: "RestAL",
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: BASE_URL,
    siteName: "RestAL",
    title: "Турагенція RestAL — Експертне планування вашого відпочинку",
    description:
      "Перетворюємо мрії про подорожі на реальність. Ваш комфорт — наш пріоритет. Повний супровід 24/7, глибока експертиза в напрямках та увага до кожної деталі вашої відпустки. Забронюйте тур онлайн!",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "RestAL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Турагенція RestAL — Експертне планування вашого відпочинку",
    description:
      "Перетворюємо мрії про подорожі на реальність. Ваш комфорт — наш пріоритет. Повний супровід 24/7, глибока експертиза в напрямках та увага до кожної деталі вашої відпустки. Забронюйте тур онлайн!",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
  verification: {
    // Add your verification codes here after setting up Google Search Console
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body
        className="flex antialiased min-h-screen flex-col w-full smooth-scroll"
        suppressHydrationWarning={true} // Suppresses hydration warnings
      >
        <div className="fixed w-full h-full top-0 left-0 -z-10">
          <Spotlight />
        </div>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <OfflineBanner />
          <InstallPrompt />
        </AuthProvider>
        <PWARegistration />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
