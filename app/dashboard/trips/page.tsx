import TripCard from "@/components/trip/trip-card"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Trip from "@/models/trip"

export default async function TripsPage(){
    const session = await getServerSession(authOptions);

    if (!session?.user?.phoneNumber) {
        return <div>Немає подорожей. Будь ласка, увійдіть.</div>
    }

    await connectToDatabase();

    const userPhone = session.user.phoneNumber;
    const trips = await Trip.find({
        $or: [
            { ownerPhone: userPhone },
            { managerPhone: userPhone }
        ]
    }).sort({ createdAt: -1 }).lean();

    const tripCards = trips.map((trip: any) => (
        <Link href={`/dashboard/trips/${trip.number}`} key={trip._id.toString()}>
            <TripCard data={trip} />
        </Link>
    ));

    return (
        <div className="px-3 sm:px-6 pt-4 sm:pt-0">
            {tripCards.length ? <>{tripCards}</> : <p className="text-sm text-muted-foreground">У вас ще немає подорожей.</p>}
        </div>
    )
}