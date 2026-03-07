import type { Metadata } from "next";
import Script from "next/script";

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
  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '4378063105804130');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=4378063105804130&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      {children}
    </>
  );
}
