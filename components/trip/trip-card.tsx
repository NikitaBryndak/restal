import Image from 'next/image';

export default function TripCard({ data }: { data: any }) {
    const summaryItems = [
        { label: "Booked", value: data.bookingDate },
        { label: "Duration", value: `${data.tripStartDate} – ${data.tripEndDate}` },
        { label: "Nights", value: data.hotelNights },
    ];

    const addonItems = [
        { label: "Insurance", value: data.addons.insurance, icon: "🛡️" },
        { label: "Transfer", value: data.addons.transfer, icon: "🚗" },
    ];

    const outdatedTrip = new Date(data.tripEndDate) < new Date();

    const rootClass = `w-full h-64 mb-6 rounded-xl overflow-hidden relative ${outdatedTrip ? 'cursor-not-allowed grayscale' : 'cursor-pointer hover:scale-[1.02] transition-transform'}`;

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
                    <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 text-center">
                        <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                            {data.country}
                        </h2>
                    </div>
                </div>

                {/* Right Side - All Data Points (70%) */}
                <div className="flex-[0_0_70%] p-6 overflow-y-auto">
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 h-full text-white flex flex-col gap-3">
                        <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                            {summaryItems.map((item) => (
                                <span key={item.label} className="text-white/80">
                                    {item.label}: <span className="text-white font-semibold">{item.value}</span>
                                </span>
                            ))}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Departure</p>
                                <p>{data.flightInfo.departure.airportCode} · {data.flightInfo.departure.flightNumber}</p>
                                <p className="text-white/70 text-[11px]">{data.flightInfo.departure.date} @ {data.flightInfo.departure.time}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Return</p>
                                <p>{data.flightInfo.arrival.airportCode} · {data.flightInfo.arrival.flightNumber}</p>
                                <p className="text-white/70 text-[11px]">{data.flightInfo.arrival.date} @ {data.flightInfo.arrival.time}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Stay</p>
                                <p className="text-sm font-semibold">{data.hotel.name}</p>
                                <p className="text-white/70 text-[11px]">Meal plan: {data.food}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Add-ons</p>
                                <div className="flex flex-wrap gap-2">
                                    {addonItems.map((addon) => (
                                        <span
                                            key={addon.label}
                                            className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                                                addon.value ? 'bg-white/20 text-emerald-200' : 'bg-white/5 text-white/50'
                                            }`}
                                        >
                                            {addon.icon} {addon.label}
                                            <span className="text-[10px] uppercase tracking-wider">{addon.value ? 'Yes' : 'No'}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="text-[11px] text-white/60 italic">Traveler details available when expanded ({data.tourists.length}).</p>
                    </div>
                </div>
            </div>
    </div>
    )
}