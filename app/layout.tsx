import { AuthProvider } from "@/components/Providers";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          {children}    
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
