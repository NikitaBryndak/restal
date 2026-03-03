import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Наші менеджери",
  description:
    "Познайомтесь з командою досвідчених менеджерів RestAL. Оберіть свого персонального консультанта для планування подорожі.",
  openGraph: {
    title: "Наші менеджери | RestAL",
    description:
      "Познайомтесь з командою досвідчених менеджерів RestAL. Оберіть свого персонального консультанта.",
  },
};

export default function ManagersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
