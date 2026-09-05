import TripCard from "@/components/trip/trip-card"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Trip from "@/models/trip"
import ReviewModel from "@/models/review"

const REVIEWABLE_STATUSES = ["Completed", "Archived"];

export default async function TripsPage(){
    const session = await getServerSession(authOptions);

    if (!session?.user?.phoneNumber) {
        return <div>Немає подорожей. Будь ласка, увійдіть.</div>;
    }

    await connectToDatabase();

    const userPhone = session.user.phoneNumber;
    const trips: any[] = await Trip.find({
        $or: [
            { ownerPhone: userPhone },
            { managerPhone: userPhone }
        ]
    }).sort({ createdAt: -1 }).lean();

    // Review nudge: owned, finished trips that have a share link and no review yet.
    const nudgable = trips.filter(
        (t) => t.ownerPhone === userPhone && REVIEWABLE_STATUSES.includes(t.status) && t.shareToken
    );
    let reviewedIds = new Set<string>();
    if (nudgable.length > 0) {
        const rows = await ReviewModel.find({ tripId: { $in: nudgable.map((t) => t._id) } }).select("tripId").lean();
        reviewedIds = new Set(rows.map((r) => String(r.tripId)));
    }

    return (
        <div className="px-3 sm:px-6 pt-4 sm:pt-0">
            {trips.length ? trips.map((trip) => (
                <div key={String(trip._id)}>
                    <Link href={`/dashboard/trips/${trip.number}`}>
                        <TripCard data={trip} />
                    </Link>
                    {nudgable.includes(trip) && !reviewedIds.has(String(trip._id)) && (
                        <div className="-mt-4 mb-6 flex justify-end">
                            <Link href={`/shared/trip/${trip.shareToken}`} className="text-xs sm:text-sm text-emerald-300/90 hover:text-emerald-200 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors">
                                ⭐ Залишити відгук
                            </Link>
                        </div>
                    )}
                </div>
            )) : <p className="text-sm text-muted-foreground">У вас ще немає подорожей.</p>}
        </div>
    )
}