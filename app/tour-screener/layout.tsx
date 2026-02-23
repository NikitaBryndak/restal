import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Підбір туру",
  description:
    "Підберіть ідеальний тур онлайн. Пошук серед тисяч пропозицій з найкращими цінами — Туреччина, Єгипет, Мальдіви та інші напрямки.",
  openGraph: {
    title: "Підбір туру | RestAL",
    description:
      "Підберіть ідеальний тур онлайн. Пошук серед тисяч пропозицій з найкращими цінами.",
  },
};

export default function TourScreenerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
