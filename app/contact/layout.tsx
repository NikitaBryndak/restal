import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Зв'яжіться з турагенцією RestAL — телефон, email, месенджери. Ми на зв'язку 24/7 для планування вашої ідеальної подорожі.",
  openGraph: {
    title: "Контакти | RestAL",
    description:
      "Зв'яжіться з турагенцією RestAL — телефон, email, месенджери. Ми на зв'язку 24/7.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
