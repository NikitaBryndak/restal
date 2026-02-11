import SubNavbar from "@/components/navigation/SubDashboardNavbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="flex flex-1 flex-row mt-14 sm:mt-16 md:mt-20">
          <SubNavbar />
          <div className="flex-1 min-w-0">
            {children}
          </div>
      </div>
);
}
