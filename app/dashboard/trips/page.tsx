import TripCard from "@/components/trip/trip-card"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import Trip from "@/models/trip"

export default async function TripsPage(){
    const session = (await getServerSession(authOptions as any)) as any;

    if (!session?.user?.email) {
        // If there's no session, render empty state (user should be redirected by higher-level layout)
        return <div>No trips. Please log in.</div>
    }

    await connectToDatabase();

    // Fetch trips that belong to the logged-in user, sorted by createdAt desc
    const trips = await Trip.find({ ownerEmail: session.user.email }).sort({ createdAt: -1 }).lean();

    const tripCards = trips.map((trip: any) => (
        <Link href={`/dashboard/trips/${trip.number}`} key={trip._id.toString()}>
            <TripCard data={trip} />
        </Link>
    ));

    return (
        <div>
            {tripCards.length ? <>{tripCards}</> : <p className="text-sm text-muted-foreground">You have no trips yet.</p>}
        </div>
    )
}