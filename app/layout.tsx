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
      <body className="flex antialiased min-h-screen flex-col w-full smooth-scroll">
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
