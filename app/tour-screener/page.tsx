"use client";

import Script from "next/script";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useEffect, useRef } from "react";

export default function TourScreenerPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const tourContainerRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        // Prevent double initialization in React StrictMode
        if (initializedRef.current) return;
        initializedRef.current = true;

        // Define global variables expected by the script
        const win = window as any;
        win.osGeo = '';
        win.osDefaultDeparture = 2025;
        win.osDefaultDuration = '';
        win.osDateFrom = '';
        win.osDateTo = '';
        win.osHotelCategory = '';
        win.osFood = '';
        win.osTransport = '';
        win.osTarget = '';
        // Explicitly set the container elements
        win.osContainer = containerRef.current;
        win.osTourContainer = tourContainerRef.current;

        win.osLang = 'ua';
        win.osTourTargetBlank = false;
        win.osOrderUrl = null;
        win.osCurrency = 'converted';
        win.osAutoStart = false;

        // Keep track of loaded scripts for cleanup
        const scripts: HTMLScriptElement[] = [];

        // Function to dynamically load a script
        const loadScript = (src: string, container: HTMLElement | null = document.body) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve(script);
                script.onerror = () => reject(new Error(`Failed to load ${src}`));

                if (container) {
                    container.appendChild(script);
                } else {
                    document.body.appendChild(script);
                }
                scripts.push(script);
            });
        };

        const initScripts = async () => {
            try {
                // 1. Session script
                await loadScript("https://api.otpusk.com/api/2.4/session?access_token=3f80a-01423-b3ca6-0bbab-1a284");

                // 2. Onsite script
                await loadScript("https://export.otpusk.com/js/onsite/", containerRef.current);

                // 3. Order script
                await loadScript("https://export.otpusk.com/js/order");
            } catch (error) {
                console.error("Error loading tour screener scripts:", error);
            }
        };

        // Initialize
        if (containerRef.current && tourContainerRef.current) {
            initScripts();
        }

        // No cleanup - widget creates global state that can't be cleanly removed
    }, []);

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700&subset=cyrillic"
                rel="stylesheet"
            />
            <link
                rel="stylesheet"
                href="https://export.otpusk.com/os/onsite/form.css"
                type="text/css"
            />
            <link
                rel="stylesheet"
                href="https://export.otpusk.com/os/onsite/result.css"
                type="text/css"
            />
            <link
                rel="stylesheet"
                href="https://export.otpusk.com/os/onsite/tour.css"
                type="text/css"
            />

            <main className="min-h-screen w-full flex flex-col items-center px-4 py-16 sm:py-24">
<style dangerouslySetInnerHTML={{ __html: `
/* --- GLOBAL WIDGET OVERRIDES FOR DARK THEME --- */

/* 1. General Container & Reset */
#otpusk-container *, #otpusk-tour-container *, .new_os *, .new_r-container * {
    font-family: inherit !important;
}

/* 2. Form Fields (Inputs) */
#otpusk-container .new_f-form-field,
.new_f-form-field {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
}
#otpusk-container .new_f-form-field:hover,
.new_f-form-field:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
}
#otpusk-container .new_f-autocomplete-input,
#otpusk-container input,
#otpusk-container .new_f-dropdown-btn span,
.new_f-autocomplete-input,
.new_f-dropdown-btn span {
    color: #fff !important;
}
#otpusk-container .new_f-autocomplete-input::placeholder,
.new_f-autocomplete-input::placeholder {
    color: rgba(255,255,255,0.5) !important;
}

/* 3. Dropdowns (Popups) - STRONGER SELECTORS */
.new_f-dropdown-body,
.new_f-dropdown-body.popup,
#ctyList,
#cntList,
.ui-autocomplete,
.new_f-dropdown-list {
    background-color: #1a1a1a !important;
    border: 1px solid #333 !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
    color: #fff !important;
}

/* List Items in Dropdowns - STRONGER */
.new_f-dropdown-item,
.ui-menu-item,
.ui-menu-item a,
.ui-menu-item .label,
.ui-menu-item .price-from,
#ctyList li,
#ctyList li label,
#ctyList .labelName,
#cntList li,
#cntList li a,
#cntList .ui-corner-all,
#new_os-to .ui-menu .ui-menu-item .label,
#new_os-to .ui-menu .ui-menu-item .noplace {
    background-color: transparent !important;
    color: #ddd !important;
}

/* Hover states for dropdowns */
.new_f-dropdown-item:hover,
.new_f-dropdown-item.selected,
#ctyList li:hover,
#ctyList li label:hover,
#cntList li:hover,
.ui-menu-item a:hover,
.ui-menu-item.active a,
.ui-state-focus,
#new_os-to .ui-menu .ui-menu-item .ui-corner-all:hover,
#new_os-to .ui-menu .ui-menu-item .ui-state-focus {
    background-color: #333 !important;
    color: #fff !important;
}
#ctyList li:hover .labelName,
#ctyList li:hover .itemPrice,
#cntList li:hover .label {
    background-color: #333 !important;
    color: #fff !important;
}

/* Resort list background fix */
#ctyList,
#ctyList .ctyLists-wrapper {
    background-color: #1a1a1a !important;
}
#ctyList .new_f-dropdown-body-bottom {
    background-color: #222 !important;
}

/* 4. CHECKBOXES (The blue/white squares) */
[class*='new_f-'] input[type="checkbox"] + *::before {
    background-color: #2a2a2a !important;
    border: 1px solid #555 !important;
}
[class*='new_f-'] input[type="checkbox"]:checked + *::before {
    background-color: #0fa4e6 !important;
    border-color: #0fa4e6 !important;
}
[class*='new_f-'] input[type="checkbox"]:checked + *::after {
    filter: invert(1) brightness(2) !important;
}

/* 5. Datepicker (Global UI) */
#ui-datepicker-div,
.new_f-dropdown-body-date,
.new_f-dates-container .dp-container {
    background-color: #1a1a1a !important;
    border: 1px solid #333 !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
    z-index: 9999 !important;
}
#ui-datepicker-div .ui-datepicker-header,
.new_f-dropdown-body-top {
    background: #222 !important;
    border-bottom: 1px solid #333 !important;
    color: #fff !important;
}
#ui-datepicker-div .ui-datepicker-title {
    color: #0fa4e6 !important;
}
#ui-datepicker-div th {
    color: #888 !important;
}
#ui-datepicker-div .ui-datepicker-calendar td {
    background-color: #222 !important;
    border: 1px solid #333 !important;
}
#ui-datepicker-div .ui-datepicker-calendar td a,
#ui-datepicker-div .ui-datepicker-calendar td span {
    color: #ddd !important;
    background: transparent !important;
    text-align: center !important;
}
#ui-datepicker-div .ui-datepicker-calendar td.ui-state-highlight,
#ui-datepicker-div .ui-datepicker-calendar td.ui-state-active,
#ui-datepicker-div .ui-datepicker-calendar td:hover {
    background-color: #0fa4e6 !important;
}
#ui-datepicker-div .ui-datepicker-calendar td.ui-state-active a,
#ui-datepicker-div .ui-datepicker-calendar td:hover a {
    color: #fff !important;
    font-weight: bold !important;
}
#ui-datepicker-div .ui-datepicker-calendar td.ui-state-disabled span {
    color: #444 !important;
}

/* 6. SEARCH RESULTS - COMPREHENSIVE FIX */
/* Main results container */
.new_r-container,
.new_r-wrapper {
    background: transparent !important;
}

/* Result Card */
.new_r-item {
    background-color: #1a1a1a !important;
    border: 1px solid #333 !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
    margin-bottom: 20px !important;
}
.new_r-item:hover {
    border-color: #0fa4e6 !important;
}
/* Result card body */
.new_r-item-body {
    background-color: #1a1a1a !important;
    border-color: transparent !important;
}
/* Texts */
.new_r-item-hotel {
    color: #fff !important;
}
.new_r-item-geo,
.new_r-item-geo span,
.new_r-item-info,
.new_r-item-from,
.new_r-item-date,
.new_r-item-food {
    color: #bbb !important;
}
/* Stars */
.new_r-item-star {
    fill: #ffca1e !important;
}
/* Price */
.new_r-item-price {
    background-color: #0fa4e6 !important;
    border-color: #0fa4e6 !important;
    color: #fff !important;
}
/* Ratings bubble */
.new_r-item-rating-container {
    background-color: #333 !important;
}
.new_r-item-rating-container::after {
    background-color: #1a1a1a !important;
}
.new_r-item-rating-value,
.new_r-item-rating-rev {
    color: #fff !important;
}

/* Show More Button */
.new_r-show-more-results {
    background-color: #1a1a1a !important;
    border: 1px solid #0fa4e6 !important;
    color: #0fa4e6 !important;
}
.new_r-show-more-results:hover {
    background-color: #0fa4e6 !important;
    color: #fff !important;
}

/* Loader/Spinner */
.new_spinner-wrap {
    color: #fff !important;
}
.new_progressbar-text,
.new_progressbar-text span {
    color: #fff !important;
}
.new_progress-container {
    background-color: #333 !important;
}
.new_logo-bl {
    filter: brightness(0.8) !important;
}

/* Filters */
.new_r-panel {
    color: #fff !important;
}
.new_r-filters-title {
    color: #fff !important;
    background-color: transparent !important;
}
.new_r-filter {
    background-color: #2a2a2a !important;
    border: 1px solid #444 !important;
    color: #ddd !important;
}
.new_r-filter-label {
    color: #aaa !important;
}
.new_r-filter-value {
    color: #0fa4e6 !important;
}
.new_r-filter-reset {
    color: #888 !important;
}
.new_r-filters-reset {
    color: #0fa4e6 !important;
}

/* Currency Switch */
.new_r-currency-switch label input + span {
    background-color: #333 !important;
    color: #888 !important;
    box-shadow: none !important;
}
.new_r-currency-switch label input:checked + span {
    background-color: #0fa4e6 !important;
    color: #fff !important;
}

/* Info messages */
.new_result-info,
.new_result-info .new_result-span {
    background-color: #2a2a2a !important;
    color: #fff !important;
}
.new_result-info a {
    color: #0fa4e6 !important;
}

/* Not found message */
.new_not-found-message,
.new_not-found-message .new_not-found-text {
    background-color: #333 !important;
    color: #fff !important;
    border: 1px solid #444 !important;
}

/* Hide Default Images/Backgrounds */
.new_f-wrapper-bg-imgs {
    display: none !important;
}
.new_f-container {
    background: transparent !important;
}

/* Extended Search Panel */
.new_f-ext-container {
    background-color: #151515 !important;
    border: 1px solid #333 !important;
    margin-top: 10px !important;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.3) !important;
}
.new_f-ext-container::before {
    display: none !important;
}
.new_f-ext-bl-title {
    color: #0fa4e6 !important;
}
.new_f-ext-bl label {
    color: #ccc !important;
}
.new_f-ext-scale-item {
    color: #888 !important;
}
/* Slider */
.ui-slider-handle {
    background: #0fa4e6 !important;
    border-color: #fff !important;
}
.ui-slider-range {
    background: #0fa4e6 !important;
}
.new_f-ext-bl-price .slider-container input {
    color: #fff !important;
    background: transparent !important;
}
`}} />
                <div className="w-full max-w-6xl mx-auto">
                    <div className="text-center mb-8 sm:mb-12">
                        <TextGenerateEffect
                            words="Пошук турів"
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 sm:mb-6"
                            accentWords={["турів"]}
                            accentClassName="text-accent font-bold"
                        />
                        <p className="text-secondary text-base sm:text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
                            Знайдіть найкращі пропозиції від провідних туроператорів. Оберіть напрямок, дати та параметри вашої подорожі.
                        </p>
                    </div>

                    {/* Tour Search Container */}
                    <div
                        ref={containerRef}
                        id="otpusk-container"
                        className="w-full min-h-[300px]"
                    />

                    {/* Tour Details Container */}
                    <div
                        ref={tourContainerRef}
                        id="otpusk-tour-container"
                        className="w-full mt-6"
                    />
                </div>
            </main>
        </>
    );
}