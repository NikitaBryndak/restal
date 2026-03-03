import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cashback програма",
  description:
    "Отримуйте кешбек за кожну подорож з RestAL. Накопичуйте бонуси, запрошуйте друзів та заощаджуйте на наступних турах.",
  openGraph: {
    title: "Cashback програма | RestAL",
    description:
      "Отримуйте кешбек за кожну подорож з RestAL. Накопичуйте бонуси та заощаджуйте.",
    images: ["/og-image.png"],
  },
};

export default function CashbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
