'use client';

import Script from 'next/script';

export default function TourScreenerPage() {
    return (
        <div className="min-h-[800px] w-full bg-background p-4">
            <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700&subset=cyrillic" rel="stylesheet" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/form.css" type="text/css" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/result.css" type="text/css" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/tour.css" type="text/css" />

            {/* Container for the search form and results */}
            <div id="otpusk-container" className="otpusk-widget w-full"></div>

            {/* Container for tour details (if separate) */}
            <div id="otpusk-tour-container" className="otpusk-widget w-full mt-8"></div>

            <Script id="otpusk-config" strategy="afterInteractive">
                {`
                    window.osGeo = '';
                    window.osDefaultDeparture = 2025;
                    window.osDefaultDuration = '';
                    window.osDateFrom = '';
                    window.osDateTo = '';
                    window.osHotelCategory = '';
                    window.osFood = '';
                    window.osTransport = '';
                    window.osTarget = '';
                    window.osContainer = document.getElementById('otpusk-container');
                    window.osTourContainer = document.getElementById('otpusk-tour-container');
                    window.osLang = 'ua';
                    window.osTourTargetBlank = false;
                    window.osOrderUrl = null;
                    window.osCurrency = 'converted';
                    window.osAutoStart = false;
                `}
            </Script>

            <Script
                src="https://api.otpusk.com/api/2.4/session?access_token=3f80a-01423-b3ca6-0bbab-1a284"
                strategy="afterInteractive"
            />
            <Script src="https://export.otpusk.com/js/onsite/" strategy="afterInteractive" />
            <Script src="https://export.otpusk.com/js/order" strategy="afterInteractive" />
        </div>
    );
}