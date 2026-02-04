"use client";

import Script from "next/script";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useEffect, useRef } from "react";

export default function TourScreenerPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const tourContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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

                // If specific container is provided and valid, append there. Otherwise body.
                // Appending the main widget script to the container helps if it falls back to script location.
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
                // 1. Session script (Append to body)
                await loadScript("https://api.otpusk.com/api/2.4/session?access_token=3f80a-01423-b3ca6-0bbab-1a284");

                // 2. Onsite script (Append to the container div directly to ensure position)
                // We pass containerRef.current to append the script TAG inside the container.
                // The script execution will likely render the widget nearby or use the osContainer variable.
                await loadScript("https://export.otpusk.com/js/onsite/", containerRef.current);

                // 3. Order script (Append to body)
                await loadScript("https://export.otpusk.com/js/order");
            } catch (error) {
                console.error("Error loading tour screener scripts:", error);
            }
        };

        // Initialize
        if (containerRef.current && tourContainerRef.current) {
             initScripts();
        }

        return () => {
            // Cleanup scripts
            scripts.forEach(script => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            });
            // Also try to clean up the generated content if possible,
            // though the widgets might leave leftovers.
            // When the component unmounts, the container divs are removed, so that handles most visual cleanup.
        };
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
/* --- Heavy Overrides for Otpusk Widget to match Dark Theme --- */

/* 1. General Container & Text */
#otpusk-container .new_f-container,
#otpusk-container .new_os {
    font-family: inherit !important;
    color: #ffffff !important;
}

/* Remove default gradients and backgrounds */
#otpusk-container .new_f-container {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
}

/* 2. Input Fields Styling */
#otpusk-container .new_f-form-field {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    box-shadow: none !important;
    transition: all 0.2s ease !important;
    border-radius: 0 !important; /* Reset radius for middle items */
}

/* Field corners - First and Last */
#otpusk-container .new_f-form-field:first-child {
    border-top-left-radius: 12px !important;
    border-bottom-left-radius: 12px !important;
}
/* The submit button is usually the last, but let's check field types */
#otpusk-container .new_f-form-field.people {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important; /* Because button is properly separate or next to it */
}

#otpusk-container .new_f-form-field:hover,
#otpusk-container .new_f-form-field:focus-within {
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
}

/* Text Colors in Inputs */
#otpusk-container .new_f-autocomplete-input,
#otpusk-container .new_f-dropdown-btn,
#otpusk-container .new_f-dropdown-btn span,
#otpusk-container input {
    color: #ffffff !important;
    font-family: inherit !important;
}

#otpusk-container .new_f-autocomplete-input::placeholder {
    color: rgba(255, 255, 255, 0.5) !important;
}

/* Remove vertical separators */
#otpusk-container .new_f-form-field::before {
    display: none !important;
    background-color: rgba(255, 255, 255, 0.1) !important;
    /* If we want separators, uncomment and adjust color: */
    /* display: block !important; */
}

/* 3. Dropdowns & Popups */
.new_f-dropdown-body,
.new_f-dropdown-body.popup,
#ctyList,
#cntList,
.ui-autocomplete {
    background-color: #1a1a1a !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
    border-radius: 12px !important;
    color: #fff !important;
}

/* Dropdown Items */
.new_f-dropdown-item,
.ui-menu-item a,
#ctyList li,
#cntList li {
    color: #e0e0e0 !important;
    background-color: transparent !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.new_f-dropdown-item:hover,
.ui-menu-item a:hover,
#ctyList li:hover,
#cntList li:hover,
.ui-state-focus,
.ui-state-active,
.new_f-dropdown-item.selected {
    background-color: rgba(15, 164, 230, 0.2) !important; /* Accent with opacity */
    color: #fff !important;
}

/* Specific Dropdown Headers/Footers */
#ctyList .new_f-dropdown-body-bottom,
.new_f-dropdown-body-top {
    background-color: #222 !important;
    color: #fff !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* 4. Submit Button */
#otpusk-container .new_f-form .new_f-form-submit,
#otpusk-container .os-order-form-submit_button {
    background: #0fa4e6 !important; /* Site accent */
    color: #fff !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    border-radius: 0 12px 12px 0 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 0 20px rgba(15, 164, 230, 0.3) !important;
}

#otpusk-container .new_f-form .new_f-form-submit:hover {
    background: #0d8bc3 !important;
    box-shadow: 0 0 30px rgba(15, 164, 230, 0.5) !important;
}

/* 5. Datepicker / Calendar */
.new_f-dates-container#new_f-dates-container .dp-container {
    background-color: #1a1a1a !important;
    border-radius: 12px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.new_f-dates-container#new_f-dates-container #ui-datepicker-div {
    background-color: #1a1a1a !important;
}
.new_f-dates-container#new_f-dates-container #ui-datepicker-div .ui-datepicker-header {
    color: #0fa4e6 !important; /* header text accent */
}
.new_f-dates-container#new_f-dates-container #ui-datepicker-div th {
    color: #888 !important;
}
.new_f-dates-container#new_f-dates-container #ui-datepicker-div .ui-datepicker-calendar td {
    background: #222 !important;
    border: 1px solid #333 !important;
}
.new_f-dates-container#new_f-dates-container #ui-datepicker-div .ui-datepicker-calendar td a,
.new_f-dates-container#new_f-dates-container #ui-datepicker-div .ui-datepicker-calendar td span {
    color: #fff !important;
}
.new_f-dates-container#new_f-dates-container #ui-datepicker-div .ui-datepicker-calendar td.ui-state-highlight,
.new_f-dates-container#new_f-dates-container #ui-datepicker-div .ui-datepicker-calendar td.ui-state-active {
    background-color: #0fa4e6 !important;
}
.new_f-dates-container#new_f-dates-container #ui-datepicker-div .ui-datepicker-calendar td.ui-state-active a {
    color: #fff !important;
    font-weight: bold !important;
}

/* 6. Icons & Arrows */
#otpusk-container .new_f-dropdown-btn .cnt,
#otpusk-container .new_f-dropdown-btn::after {
    border-color: rgba(255,255,255,0.5) transparent transparent !important;
    /* Optional: Replace with SVG or filter if needed, but border hack works for arrows */
}
#otpusk-container .new_f-dropdown-btn .cnt {
    background: transparent !important;
}

/* 7. Hide "Compass" and "Plane" background images */
#otpusk-container .new_f-wrapper-bg-imgs {
    background: none !important;
    display: none !important;
}
#otpusk-container .new_f-ext-container {
    background: #1a1a1a !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    padding-top: 20px !important;
}

/* 8. Labels inside extended search */
.new_f-ext-bl label {
    color: #ccc !important;
}
.new_f-ext-bl-title {
    color: #0fa4e6 !important;
}

/* 9. Checkboxes/Radio custom style fix */
[class*='new_f-'] input[type="checkbox"] + *::before {
    background-color: #333 !important;
    border-color: #555 !important;
}
[class*='new_f-'] input[type="checkbox"]:checked + *::after {
    /* Checkmark color or background */
    filter: invert(1) !important;
}
[class*='new_f-'] input[type="checkbox"]:checked + *::before {
    background-color: #0fa4e6 !important;
    border-color: #0fa4e6 !important;
}


/* Make sure result container text is readable if results load */
#otpusk-tour-container {
    color: #fff !important;
}
#otpusk-tour-container .result-item {
    background: #1a1a1a !important;
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