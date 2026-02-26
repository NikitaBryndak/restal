import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import TripModel from "@/models/trip";
import UserModel from "@/models/user";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        if (!token || token.length < 16) {
            return NextResponse.json({ error: "Invalid token" }, { status: 400 });
        }

        await connectToDatabase();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const trip = await TripModel.findOne({ shareToken: token }).lean() as any;
        if (!trip) {
            return NextResponse.json({ error: "Trip not found or link expired" }, { status: 404 });
        }

        // Fetch manager name
        let managerName = "";
        if (trip.managerPhone) {
            const manager = await UserModel.findOne({ phoneNumber: trip.managerPhone })
                .select("name")
                .lean();
            managerName = (manager as { name?: string })?.name || "";
        }

        // Return ONLY safe public data (no personal documents, phone numbers, passport info)
        const safeTrip = {
            number: trip.number,
            country: trip.country,
            region: trip.region || "",
            status: trip.status,
            tripStartDate: trip.tripStartDate,
            tripEndDate: trip.tripEndDate,
            bookingDate: trip.bookingDate,
            flightInfo: {
                departure: {
                    airportCode: trip.flightInfo?.departure?.airportCode || "",
                    country: trip.flightInfo?.departure?.country || "",
                    date: trip.flightInfo?.departure?.date || "",
                    time: trip.flightInfo?.departure?.time || "",
                },
                arrival: {
                    airportCode: trip.flightInfo?.arrival?.airportCode || "",
                    country: trip.flightInfo?.arrival?.country || "",
                    date: trip.flightInfo?.arrival?.date || "",
                    time: trip.flightInfo?.arrival?.time || "",
                },
            },
            hotel: {
                name: trip.hotel?.name || "",
                checkIn: trip.hotel?.checkIn || "",
                checkOut: trip.hotel?.checkOut || "",
                food: trip.hotel?.food || "",
                nights: trip.hotel?.nights || 0,
                roomType: trip.hotel?.roomType || "",
            },
            touristCount: trip.tourists?.length || 0,
            addons: trip.addons || { insurance: false, transfer: false },
            managerName,
        };

        const response = NextResponse.json(safeTrip);
        response.headers.set("Cache-Control", "public, max-age=300, s-maxage=600");
        return response;
    } catch (error) {
        console.error("Error fetching shared trip:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
