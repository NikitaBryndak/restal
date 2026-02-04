"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

export default function TourScreenerPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const tourContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize global variables required by the script
        if (typeof window !== 'undefined') {
            (window as any).osGeo = ''; /* Страна, курорт или отель по умолчанию в форме поиска */
            (window as any).osDefaultDeparture = 2025; /* ID города отправления */
            (window as any).osDefaultDuration = ''; /* Длительность тура в днях */
            (window as any).osDateFrom = ''; /* Начало тура «от» */
            (window as any).osDateTo = ''; /* Начало тура «до» */
            (window as any).osHotelCategory = ''; /* Категория отеля */
            (window as any).osFood = ''; /* Питание */
            (window as any).osTransport = ''; /* Транспорт */
            (window as any).osTarget = ''; /* URL страницы результатов */
            (window as any).osContainer = containerRef.current; /* DIV для результатов */
            (window as any).osTourContainer = tourContainerRef.current; /* DIV для тура */
            (window as any).osLang = 'ua'; /* Язык интерфейса */
            (window as any).osTourTargetBlank = false; /* Открывать в новом окне? */
            (window as any).osOrderUrl = null; /* Вместо формы заказа */
            (window as any).osCurrency = 'converted'; /* Валюта */
            (window as any).osAutoStart = false; /* Автостарт поиска */
        }
    }, []);

    return (
        <div className="min-h-screen p-4 bg-background">
            <Script
                src="https://api.otpusk.com/api/2.4/session?access_token=3f80a-01423-b3ca6-0bbab-1a284"
                strategy="beforeInteractive"
            />
            <Script
                src="https://export.otpusk.com/js/onsite/"
                strategy="afterInteractive"
            />
            <Script
                src="https://export.otpusk.com/js/order"
                strategy="lazyOnload"
            />

            <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700&subset=cyrillic" rel="stylesheet" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/form.css" type="text/css" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/result.css" type="text/css" />
            <link rel="stylesheet" href="https://export.otpusk.com/os/onsite/tour.css" type="text/css" />

            {/* This is likely where the search form will appear if the script injects it automatically,
                or we need to provide a container if osContainer is used.
                Based on documentation of such modules, they often look for a script tag position or a specific container.
                Since we set osContainer to containerRef, the results should appear there.
                But where does the FORM appear?
                Usually 'onsite/' script renders the form immediately.
            */}

            <div id="otpusk-form-placeholder"></div>

            <div ref={containerRef} id="result-container" className="mt-8"></div>
            <div ref={tourContainerRef} id="tour-container" className="mt-8"></div>
        </div>
    );
}