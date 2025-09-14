import { AuthProvider } from "@/components/Providers";
import Footer from "../components/Footer";
import Navbar from "../components/navigation/Navbar";
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
        <div className="fixed w-full"><Spotlight /></div>
        <AuthProvider>
          <Navbar />
          {children}    
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
