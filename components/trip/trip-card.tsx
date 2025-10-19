import { Clock, Download } from 'lucide-react';
import Image from 'next/image';
import { Trip } from '@/types';
import { cn } from '@/lib/utils';

export default function TripCard({ data }: { data: Trip }) {
    const totalAmount = data.payment?.totalAmount ?? 0;
    const paidAmount = data.payment?.paidAmount ?? 0;
    const toPay = totalAmount - paidAmount;
    const cashback = data.payment.totalAmount * 0.01; 

    const addonItems = [
        { label: "Insurance", value: data.addons.insurance, icon: "🛡️" },
        { label: "Transfer", value: data.addons.transfer, icon: "🚗" },
    ];

    console.log('TripCard data:', data.tripEndDate);

    const [day, month, year] = data.tripEndDate.split('/').map((part: string) => parseInt(part, 10));

    const tripEnd = new Date(`${year}-${month}-${day}`);

    const outdatedTrip = tripEnd < new Date();

    const rootClass = `w-full h-84 mb-6 rounded-xl overflow-hidden relative ${outdatedTrip ? 'cursor-not-allowed grayscale' : 'cursor-pointer hover:scale-[1.02] transition-transform'}`;

    const documentArray = Array.isArray(data.documents) ? data.documents : Object.values(data.documents ?? {});

    const documentDownloadSection = (documentArray as any[]).map((doc: any) => (
        <div className={cn('flex flex-col justify-center items-center m-[2px]', doc?.uploaded ? 'opacity-100' : 'opacity-50')} key={doc?.url ?? String(doc)}>
            <Download className="w-4 h-4 text-white/70" />
            <span className='text-[10px] text-white/90 text-center'>{doc?.name ?? 'Doc'}</span>
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
            <div className="absolute inset-0 flex">
                {/* Left Side - Photo and Country Name (30%) */}
                <div className="flex-[0_0_30%] flex flex-col justify-center items-center p-6">
                    <div className="h-[1.25rem]"></div>
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
                <div className="flex flex-[0_0_70%] p-6 gap-5">
                    {/* Flight & Hotel Info */}
                    <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-6 h-full text-white border border-white/10">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5 h-full">
                            {/* Departure */}
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Departure</p>
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
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Return</p>
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
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Stay</p>
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-400/30 border border-white/20 text-white text-[10px] flex items-center justify-center font-bold shadow-lg">
                                        {data.hotel.nights}
                                    </span>
                                </div>
                                <p className="text-sm font-bold leading-tight pl-3">{data.hotel.name}</p>
                                <div className="space-y-1 text-white/75 text-xs pl-3">
                                    <p className="flex justify-between">
                                        <span className="text-white/60">Check-in:</span>
                                        <span className="font-medium">{data.hotel.checkIn}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-white/60">Check-out:</span>
                                        <span className="font-medium">{data.hotel.checkOut}</span>
                                    </p>
                                    <div className="pt-1 border-t border-white/10 mt-2">
                                        <p className="flex justify-between">
                                            <span className="text-white/60">Meal plan:</span>
                                            <span className="font-medium">{data.hotel.food}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Add-ons */}
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-emerald-400/60 rounded-full"></div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">Add-ons</p>
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


                    <div className="flex flex-[0_0_40%] flex-col gap-3 ml-4 ">
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 h-full text-white flex flex-col justify-center">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 text-center mb-2">Payment</p>
                            <div className="flex flex-col gap-2">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <p className="text-2xl font-bold leading-none">{totalAmount.toFixed(2)}₴</p>
                                    </div>
                                    <p className="text-[11px] text-emerald-300 font-medium mt-1">💰 +{cashback.toFixed(2)}₴ cashback</p>
                                </div>
                                
                                <div className="w-full h-px bg-white/20 my-0.5"></div>
                                
                                <div className="text-center">
                                    <p className="text-xl font-bold text-amber-300 leading-none">{toPay.toFixed(2)}₴</p>
                                    <p className="text-[11px] text-white/60 mt-1">{data.payment.deadline}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 h-full text-white flex flex-[20%] flex-col gap-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 text-center">Documents</p>
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