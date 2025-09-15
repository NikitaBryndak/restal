import SubNavbar from "@/components/navigation/SubNavbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body className="flex antialiased min-h-screen flex-col w-full smooth-scroll" suppressHydrationWarning>
          <SubNavbar />
          {children}    
      </body>
    </html>
  );
}
