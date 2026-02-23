import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ШІ Пошук турів",
  description:
    "Знайдіть ідеальний тур за допомогою штучного інтелекту. Розумний підбір подорожей за вашими побажаннями — країна, бюджет, дати та кількість людей.",
  openGraph: {
    title: "ШІ Пошук турів | RestAL",
    description:
      "Знайдіть ідеальний тур за допомогою штучного інтелекту. Розумний підбір подорожей за вашими побажаннями.",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
