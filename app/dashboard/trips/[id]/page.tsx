import { Clock, Calendar, MapPin, User, FileText, CreditCard, Plane, Hotel, Shield, Car, Download, Phone, UserCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Trip, TOUR_STATUS_LABELS, TourStatus, DOCUMENT_LABELS, Documents } from '@/types';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import TripModel from "@/models/trip";
import UserModel from "@/models/user";
import mongoose from "mongoose";
import { CASHBACK_RATE, ADMIN_PRIVILEGE_LEVEL } from '@/config/constants';
import { getCountryImageName } from '@/data';
import TripCountdown from '@/components/trip/trip-countdown';
import TripTimeline from '@/components/trip/trip-timeline';

import TrackTripView from '@/components/trip/track-trip-view';
import TripShareCard from '@/components/trip/trip-share-card';

// Status color mapping
const statusColors: Record<TourStatus, string> = {
    "In Booking": "bg-yellow-500/20 text-yellow-300 border-yellow-400/40",
    "Booked": "bg-blue-500/20 text-blue-300 border-blue-400/40",
    "Paid": "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    "In Progress": "bg-purple-500/20 text-purple-300 border-purple-400/40",
    "Completed": "bg-green-500/20 text-green-300 border-green-400/40",
    "Archived": "bg-gray-500/20 text-gray-300 border-gray-400/40",
};

// Type for enriched trip with manager/client names
type EnrichedTrip = Trip & {
    managerName?: string;
    clientName?: string;
};

async function getTripData(id: string): Promise<EnrichedTrip | null> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.phoneNumber) {
            return null;
        }

        await connectToDatabase();

        const query = mongoose.Types.ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id)
            ? { _id: id }
            : { number: id };

        const trip = await TripModel.findOne(query).lean() as Trip | null;

        if (!trip) return null;

        const userPhone = session.user.phoneNumber;
        const userPrivilegeLevel = session.user.privilegeLevel || 1;

        const isOwner = trip.ownerPhone === userPhone;
        const isManager = trip.managerPhone === userPhone;
        const hasAdminAccess = userPrivilegeLevel >= ADMIN_PRIVILEGE_LEVEL;

        // Admins can access any trip
        if (!isOwner && !isManager && !hasAdminAccess) {
            return null;
        }

        // Fetch manager and client names securely (only after access check passes)
        let managerName = '';
        let clientName = '';

        if (trip.managerPhone) {
            const manager = await UserModel.findOne({ phoneNumber: trip.managerPhone }).select('name').lean();
            managerName = (manager as { name?: string })?.name || '';
        }

        if (trip.ownerPhone) {
            const client = await UserModel.findOne({ phoneNumber: trip.ownerPhone }).select('name').lean();
            clientName = (client as { name?: string })?.name || '';
        }

        return JSON.parse(JSON.stringify({ ...trip, managerName, clientName }));
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
                    <h1 className="text-3xl font-bold mb-4">Доступ заборонено</h1>
                    <p className="text-gray-600">Подорож, яку ви шукаєте, не існує, або ви не маєте дозволу на перегляд.</p>
                </div>
            </div>
        );
    }

    const totalAmount = trip.payment?.totalAmount ?? 0;
    const paidAmount = trip.payment?.paidAmount ?? 0;
    const toPay = totalAmount - paidAmount;
    const cashback = (trip.cashbackAmount && trip.cashbackAmount > 0) ? trip.cashbackAmount : totalAmount * CASHBACK_RATE;

    const status = (trip.status || 'In Booking') as TourStatus;

    // Group documents
    const mainDocKeys: (keyof Documents)[] = ['contract', 'invoice', 'confirmation', 'voucher', 'insurancePolicy', 'tourProgram', 'memo'];
    const departureTicketKeys: (keyof Documents)[] = ['departureTicket1', 'departureTicket2', 'departureTicket3', 'departureTicket4'];
    const arrivalTicketKeys: (keyof Documents)[] = ['arrivalTicket1', 'arrivalTicket2', 'arrivalTicket3', 'arrivalTicket4'];

    const docs = trip.documents as Documents;

    return (
        <div className="min-h-screen px-4 py-6 md:px-6">
            <TrackTripView tripId={trip.number} country={trip.country} number={trip.number} status={status} />
            <div className="max-w-screen-2xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden">
                    <Image
                        src={`/countryImages/${getCountryImageName(trip.country)}.jpg`}
                        alt={trip.country}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        priority
                        quality={80}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
                            <div className="min-w-0">
                                <div className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border mb-2 sm:mb-3 ${statusColors[status]}`}>
                                    {TOUR_STATUS_LABELS[status]}
                                </div>
                                <h1 className="text-3xl sm:text-5xl font-bold text-white mb-1 sm:mb-2 truncate">{trip.country}</h1>
                            </div>
                            <div className="flex items-end gap-2 sm:gap-3 shrink-0 flex-wrap">
                                <TripShareCard
                                    country={trip.country}
                                    region={trip.region}
                                    tripStartDate={trip.tripStartDate}
                                    tripEndDate={trip.tripEndDate}
                                    hotel={{ name: trip.hotel.name, nights: trip.hotel.nights, food: trip.hotel.food }}
                                    flightInfo={{
                                        departure: { airportCode: trip.flightInfo.departure.airportCode, date: trip.flightInfo.departure.date, time: trip.flightInfo.departure.time },
                                        arrival: { airportCode: trip.flightInfo.arrival.airportCode, date: trip.flightInfo.arrival.date, time: trip.flightInfo.arrival.time },
                                    }}
                                    touristCount={trip.tourists.length}
                                    addons={trip.addons}
                                    status={status}
                                    countryImage={`/countryImages/${getCountryImageName(trip.country)}.jpg`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Countdown & Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TripCountdown
                        tripStartDate={trip.tripStartDate}
                        tripEndDate={trip.tripEndDate}
                        status={status}
                    />
                    <TripTimeline status={status} />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Flight, Hotel, Dates */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Trip Dates */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-400" />
                                Тривалість подорожі
                            </h2>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 sm:p-4">
                                    <p className="text-[10px] sm:text-xs uppercase tracking-wider text-blue-300 mb-1 sm:mb-2">Дата початку</p>
                                    <p className="text-base sm:text-2xl font-bold text-white">{trip.tripStartDate}</p>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-3 sm:p-4">
                                    <p className="text-[10px] sm:text-xs uppercase tracking-wider text-purple-300 mb-1 sm:mb-2">Дата закінчення</p>
                                    <p className="text-base sm:text-2xl font-bold text-white">{trip.tripEndDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Flight Information */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Plane className="w-5 h-5 text-blue-400" />
                                Інформація про рейси
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Departure */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1 h-6 bg-blue-400 rounded-full" />
                                        <h3 className="text-sm uppercase tracking-wider text-white/70 font-semibold">Виліт</h3>
                                    </div>
                                    <div className="pl-4 space-y-2">
                                        <div>
                                            <p className="text-xs text-white/60">Аеропорт та рейс</p>
                                            <p className="text-lg font-bold text-white">{trip.flightInfo.departure.airportCode} · {trip.flightInfo.departure.flightNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60">Країна</p>
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
                                        <h3 className="text-sm uppercase tracking-wider text-white/70 font-semibold">Повернення</h3>
                                    </div>
                                    <div className="pl-4 space-y-2">
                                        <div>
                                            <p className="text-xs text-white/60">Аеропорт та рейс</p>
                                            <p className="text-lg font-bold text-white">{trip.flightInfo.arrival.airportCode} · {trip.flightInfo.arrival.flightNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60">Країна</p>
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
                                Проживання
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 break-words">{trip.hotel.name}</h3>
                                        <p className="text-white/70 text-sm sm:text-base">{trip.hotel.roomType}</p>
                                    </div>
                                    <div className="bg-amber-500/20 border border-amber-400/40 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shrink-0 whitespace-nowrap">
                                        <span className="text-amber-300 font-bold text-sm sm:text-base">{trip.hotel.nights} ночей</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
                                    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                                        <p className="text-xs text-white/60 mb-1">Заселення</p>
                                        <p className="text-base sm:text-lg font-semibold text-white">{trip.hotel.checkIn}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3 sm:p-4">
                                        <p className="text-xs text-white/60 mb-1">Виселення</p>
                                        <p className="text-base sm:text-lg font-semibold text-white">{trip.hotel.checkOut}</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 border-t border-white/10">
                                    <p className="text-xs text-white/60 mb-1">Харчування</p>
                                    <p className="text-lg font-semibold text-white">{trip.hotel.food}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tourists */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-emerald-400" />
                                Подорожуючі ({trip.tourists.length})
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {trip.tourists.map((tourist, index) => (
                                    <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-400/30 to-blue-400/30 flex items-center justify-center">
                                                <span className="text-lg font-bold text-white">{tourist.name[0]}{tourist.surname[0]}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{tourist.name} {tourist.surname}</p>
                                                <p className="text-xs text-white/60">{tourist.sex}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 pl-1">
                                            {tourist.dob && (
                                                <p className="text-sm text-white/70">
                                                    <span className="text-white/50">Дата нар.:</span> {tourist.dob}
                                                </p>
                                            )}
                                            <p className="text-sm text-white/70">
                                                <span className="text-white/50">Паспорт дійсний до:</span> {tourist.passportExpiryDate}
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
                                Оплата
                            </h2>
                            <div className="space-y-4">
                                <div className="bg-linear-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-green-300 mb-2">Загальна сума</p>
                                    <p className="text-3xl font-bold text-white">{totalAmount.toFixed(2)}₴</p>
                                    <p className="text-sm text-emerald-300 mt-2">💰 +{cashback.toFixed(2)}₴ кешбек</p>
                                </div>
                                <div className="bg-linear-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-blue-300 mb-2">Сплачено</p>
                                    <p className="text-2xl font-bold text-white">{paidAmount.toFixed(2)}₴</p>
                                </div>
                                <div className="bg-linear-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-amber-300 mb-2">До сплати</p>
                                    <p className="text-2xl font-bold text-white">{toPay.toFixed(2)}₴</p>
                                    <p className="text-xs text-white/60 mt-2">Термін: {trip.payment.deadline}</p>
                                </div>
                            </div>
                        </div>

                        {/* Add-ons */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                                Додатково
                            </h2>
                            <div className="space-y-3">
                                <div className={`flex items-center justify-between rounded-xl p-4 border ${
                                    trip.addons.insurance
                                        ? 'bg-emerald-500/15 border-emerald-400/40'
                                        : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-white/70" />
                                        <span className="font-medium text-white">Страхування</span>
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                        trip.addons.insurance ? 'text-emerald-300' : 'text-white/40'
                                    }`}>
                                        {trip.addons.insurance ? '✓ ТАК' : '✗ НІ'}
                                    </span>
                                </div>
                                <div className={`flex items-center justify-between rounded-xl p-4 border ${
                                    trip.addons.transfer
                                        ? 'bg-emerald-500/15 border-emerald-400/40'
                                        : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <Car className="w-5 h-5 text-white/70" />
                                        <span className="font-medium text-white">Трансфер</span>
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                        trip.addons.transfer ? 'text-emerald-300' : 'text-white/40'
                                    }`}>
                                        {trip.addons.transfer ? '✓ ТАК' : '✗ НІ'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                Документи
                            </h2>

                            {/* Main Documents */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {mainDocKeys.map((key) => {
                                    const doc = docs[key];
                                    return (
                                        <a
                                            key={key}
                                            href={doc?.uploaded ? doc.url : '#'}
                                            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                                                doc?.uploaded
                                                    ? 'bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20 cursor-pointer'
                                                    : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                                            }`}
                                            target={doc?.uploaded ? '_blank' : undefined}
                                            rel={doc?.uploaded ? 'noopener noreferrer' : undefined}
                                        >
                                            <Download className="w-5 h-5 text-white/70 mb-2" />
                                            <span className="text-xs text-center text-white/90">{DOCUMENT_LABELS[key]}</span>
                                            {doc?.uploaded && (
                                                <span className="text-[10px] text-emerald-300 mt-1">Доступно</span>
                                            )}
                                        </a>
                                    );
                                })}
                            </div>

                            {/* Tickets Section */}
                            <div className="border-t border-white/10 pt-4">
                                <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                                    <Plane className="w-4 h-4" />
                                    Авіаквитки
                                </h3>

                                {/* Departure Tickets */}
                                <p className="text-xs text-white/50 mb-2">Квитки на виліт</p>
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {departureTicketKeys.map((key, index) => {
                                        const doc = docs[key];
                                        return (
                                            <a
                                                key={key}
                                                href={doc?.uploaded ? doc.url : '#'}
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                                                    doc?.uploaded
                                                        ? 'bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20 cursor-pointer'
                                                        : 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed'
                                                }`}
                                                target={doc?.uploaded ? '_blank' : undefined}
                                                rel={doc?.uploaded ? 'noopener noreferrer' : undefined}
                                            >
                                                <Download className="w-3 h-3 text-white/70" />
                                                <span className="text-[10px] text-white/70 mt-1">#{index + 1}</span>
                                            </a>
                                        );
                                    })}
                                </div>

                                {/* Arrival Tickets */}
                                <p className="text-xs text-white/50 mb-2">Квитки на повернення</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {arrivalTicketKeys.map((key, index) => {
                                        const doc = docs[key];
                                        return (
                                            <a
                                                key={key}
                                                href={doc?.uploaded ? doc.url : '#'}
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                                                    doc?.uploaded
                                                        ? 'bg-purple-500/10 border-purple-400/30 hover:bg-purple-500/20 cursor-pointer'
                                                        : 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed'
                                                }`}
                                                target={doc?.uploaded ? '_blank' : undefined}
                                                rel={doc?.uploaded ? 'noopener noreferrer' : undefined}
                                            >
                                                <Download className="w-3 h-3 text-white/70" />
                                                <span className="text-[10px] text-white/70 mt-1">#{index + 1}</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Trip Metadata */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-400" />
                                Деталі туру
                            </h2>

                            {/* Manager Contact */}
                            <div className="mb-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                        <UserCircle className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-cyan-300">Менеджер</p>
                                        <p className="text-lg font-semibold text-white">{trip.managerName || '—'}</p>
                                    </div>
                                </div>
                                <a href={`tel:${trip.managerPhone}`} className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-colors">
                                    <Phone className="w-4 h-4" />
                                    <span>{trip.managerPhone || '—'}</span>
                                </a>
                            </div>

                            {/* Client Contact */}
                            <div className="mb-4 p-4 rounded-xl bg-pink-500/10 border border-pink-400/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-pink-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-pink-300">Клієнт</p>
                                        <p className="text-lg font-semibold text-white">{trip.clientName || '—'}</p>
                                    </div>
                                </div>
                                <a href={`tel:${trip.ownerPhone}`} className="flex items-center gap-2 text-pink-300 hover:text-pink-200 transition-colors">
                                    <Phone className="w-4 h-4" />
                                    <span>{trip.ownerPhone || '—'}</span>
                                </a>
                            </div>

                            {/* Other Details */}
                            <div className="space-y-3 text-sm border-t border-white/10 pt-4">
                                {trip.createdAt && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Створено:</span>
                                        <span className="text-white font-medium">
                                            {new Date(trip.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {trip.updatedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Оновлено:</span>
                                        <span className="text-white font-medium">
                                            {new Date(trip.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Book Again (visible for completed/archived trips) */}
                {(status === 'Completed' || status === 'Archived') && (
                    <div className="bg-linear-to-r from-accent/10 to-blue-500/10 backdrop-blur-md rounded-xl p-6 border border-accent/20">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">Сподобалась подорож?</h3>
                                <p className="text-sm text-white/50">Замовте схожий тур до {trip.country} знову!</p>
                            </div>
                            <Link
                                href={`/contact?country=${encodeURIComponent(trip.country)}${trip.region ? `&region=${encodeURIComponent(trip.region)}` : ''}`}
                                className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-accent/25"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Забронювати знову
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}