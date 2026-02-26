"use client";

import { useEffect, useState, useCallback } from "react";

type RecentTrip = {
    id: string;       // trip number or _id
    country: string;
    number: string;
    status: string;
    viewedAt: number;
};

const STORAGE_KEY = "restal_recently_viewed";
const MAX_ITEMS = 6;

export function useRecentlyViewed() {
    const [items, setItems] = useState<RecentTrip[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch {
            // ignore parse errors
        }
    }, []);

    const addTrip = useCallback((trip: Omit<RecentTrip, "viewedAt">) => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            let list: RecentTrip[] = stored ? JSON.parse(stored) : [];

            // Remove existing entry for this trip
            list = list.filter((t) => t.id !== trip.id);

            // Add to front
            list.unshift({ ...trip, viewedAt: Date.now() });

            // Trim
            if (list.length > MAX_ITEMS) list = list.slice(0, MAX_ITEMS);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            setItems(list);
        } catch {
            // ignore
        }
    }, []);

    return { recentTrips: items, addTrip };
}
