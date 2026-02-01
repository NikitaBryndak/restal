import { AuthProvider } from "@/components/Providers";
import Footer from "../components/navigation/Footer";
import Navbar from "../components/navigation/Navbar";
import "./globals.css";
import { Spotlight } from "@/components/ui/spotlight-new";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://restal.in.ua"), // Update with your actual domain
  title: {
    default: "RestAL",
    template: "%s | RestAL",
  },
  description:
    "Перетворюємо мрії про подорожі на реальність. Ваш комфорт — наш пріоритет. Повний супровід 24/7, глибока експертиза в напрямках та увага до кожної деталі вашої відпустки. Забронюйте тур онлайн!",
  keywords: [
    "Надійність", "безпека", "експертність"
  ],
  authors: [{ name: "RestAL" }],
  creator: "RestAL",
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: "https://restal.in.ua",
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
    apple: "/logo.png",
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
        </AuthProvider>
      </body>
    </html>
  );
}
