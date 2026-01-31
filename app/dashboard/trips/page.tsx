import TripCard from "@/components/trip/trip-card"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"
import Trip from "@/models/trip"

export default async function TripsPage(){
    const session = await getServerSession(authOptions);

    if (!session?.user?.phoneNumber) {
        return <div>No trips. Please log in.</div>
    }

    await connectToDatabase();

    const trips = await Trip.find({ ownerPhone: session.user.phoneNumber }).sort({ createdAt: -1 }).lean();

    const tripCards = trips.map((trip: any) => (
        <Link href={`/dashboard/trips/${trip.number}`} key={trip._id.toString()}>
            <TripCard data={trip} />
        </Link>
    ));

    return (
        <div className="px-6">
            {tripCards.length ? <>{tripCards}</> : <p className="text-sm text-muted-foreground">You have no trips yet.</p>}
        </div>
    )
}