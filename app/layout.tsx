import { AuthProvider } from "@/components/Providers";
import Footer from "../components/navigation/Footer";
import Navbar from "../components/navigation/Navbar";
import "./globals.css";
import { Spotlight } from "@/components/ui/spotlight-new";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body className="flex antialiased min-h-screen flex-col w-full smooth-scroll" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          {children}    
          <Footer />
        </AuthProvider>
        <div className="w-full z-0 pointer-events-none">
          <Spotlight />
        </div>
      </body>
    </html>
  );
}
