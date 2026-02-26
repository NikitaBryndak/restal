"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

type Props = {
    tripId: string;
    country: string;
    number: string;
    status: string;
};

export default function TrackTripView({ tripId, country, number, status }: Props) {
    const { addTrip } = useRecentlyViewed();

    useEffect(() => {
        addTrip({ id: tripId, country, number, status });
    }, [tripId, country, number, status, addTrip]);

    return null; // invisible tracker
}
