import { AuthProvider } from "@/components/Providers";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "./globals.css";
import { Spotlight } from "@/components/ui/spotlight-new";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
      <Spotlight />
        <AuthProvider>
          <Navbar />
          {children}    
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
