import { Plane, Calendar, Hotel, Shield, Car, Users, MapPin } from "lucide-react";
import Image from "next/image";
import { connectToDatabase } from "@/lib/mongodb";
import TripModel from "@/models/trip";
import UserModel from "@/models/user";
import { TOUR_STATUS_LABELS, TourStatus } from "@/types";
import { getCountryImageName } from "@/data";
import type { Metadata } from "next";

const statusColors: Record<TourStatus, string> = {
    "In Booking": "bg-yellow-500/20 text-yellow-300 border-yellow-400/40",
    "Booked": "bg-blue-500/20 text-blue-300 border-blue-400/40",
    "Paid": "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    "In Progress": "bg-purple-500/20 text-purple-300 border-purple-400/40",
    "Completed": "bg-green-500/20 text-green-300 border-green-400/40",
    "Archived": "bg-gray-500/20 text-gray-300 border-gray-400/40",
};

type SharedTripData = {
    number: string;
    country: string;
    region: string;
    status: TourStatus;
    tripStartDate: string;
    tripEndDate: string;
    bookingDate: string;
    flightInfo: {
        departure: { airportCode: string; country: string; date: string; time: string };
        arrival: { airportCode: string; country: string; date: string; time: string };
    };
    hotel: { name: string; checkIn: string; checkOut: string; food: string; nights: number; roomType: string };
    touristCount: number;
    addons: { insurance: boolean; transfer: boolean };
    managerName: string;
};

async function getSharedTrip(token: string): Promise<SharedTripData | null> {
    try {
        if (!token || token.length < 16) return null;
        await connectToDatabase();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const trip = await TripModel.findOne({ shareToken: token }).lean() as any;
        if (!trip) return null;

        let managerName = "";
        if (trip.managerPhone) {
            const manager = await UserModel.findOne({ phoneNumber: trip.managerPhone }).select("name").lean();
            managerName = (manager as { name?: string })?.name || "";
        }

        return {
            number: trip.number,
            country: trip.country,
            region: trip.region || "",
            status: trip.status || "In Booking",
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
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
    const { token } = await params;
    const trip = await getSharedTrip(token);

    if (!trip) {
        return { title: "Подорож не знайдена | RestAL" };
    }

    return {
        title: `Подорож до ${trip.country} | RestAL`,
        description: `Подорож #${trip.number} до ${trip.country}${trip.region ? `, ${trip.region}` : ""}. ${trip.tripStartDate} — ${trip.tripEndDate}. Організовано RestAL.`,
        openGraph: {
            title: `✈️ Подорож до ${trip.country} | RestAL`,
            description: `Тур #${trip.number} · ${trip.tripStartDate} — ${trip.tripEndDate} · ${trip.hotel.name || "Готель уточнюється"}`,
            images: [`/countryImages/${getCountryImageName(trip.country)}.jpg`],
        },
    };
}

export default async function SharedTripPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const trip = await getSharedTrip(token);

    if (!trip) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Подорож не знайдена</h1>
                    <p className="text-white/60">Посилання недійсне або термін його дії закінчився.</p>
                </div>
            </div>
        );
    }

    const status = trip.status as TourStatus;

    return (
        <div className="min-h-screen px-4 py-6 md:px-6">
            <div className="max-w-screen-xl mx-auto space-y-6">
                {/* Header */}
                <div className="relative h-64 rounded-2xl overflow-hidden">
                    <Image
                        src={`/countryImages/${getCountryImageName(trip.country)}.jpg`}
                        alt={trip.country}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border mb-3 ${statusColors[status]}`}>
                            {TOUR_STATUS_LABELS[status]}
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-1">{trip.country}</h1>
                        {trip.region && <p className="text-white/70">{trip.region}</p>}
                        <p className="text-white/50 text-sm mt-1">Тур #{trip.number}</p>
                    </div>
                </div>

                {/* Trip Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dates */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            Дати
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Початок</p>
                                <p className="text-lg font-bold text-white">{trip.tripStartDate}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Кінець</p>
                                <p className="text-lg font-bold text-white">{trip.tripEndDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Flight */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Plane className="w-5 h-5 text-blue-400" />
                            Переліт
                        </h2>
                        <div className="space-y-3">
                            {trip.flightInfo.departure.airportCode && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/50">Виліт:</span>
                                    <span className="text-white font-medium">
                                        {trip.flightInfo.departure.airportCode}
                                    </span>
                                    {trip.flightInfo.departure.date && (
                                        <span className="text-white/60 text-sm">
                                            {trip.flightInfo.departure.date} {trip.flightInfo.departure.time}
                                        </span>
                                    )}
                                </div>
                            )}
                            {trip.flightInfo.arrival.airportCode && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/50">Приліт:</span>
                                    <span className="text-white font-medium">
                                        {trip.flightInfo.arrival.airportCode}
                                    </span>
                                    {trip.flightInfo.arrival.date && (
                                        <span className="text-white/60 text-sm">
                                            {trip.flightInfo.arrival.date} {trip.flightInfo.arrival.time}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hotel */}
                    {trip.hotel.name && (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Hotel className="w-5 h-5 text-purple-400" />
                                Готель
                            </h2>
                            <p className="text-white font-semibold text-lg">{trip.hotel.name}</p>
                            <div className="mt-2 space-y-1 text-sm text-white/60">
                                {trip.hotel.roomType && <p>Номер: {trip.hotel.roomType}</p>}
                                {trip.hotel.food && <p>Харчування: {trip.hotel.food}</p>}
                                {trip.hotel.nights > 0 && <p>{trip.hotel.nights} ночей</p>}
                            </div>
                        </div>
                    )}

                    {/* Details */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-emerald-400" />
                            Деталі
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-white/70">
                                <Users className="w-4 h-4" />
                                <span>{trip.touristCount} {trip.touristCount === 1 ? "турист" : trip.touristCount < 5 ? "туристи" : "туристів"}</span>
                            </div>
                            {trip.addons.insurance && (
                                <div className="flex items-center gap-2 text-white/70">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    <span>Страхування включено</span>
                                </div>
                            )}
                            {trip.addons.transfer && (
                                <div className="flex items-center gap-2 text-white/70">
                                    <Car className="w-4 h-4 text-amber-400" />
                                    <span>Трансфер включено</span>
                                </div>
                            )}
                            {trip.managerName && (
                                <p className="text-white/50 text-xs mt-4">
                                    Менеджер: {trip.managerName}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RestAL Branding */}
                <div className="text-center py-6">
                    <p className="text-white/30 text-sm">
                        Організовано <span className="text-accent font-semibold">RestAL</span> · restal.in.ua
                    </p>
                </div>
            </div>
        </div>
    );
}
