import { AuthProvider } from "@/components/Providers";
import Footer from "../components/navigation/Footer";
import Navbar from "../components/navigation/Navbar";
import "./globals.css";
import { Spotlight } from "@/components/ui/spotlight-new";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://restall.com"), // Update with your actual domain
  title: {
    default: "RestAll",
    template: "%s | RestAll",
  },
  description:
    "RestAll - Your ultimate travel companion. Discover amazing tours, packages, and travel experiences.",
  keywords: [
    "travel",
    "tours",
    "vacation",
    "packages",
    "trips",
    "travel companion",
    "holiday",
  ],
  authors: [{ name: "RestAll" }],
  creator: "RestAll",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://restall.com",
    siteName: "RestAll",
    title: "RestAll - Your Travel Companion",
    description:
      "Discover amazing tours, packages, and travel experiences with RestAll.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "RestAll",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RestAll - Your Travel Companion",
    description:
      "Discover amazing tours, packages, and travel experiences with RestAll.",
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
    <html lang="en">
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
