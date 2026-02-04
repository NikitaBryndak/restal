"use client";

import Script from "next/script";
import { useEffect } from "react";

export default function TourScreenerPage() {
    useEffect(() => {
        // Set container references after DOM is ready
        if (typeof window !== 'undefined') {
            (window as any).osContainer = document.getElementById('os-result-container');
            (window as any).osTourContainer = document.getElementById('os-tour-container');
        }
    }, []);

    return (
        <div className="min-h-screen p-4 bg-background">
            {/* Inline script to set global variables BEFORE external scripts load */}
            <Script id="otpusk-config" strategy="beforeInteractive">
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
                    window.osContainer = 'os-result-container';
                    window.osTourContainer = 'os-tour-container';
                    window.osLang = 'ua';
                    window.osTourTargetBlank = false;
                    window.osOrderUrl = null;
                    window.osCurrency = 'converted';
                    window.osAutoStart = false;
                `}
            </Script>

            <Script
                src="https://api.otpusk.com/api/2.4/session?access_token=3f80a-01423-b3ca6-0bbab-1a284"
                strategy="beforeInteractive"
            />
            <Script
                src="https://export.otpusk.com/js/onsite/"
                strategy="afterInteractive"
                onLoad={() => {
                    // Re-assign containers after script loads, in case it needs DOM elements
                    if (typeof window !== 'undefined') {
                        (window as any).osContainer = document.getElementById('os-result-container');
                        (window as any).osTourContainer = document.getElementById('os-tour-container');
                    }
                }}
            />
            <Script
                src="https://export.otpusk.com/js/order"
                strategy="lazyOnload"
            />

            <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700&subset=cyrillic" rel="stylesheet" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/form.css" type="text/css" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/result.css" type="text/css" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/tour.css" type="text/css" />

            {/* Search form placeholder - the onsite script should inject form here */}
            <div id="otpusk-form-placeholder"></div>

            {/* Results container - search results will appear here */}
            <div id="os-result-container" className="mt-8"></div>

            {/* Tour details container */}
            <div id="os-tour-container" className="mt-8"></div>
        </div>
    );
}