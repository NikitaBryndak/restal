import { Clock, Calendar, MapPin, User, FileText, CreditCard, Plane, Hotel, Shield, Car, Download } from 'lucide-react';
import Image from 'next/image';
import { Trip } from '@/types';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import TripModel from "@/models/trip";

async function getTripData(id: string): Promise<Trip | null> {
    try {
        const session = (await getServerSession(authOptions as any)) as any;

        if (!session?.user?.phoneNumber) {
            return null;
        }

        await connectToDatabase();

        const query = !isNaN(Number(id))
            ? { number: Number(id) }
            : { _id: id };

        const trip = await TripModel.findOne(query).lean();

        if (!trip) return null;

        // Check authorization: user must be the owner OR have privilege level > 2
        const userPhone = session.user.phoneNumber;
        const userPrivilegeLevel = session.user.privelegeLevel || 1;

        const isOwner = (trip as any).ownerPhone === userPhone;
        const hasAdminAccess = userPrivilegeLevel > 2;

        if (!isOwner && !hasAdminAccess) {
            return null;
        }

        return JSON.parse(JSON.stringify(trip));
    } catch (error) {
        console.error('Error fetching trip:', error);
        return null;
    }
}

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const trip = await getTripData(id);

    if (!trip) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                    <p className="text-gray-600">The trip you're looking for doesn't exist or you don't have permission to view it.</p>
                </div>
            </div>
        );
    }

    const totalAmount = trip.payment?.totalAmount ?? 0;
    const paidAmount = trip.payment?.paidAmount ?? 0;
    const toPay = totalAmount - paidAmount;
    const cashback = totalAmount * 0.01;

    const documentArray = Object.entries(trip.documents).map(([name, doc]) => ({
        name: name.replace(/([A-Z])/g, ' $1').trim(),
        ...doc
    }));

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="relative h-64 rounded-2xl overflow-hidden">
                    <Image
                        src={`/countryImages/${trip.country}.jpg`}
                        alt={trip.country}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                        <div className="flex items-end justify-between">
                            <div>
                                <h1 className="text-5xl font-bold text-white mb-2">{trip.country}</h1>
                                <p className="text-white/80 text-lg">Trip #{trip.number}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-xl px-6 py-3 border border-white/30">
                                <p className="text-sm text-white/70">Booked on</p>
                                <p className="text-xl font-bold text-white">{trip.bookingDate}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Flight, Hotel, Dates */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Trip Dates */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-400" />
                                Trip Duration
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                                    <p className="text-xs uppercase tracking-wider text-blue-300 mb-2">Start Date</p>
                                    <p className="text-2xl font-bold text-white">{trip.tripStartDate}</p>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
                                    <p className="text-xs uppercase tracking-wider text-purple-300 mb-2">End Date</p>
                                    <p className="text-2xl font-bold text-white">{trip.tripEndDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Flight Information */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Plane className="w-5 h-5 text-blue-400" />
                                Flight Information
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Departure */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1 h-6 bg-blue-400 rounded-full" />
                                        <h3 className="text-sm uppercase tracking-wider text-white/70 font-semibold">Departure</h3>
                                    </div>
                                    <div className="pl-4 space-y-2">
                                        <div>
                                            <p className="text-xs text-white/60">Airport & Flight</p>
                                            <p className="text-lg font-bold text-white">{trip.flightInfo.departure.airportCode} · {trip.flightInfo.departure.flightNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60">Country</p>
                                            <p className="text-base text-white">{trip.flightInfo.departure.country}</p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-2">
                                            <div className="flex items-center gap-1.5 text-white/80">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm">{trip.flightInfo.departure.date}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white/80">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">{trip.flightInfo.departure.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Arrival */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1 h-6 bg-purple-400 rounded-full" />
                                        <h3 className="text-sm uppercase tracking-wider text-white/70 font-semibold">Return</h3>
                                    </div>
                                    <div className="pl-4 space-y-2">
                                        <div>
                                            <p className="text-xs text-white/60">Airport & Flight</p>
                                            <p className="text-lg font-bold text-white">{trip.flightInfo.arrival.airportCode} · {trip.flightInfo.arrival.flightNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60">Country</p>
                                            <p className="text-base text-white">{trip.flightInfo.arrival.country}</p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-2">
                                            <div className="flex items-center gap-1.5 text-white/80">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm">{trip.flightInfo.arrival.date}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white/80">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">{trip.flightInfo.arrival.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hotel Information */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Hotel className="w-5 h-5 text-amber-400" />
                                Accommodation
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{trip.hotel.name}</h3>
                                        <p className="text-white/70">{trip.hotel.roomType}</p>
                                    </div>
                                    <div className="bg-amber-500/20 border border-amber-400/40 rounded-full px-4 py-2">
                                        <span className="text-amber-300 font-bold">{trip.hotel.nights} nights</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-xs text-white/60 mb-1">Check-in</p>
                                        <p className="text-lg font-semibold text-white">{trip.hotel.checkIn}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-xs text-white/60 mb-1">Check-out</p>
                                        <p className="text-lg font-semibold text-white">{trip.hotel.checkOut}</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 border-t border-white/10">
                                    <p className="text-xs text-white/60 mb-1">Meal Plan</p>
                                    <p className="text-lg font-semibold text-white">{trip.hotel.food}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tourists */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-emerald-400" />
                                Travelers ({trip.tourists.length})
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {trip.tourists.map((tourist, index) => (
                                    <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/30 to-blue-400/30 flex items-center justify-center">
                                                <span className="text-lg font-bold text-white">{tourist.name[0]}{tourist.surname[0]}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{tourist.name} {tourist.surname}</p>
                                                <p className="text-xs text-white/60">{tourist.sex}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 pl-1">
                                            {tourist.DOB && (
                                                <p className="text-sm text-white/70">
                                                    <span className="text-white/50">DOB:</span> {tourist.DOB}
                                                </p>
                                            )}
                                            <p className="text-sm text-white/70">
                                                <span className="text-white/50">Passport expires:</span> {tourist.pasportExpiryDate}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Payment, Add-ons, Documents */}
                    <div className="space-y-6">
                        {/* Payment Information */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-400" />
                                Payment
                            </h2>
                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-green-300 mb-2">Total Amount</p>
                                    <p className="text-3xl font-bold text-white">{totalAmount.toFixed(2)}₴</p>
                                    <p className="text-sm text-emerald-300 mt-2">💰 +{cashback.toFixed(2)}₴ cashback</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-blue-300 mb-2">Paid Amount</p>
                                    <p className="text-2xl font-bold text-white">{paidAmount.toFixed(2)}₴</p>
                                </div>
                                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-amber-300 mb-2">Amount to Pay</p>
                                    <p className="text-2xl font-bold text-white">{toPay.toFixed(2)}₴</p>
                                    <p className="text-xs text-white/60 mt-2">Deadline: {trip.payment.deadline}</p>
                                </div>
                            </div>
                        </div>

                        {/* Add-ons */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                                Add-ons
                            </h2>
                            <div className="space-y-3">
                                <div className={`flex items-center justify-between rounded-xl p-4 border ${
                                    trip.addons.insurance
                                        ? 'bg-emerald-500/15 border-emerald-400/40'
                                        : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-white/70" />
                                        <span className="font-medium text-white">Insurance</span>
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                        trip.addons.insurance ? 'text-emerald-300' : 'text-white/40'
                                    }`}>
                                        {trip.addons.insurance ? '✓ YES' : '✗ NO'}
                                    </span>
                                </div>
                                <div className={`flex items-center justify-between rounded-xl p-4 border ${
                                    trip.addons.transfer
                                        ? 'bg-emerald-500/15 border-emerald-400/40'
                                        : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <Car className="w-5 h-5 text-white/70" />
                                        <span className="font-medium text-white">Transfer</span>
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                        trip.addons.transfer ? 'text-emerald-300' : 'text-white/40'
                                    }`}>
                                        {trip.addons.transfer ? '✓ YES' : '✗ NO'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                Documents
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {documentArray.map((doc, index) => (
                                    <a
                                        key={index}
                                        href={doc.uploaded ? doc.url : '#'}
                                        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                                            doc.uploaded
                                                ? 'bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20 cursor-pointer'
                                                : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                                        }`}
                                        target={doc.uploaded ? '_blank' : undefined}
                                        rel={doc.uploaded ? 'noopener noreferrer' : undefined}
                                    >
                                        <Download className="w-5 h-5 text-white/70 mb-2" />
                                        <span className="text-xs text-center text-white/90 capitalize">{doc.name}</span>
                                        {doc.uploaded && (
                                            <span className="text-[10px] text-emerald-300 mt-1">Available</span>
                                        )}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Trip Metadata */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-400" />
                                Trip Details
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/60">Owner Phone:</span>
                                    <span className="text-white font-medium">{trip.ownerPhone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/60">Manager Phone:</span>
                                    <span className="text-white font-medium">{trip.managerPhone}</span>
                                </div>
                                {trip.createdAt && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Created:</span>
                                        <span className="text-white font-medium">
                                            {new Date(trip.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {trip.updatedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Last Updated:</span>
                                        <span className="text-white font-medium">
                                            {new Date(trip.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}