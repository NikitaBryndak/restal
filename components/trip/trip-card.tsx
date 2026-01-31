import { Clock, Download } from 'lucide-react';
import Image from 'next/image';
import { Trip } from '@/types';
import { cn } from '@/lib/utils';
import { CASHBACK_RATE } from '@/config/constants';

export default function TripCard({ data }: { data: Trip }) {
    const totalAmount = data.payment?.totalAmount ?? 0;
    const paidAmount = data.payment?.paidAmount ?? 0;
    const toPay = totalAmount - paidAmount;
    const cashback = totalAmount * CASHBACK_RATE;

    const addonItems = [
        { label: "Страхування", value: data.addons.insurance, icon: "🛡️" },
        { label: "Трансфер", value: data.addons.transfer, icon: "🚗" },
    ];

    const [day, month, year] = data.tripEndDate.split('/').map((part: string) => parseInt(part, 10));

    const tripEnd = new Date(`${year}-${month}-${day}`);

    const outdatedTrip = tripEnd < new Date();

    const rootClass = `w-full h-[900px] md:h-84 mb-6 rounded-xl overflow-hidden relative ${outdatedTrip ? 'cursor-not-allowed grayscale' : 'cursor-pointer hover:scale-[1.02] transition-transform'}`;

    const documentArray = Array.isArray(data.documents) ? data.documents : Object.values(data.documents ?? {});

    const documentAbbreviations: string[] = [
        "ДОГ", // договір
        "ПТВ", // підтвердження
        "ВАУ", // ваучер
        "АВК", // авіаквитки
        "СТП", // страховий поліс
        "МКВ", // маршрутна квитанція
        "ТРЛ", // трансферний лист
        "ПТА", // посадковий талон
        "ПТУ"  // програма туру
        ];
    const documentDownloadSection = (documentArray as any[]).map((doc: any, index: number) => (
        <div className={cn('flex flex-col justify-center items-center m-0.5', doc?.uploaded ? 'opacity-100' : 'opacity-50')} key={index}>
            <Download className="w-4 h-4 text-white/70" />
            <span className='text-[10px] text-white/90 text-center'>{doc?.name ?? documentAbbreviations[index]}</span>
        </div>
    ));


    return (
    <div className={rootClass}>
            {/* Background Image */}
            <Image
                src={`/countryImages/${data.country}.jpg`}
                alt={`Trip to ${data.country}`}
                fill
                className="object-cover"
            />

            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col md:flex-[0_70%_0] md:flex-row md:items-stretch">
                {/* Left Side - Photo and Country Name (30%) */}
                <div className="flex-[0_0_30%] flex flex-col justify-center items-center p-6">
                    <div className="h-5"></div>
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 text-center">
                        <h2 className="text-4xl font-bold text-white drop-shadow-lg">
                            {data.country}
                        </h2>
                    </div>
                    <div className="rounded-lg p-0.5 text-center">
                        <h2 className="text-xl font-bold text-white drop-shadow-lg">
                            {data.number}
                        </h2>
                    </div>
                </div>

                {/* Right Side - All Data Points (70%) */}
                <div className="flex w-full p-6 gap-5 flex-col md:flex-row">
                    {/* Flight & Hotel Info */}
                    <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-6 h-full text-white border border-white/10">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5 h-full">
                            {/* Departure */}
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Виліт</p>
                                </div>
                                <p className="text-base font-semibold pl-3">{data.flightInfo.departure.airportCode} · {data.flightInfo.departure.flightNumber}</p>
                                <div className="flex items-center gap-2 text-white/80 pl-3">
                                    <p className="text-xs font-medium">{data.flightInfo.departure.date}</p>
                                    <Clock className='w-3.5 h-3.5 text-white/60'/>
                                    <p className="text-xs font-medium">{data.flightInfo.departure.time}</p>
                                </div>
                            </div>

                            {/* Return */}
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-purple-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Повернення</p>
                                </div>
                                <p className="text-base font-semibold pl-3">{data.flightInfo.arrival.airportCode} · {data.flightInfo.arrival.flightNumber}</p>
                                <div className="flex items-center gap-2 text-white/80 pl-3">
                                    <p className="text-xs font-medium">{data.flightInfo.arrival.date}</p>
                                    <Clock className='w-3.5 h-3.5 text-white/60'/>
                                    <p className="text-xs font-medium">{data.flightInfo.arrival.time}</p>
                                </div>
                            </div>

                            {/* Stay */}
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-amber-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Проживання</p>
                                    <span className="w-6 h-6 rounded-full bg-linear-to-br from-amber-400/30 to-orange-400/30 border border-white/20 text-white text-[10px] flex items-center justify-center font-bold shadow-lg">
                                        {data.hotel.nights}
                                    </span>
                                </div>
                                <p className="text-sm font-bold leading-tight pl-3">{data.hotel.name}</p>
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
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-emerald-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Додатково</p>
                                </div>
                                <div className="flex flex-col gap-2 pl-3">
                                    {addonItems.map((addon) => (
                                        <div
                                            key={addon.label}
                                            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm border ${
                                                addon.value
                                                    ? 'bg-emerald-500/15 border-emerald-400/40 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/50'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="text-lg">{addon.icon}</span>
                                                <span className="font-medium">{addon.label}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-[0_0_40%] flex-col gap-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 h-full text-white flex flex-col justify-center">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 text-center mb-2">Оплата</p>
                            <div className="flex flex-col gap-2">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <p className="text-2xl font-bold leading-none">{new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalAmount)}₴</p>
                                    </div>
                                    <p className="text-[11px] text-emerald-300 font-medium mt-1">💰 +{new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cashback)}₴ cashback</p>
                                </div>

                                <div className="w-full h-px bg-white/20 my-0.5"></div>

                                <div className="text-center">
                                    <p className="text-xl font-bold text-amber-300 leading-none">{new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(toPay)}₴</p>
                                    <p className="text-[11px] text-white/60 mt-1">{data.payment.deadline}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 h-full text-white flex flex-[20%] flex-col gap-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 text-center">Документи</p>
                            <div className='flex flex-row justify-around w-full'>
                                {documentDownloadSection}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
    </div>
    )
}