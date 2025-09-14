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
      <body className="flex antialiased min-h-screen flex-col w-full" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <div className="fixed w-full">
            <Spotlight />
          </div>
          {children}    
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
