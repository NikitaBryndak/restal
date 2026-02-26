"use client";

import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { TOUR_STATUS_LABELS, TourStatus } from "@/types";
import { Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const statusDots: Record<string, string> = {
    "In Booking": "bg-yellow-400",
    "Booked": "bg-blue-400",
    "Paid": "bg-emerald-400",
    "In Progress": "bg-purple-400",
    "Completed": "bg-green-400",
    "Archived": "bg-gray-400",
};

export default function RecentlyViewed() {
    const { recentTrips } = useRecentlyViewed();

    if (recentTrips.length === 0) return null;

    return (
        <div>
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Нещодавно переглянуті
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {recentTrips.map((trip) => (
                    <Link key={trip.id} href={`/dashboard/trips/${trip.id}`}>
                        <div className="group relative rounded-2xl border border-white/5 overflow-hidden hover:border-white/15 transition-all duration-300 cursor-pointer">
                            <div className="absolute inset-0 bg-white/3 group-hover:bg-white/5 transition-colors duration-300" />
                            <div className="relative z-10 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${statusDots[trip.status] || "bg-white/30"}`} />
                                    <span className="text-[10px] text-white/40 uppercase">
                                        {TOUR_STATUS_LABELS[trip.status as TourStatus] || trip.status}
                                    </span>
                                </div>
                                <h3 className="text-sm font-semibold text-white">{trip.country}</h3>
                                <p className="text-xs text-white/30">#{trip.number}</p>
                                <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-accent absolute top-4 right-4 transition-colors duration-300" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
