import { Clock, Download } from 'lucide-react';
import Image from 'next/image';
import { Trip, TOUR_STATUS_LABELS, TourStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CASHBACK_RATE } from '@/config/constants';
import { getCountryImageName } from '@/data';

// Status color mapping
const statusColors: Record<TourStatus, string> = {
    "In Booking": "bg-yellow-500/20 text-yellow-300 border-yellow-400/40",
    "Booked": "bg-blue-500/20 text-blue-300 border-blue-400/40",
    "Paid": "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    "In Progress": "bg-purple-500/20 text-purple-300 border-purple-400/40",
    "Completed": "bg-green-500/20 text-green-300 border-green-400/40",
    "Archived": "bg-gray-500/20 text-gray-300 border-gray-400/40",
};

export default function TripCard({ data }: { data: Trip }) {
    const totalAmount = data.payment?.totalAmount ?? 0;
    const paidAmount = data.payment?.paidAmount ?? 0;
    const toPay = totalAmount - paidAmount;
    const cashback = (data.cashbackAmount && data.cashbackAmount > 0) ? data.cashbackAmount : totalAmount * CASHBACK_RATE;

    const addonItems = [
        { label: "Страхування", value: data.addons.insurance, icon: "🛡️" },
        { label: "Трансфер", value: data.addons.transfer, icon: "🚗" },
    ];

    const [day, month, year] = data.tripEndDate.split('/').map((part: string) => parseInt(part, 10));

    const tripEnd = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

    const outdatedTrip = tripEnd < new Date();

    const rootClass = `w-full h-auto md:h-84 mb-6 rounded-xl overflow-hidden relative ${outdatedTrip ? 'cursor-not-allowed grayscale' : 'cursor-pointer hover:scale-[1.02] transition-transform'}`;

    // Get main documents (non-ticket) count
    const mainDocKeys = ['contract', 'invoice', 'confirmation', 'voucher', 'insurancePolicy', 'tourProgram', 'memo'];
    const ticketKeys = ['departureTicket1', 'departureTicket2', 'departureTicket3', 'departureTicket4', 'arrivalTicket1', 'arrivalTicket2', 'arrivalTicket3', 'arrivalTicket4'];

    const docs = data.documents as Record<string, { uploaded?: boolean; url?: string }> || {};

    const uploadedMainDocs = mainDocKeys.filter(key => docs[key]?.uploaded).length;
    const uploadedTickets = ticketKeys.filter(key => docs[key]?.uploaded).length;

    const status = (data.status || 'In Booking') as TourStatus;

    return (
    <div className={rootClass}>
            {/* Background Image */}
            <Image
                src={`/countryImages/${getCountryImageName(data.country)}.jpg`}
                alt={`Trip to ${data.country}`}
                fill
                className="object-cover hidden md:block"
            />

            {/* Glass Effect Overlay - desktop only (over image) */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hidden md:block"></div>

            {/* Mobile background gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-slate-900/95 to-slate-800/95 md:hidden"></div>

            {/* Content Container */}
            <div className="relative md:absolute md:inset-0 flex flex-col md:flex-row md:items-stretch">
                {/* Left Side - Photo and Country Name */}
                <div className="shrink-0 md:flex-[0_0_30%] flex flex-col justify-center items-center p-4 sm:p-6">
                    {/* Status Badge */}
                    <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border mb-3", statusColors[status])}>
                        {TOUR_STATUS_LABELS[status]}
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 sm:p-4 text-center">
                        <h2 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
                            {data.country}
                        </h2>
                    </div>
                    <div className="rounded-lg p-0.5 text-center">
                        <h2 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
                            {data.number}
                        </h2>
                    </div>
                </div>

                {/* Right Side - All Data Points */}
                <div className="flex w-full p-3 sm:p-6 gap-3 sm:gap-5 flex-col md:flex-row">
                    {/* Flight & Hotel Info */}
                    <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-6 text-white border border-white/10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-5">
                            {/* Departure */}
                            <div className="space-y-1.5 sm:space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Виліт</p>
                                </div>
                                <p className="text-sm sm:text-base font-semibold pl-3">{data.flightInfo.departure.airportCode} · {data.flightInfo.departure.flightNumber}</p>
                                <div className="flex items-center gap-2 text-white/80 pl-3">
                                    <p className="text-xs font-medium">{data.flightInfo.departure.date}</p>
                                    <Clock className='w-3.5 h-3.5 text-white/60'/>
                                    <p className="text-xs font-medium">{data.flightInfo.departure.time}</p>
                                </div>
                            </div>

                            {/* Return */}
                            <div className="space-y-1.5 sm:space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-purple-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Повернення</p>
                                </div>
                                <p className="text-sm sm:text-base font-semibold pl-3">{data.flightInfo.arrival.airportCode} · {data.flightInfo.arrival.flightNumber}</p>
                                <div className="flex items-center gap-2 text-white/80 pl-3">
                                    <p className="text-xs font-medium">{data.flightInfo.arrival.date}</p>
                                    <Clock className='w-3.5 h-3.5 text-white/60'/>
                                    <p className="text-xs font-medium">{data.flightInfo.arrival.time}</p>
                                </div>
                            </div>

                            {/* Stay */}
                            <div className="space-y-1.5 sm:space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-amber-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Проживання</p>
                                    <span className="w-6 h-6 rounded-full bg-linear-to-br from-amber-400/30 to-orange-400/30 border border-white/20 text-white text-[10px] flex items-center justify-center font-bold shadow-lg">
                                        {data.hotel.nights}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm font-bold leading-tight pl-3">{data.hotel.name}</p>
                                <div className="space-y-1 text-white/75 text-xs pl-3">
                                    <p className="flex justify-between">
                                        <span className="text-white/60">C-i:</span>
                                        <span className="font-medium">{data.hotel.checkIn}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-white/60">C-o:</span>
                                        <span className="font-medium">{data.hotel.checkOut}</span>
                                    </p>
                                    <div className="pt-1 border-t border-white/10 mt-2">
                                        <p className="flex justify-between">
                                            <span className="text-white/60">Харчування:</span>
                                            <span className="font-medium">{data.hotel.food}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Add-ons */}
                            <div className="space-y-1.5 sm:space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-emerald-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Додатково</p>
                                </div>
                                <div className="flex flex-col gap-2 pl-3">
                                    {addonItems.map((addon) => (
                                        <div
                                            key={addon.label}
                                            className={`flex items-center justify-between gap-2 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border ${
                                                addon.value
                                                    ? 'bg-emerald-500/15 border-emerald-400/40 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/50'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="text-base sm:text-lg">{addon.icon}</span>
                                                <span className="font-medium">{addon.label}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col md:flex-[0_0_40%] gap-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 sm:p-4 flex-1 md:h-full text-white flex flex-col justify-center">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 text-center mb-2">Оплата</p>
                            <div className="flex flex-col gap-2">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <p className="text-lg sm:text-2xl font-bold leading-none">{new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalAmount)}₴</p>
                                    </div>
                                    <p className="text-[10px] sm:text-[11px] text-emerald-300 font-medium mt-1">💰 +{new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cashback)}₴ cashback</p>
                                </div>

                                <div className="w-full h-px bg-white/20 my-0.5"></div>

                                <div className="text-center">
                                    <p className="text-base sm:text-xl font-bold text-amber-300 leading-none">{new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(toPay)}₴</p>
                                    <p className="text-[10px] sm:text-[11px] text-white/60 mt-1">{data.payment?.deadline}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 sm:p-4 text-white flex flex-col gap-2">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 text-center">Документи</p>
                            <div className='flex flex-row justify-around items-center gap-2'>
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-full",
                                        uploadedMainDocs > 0 ? "bg-emerald-500/20 border border-emerald-400/40" : "bg-white/10 border border-white/20"
                                    )}>
                                        <Download className={cn("w-4 h-4", uploadedMainDocs > 0 ? "text-emerald-300" : "text-white/40")} />
                                    </div>
                                    <span className="text-[9px] text-white/70 mt-1">{uploadedMainDocs}/7</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-full",
                                        uploadedTickets > 0 ? "bg-blue-500/20 border border-blue-400/40" : "bg-white/10 border border-white/20"
                                    )}>
                                        <span className="text-xs">✈️</span>
                                    </div>
                                    <span className="text-[9px] text-white/70 mt-1">{uploadedTickets}/8</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
    </div>
    )
}