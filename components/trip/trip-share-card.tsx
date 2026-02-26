"use client";

import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Download, Share2, X, Hotel, Calendar, Users, MapPin, Shield, Sparkles, Plane } from "lucide-react";
import html2canvas from "html2canvas-pro";

type TripShareCardProps = {
    country: string;
    region?: string;
    tripStartDate: string;
    tripEndDate: string;
    hotel: {
        name: string;
        nights: number;
        food: string;
    };
    flightInfo: {
        departure: { airportCode: string; date: string; time: string };
        arrival: { airportCode: string; date: string; time: string };
    };
    touristCount: number;
    addons: { insurance: boolean; transfer: boolean };
    status: string;
    countryImage: string;
};

// Country-specific accent colors for variety
const COUNTRY_PALETTES: Record<string, { from: string; to: string; accent: string }> = {
    "Туреччина": { from: "#e23744", to: "#ff6b35", accent: "#ff6b35" },
    "Єгипет": { from: "#d4a017", to: "#f4d03f", accent: "#f4d03f" },
    "Греція": { from: "#1e3a8a", to: "#3b82f6", accent: "#60a5fa" },
    "Мальдіви": { from: "#0891b2", to: "#22d3ee", accent: "#22d3ee" },
    "Балі": { from: "#059669", to: "#34d399", accent: "#34d399" },
    "Тайланд": { from: "#7c3aed", to: "#a78bfa", accent: "#a78bfa" },
    "ОАЕ": { from: "#b45309", to: "#fbbf24", accent: "#fbbf24" },
    "Іспанія": { from: "#dc2626", to: "#f97316", accent: "#f97316" },
    "Хорватія": { from: "#1d4ed8", to: "#6366f1", accent: "#818cf8" },
    "Кіпр": { from: "#0d9488", to: "#2dd4bf", accent: "#2dd4bf" },
};

const DEFAULT_PALETTE = { from: "#0fa4e6", to: "#6366f1", accent: "#0fa4e6" };

function getStatusEmoji(status: string) {
    switch (status) {
        case "In Booking": return "📋";
        case "Booked": return "✅";
        case "Paid": return "💳";
        case "In Progress": return "✈️";
        case "Completed": return "🏆";
        case "Archived": return "📁";
        default: return "✈️";
    }
}

function getStatusLabel(status: string) {
    const map: Record<string, string> = {
        "In Booking": "Бронювання",
        "Booked": "Заброньовано",
        "Paid": "Оплачено",
        "In Progress": "У подорожі",
        "Completed": "Завершено",
        "Archived": "В архіві",
    };
    return map[status] || status;
}

/** Wrapper that scales the fixed-size 440×780 card to fit narrow viewports */
function CardScaler({ children }: { children: ReactNode }) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        function calc() {
            if (!wrapperRef.current) return;
            const available = wrapperRef.current.parentElement?.clientWidth ?? 440;
            const s = Math.min(1, (available - 16) / 440); // 16px breathing room
            setScale(s);
        }
        calc();
        window.addEventListener("resize", calc);
        return () => window.removeEventListener("resize", calc);
    }, []);

    return (
        <div ref={wrapperRef} className="flex justify-center w-full" style={{ height: 780 * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
                {children}
            </div>
        </div>
    );
}

export default function TripShareCard({
    country,
    region,
    tripStartDate,
    tripEndDate,
    hotel,
    flightInfo,
    touristCount,
    addons,
    status,
    countryImage,
}: TripShareCardProps) {
    const [showModal, setShowModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPortalTarget(document.body);
    }, []);

    const palette = COUNTRY_PALETTES[country] || DEFAULT_PALETTE;

    const generateImage = useCallback(async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        setGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                width: 440,
                height: 780,
                windowWidth: 440,
                onclone: (_clonedDoc: Document, element: HTMLElement) => {
                    // Remove parent scale transform so content fills the full 440×780 canvas
                    let el: HTMLElement | null = element.parentElement;
                    while (el) {
                        el.style.transform = "none";
                        el = el.parentElement;
                    }
                },
            });
            return new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
            });
        } catch (err) {
            console.error("Failed to generate image:", err);
            return null;
        } finally {
            setGenerating(false);
        }
    }, []);

    const handleDownload = useCallback(async () => {
        const blob = await generateImage();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `restal-trip-${country}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, [generateImage, country]);

    const handleShare = useCallback(async () => {
        const blob = await generateImage();
        if (!blob) return;

        const file = new File([blob], `restal-trip-${country}.png`, { type: "image/png" });

        if (navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({
                    title: `Моя подорож до ${country}`,
                    text: `Подорож до ${country} з RestAL ✈️`,
                    files: [file],
                });
                return;
            } catch {
                // User cancelled or error — fall through to download
            }
        }
        // Fallback: download
        handleDownload();
    }, [generateImage, country, handleDownload]);

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/15 border border-accent/30 hover:bg-accent/25 transition-all cursor-pointer group"
            >
                <Share2 className="w-4 h-4 text-accent group-hover:text-accent/80 transition-colors" />
                <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                    Поділитися
                </span>
            </button>

            {/* Modal Overlay — rendered via portal to escape overflow-hidden ancestors */}
            {showModal && portalTarget && createPortal(
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4" onClick={() => setShowModal(false)}>
                    <div className="relative flex flex-col items-center gap-4 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Close — sticky at top so it's always visible */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="sticky top-0 self-end z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* ======== THE CARD ======== */}
                        <CardScaler>
                        <div
                            ref={cardRef}
                            style={{
                                width: 440,
                                height: 780,
                                background: "#000000",
                                fontFamily: "'Arial', 'Helvetica', sans-serif",
                                fontWeight: 600,
                            }}
                            className="relative overflow-hidden rounded-2xl shrink-0"
                        >
                            {/* Top accent line — matching site accent */}
                            <div
                                style={{ backgroundColor: "#0fa4e6" }}
                                className="absolute top-0 left-0 right-0 h-[1.5px]"
                            />

                            {/* Content */}
                            <div className="relative z-10 flex flex-col h-full p-7 pt-8">
                                {/* Header — Logo + Status */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src="/logo.png"
                                            alt="RestAL"
                                            className="w-9 h-9 object-contain"
                                            crossOrigin="anonymous"
                                        />
                                        <span
                                            className="text-xl font-bold tracking-tight"
                                            style={{ fontFamily: '"Century Gothic", sans-serif', color: "#ffffff" }}
                                        >
                                            RestAL
                                        </span>
                                    </div>
                                </div>

                                {/* Country Image */}
                                <div className="relative h-44 rounded-xl overflow-hidden mb-5">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={countryImage}
                                        alt={country}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <p
                                            className="text-3xl font-extrabold text-white tracking-tight leading-tight"
                                            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
                                        >
                                            {country}
                                        </p>
                                        {region && (
                                            <p className="text-sm text-white/70 mt-0.5">{region}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Big Stats — Dates */}
                                <div className="flex gap-3 mb-5">
                                    <div className="flex-1 rounded-xl p-3.5 border border-white/6" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <Calendar className="w-3.5 h-3.5" style={{ color: palette.accent }} />
                                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Початок</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">{tripStartDate}</p>
                                    </div>
                                    <div className="flex-1 rounded-xl p-3.5 border border-white/6" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <Calendar className="w-3.5 h-3.5" style={{ color: palette.accent }} />
                                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Кінець</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">{tripEndDate}</p>
                                    </div>
                                </div>

                                {/* Flight Route */}
                                <div className="rounded-xl p-4 border border-white/6 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                                    <div className="flex items-center justify-between">
                                        <div className="text-center">
                                            <p className="text-2xl font-extrabold text-white">{flightInfo.departure.airportCode || "—"}</p>
                                            <p className="text-[10px] text-white/40 mt-0.5">{flightInfo.departure.time || ""}</p>
                                        </div>
                                        <div className="flex-1 mx-4 flex items-center">
                                            <div className="flex-1 h-px" style={{ backgroundColor: `${palette.accent}40` }} />
                                            <Plane className="w-4 h-4 mx-2 rotate-45" style={{ color: palette.accent }} />
                                            <div className="flex-1 h-px" style={{ backgroundColor: `${palette.accent}40` }} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-extrabold text-white">{flightInfo.arrival.airportCode || "—"}</p>
                                            <p className="text-[10px] text-white/40 mt-0.5">{flightInfo.arrival.time || ""}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Hotel + Details */}
                                <div className="flex gap-3 mb-4">
                                    <div className="flex-1 rounded-xl p-3.5 border border-white/6" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                                        <Hotel className="w-4 h-4 mb-2" style={{ color: palette.accent }} />
                                        <p className="text-sm font-bold text-white leading-snug line-clamp-2">{hotel.name || "—"}</p>
                                        <p className="text-xs text-white/40 mt-1">{hotel.nights} ночей · {hotel.food}</p>
                                    </div>
                                    <div className="flex-col flex gap-2 w-28">
                                        <div className="flex-1 rounded-xl p-3 border border-white/6 flex items-center gap-2" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                                            <Users className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accent }} />
                                            <span className="text-sm font-bold text-white">{touristCount}</span>
                                        </div>
                                        <div className="flex-1 rounded-xl p-3 border border-white/6 flex flex-wrap gap-1.5" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                                            {addons.insurance && (
                                                <Shield className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
                                            )}
                                            {addons.transfer && (
                                                <MapPin className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
                                            )}
                                            {!addons.insurance && !addons.transfer && (
                                                <span className="text-[10px] text-white/30">—</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: "#0fa4e6" }}
                                        />
                                        <span className="text-[10px] text-white/30 font-medium tracking-wider uppercase">
                                            restal.in.ua
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        </CardScaler>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleDownload}
                                disabled={generating}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                <Download className="w-4 h-4 text-white" />
                                <span className="text-sm font-medium text-white">
                                    {generating ? "Генеруємо..." : "Зберегти"}
                                </span>
                            </button>
                            <button
                                onClick={handleShare}
                                disabled={generating}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-accent/25"
                            >
                                <Share2 className="w-4 h-4" />
                                {generating ? "Генеруємо..." : "Поділитися"}
                            </button>
                        </div>
                    </div>
                </div>,
                portalTarget
            )}
        </>
    );
}
