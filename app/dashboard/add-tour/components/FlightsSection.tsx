import FormInput from '@/components/ui/form-input';

export const FlightsSection = () => {
    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Flights</h2>
                <p className="text-sm text-foreground/60">Outbound and return flight details for the itinerary.</p>
            </div>
            <div className="grid gap-6">
                <div className="rounded-2xl border border-border/40 bg-white/70 p-5 dark:bg-white/5">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                        Departure
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <FormInput
                            labelText="Country"
                            placeholder="e.g. Spain"
                            name="departureCountry"
                            autoComplete="off"
                        />
                        <FormInput
                            labelText="Airport code"
                            placeholder="e.g. MAD"
                            name="departureAirport"
                            autoComplete="off"
                        />
                        <FormInput
                            labelText="Flight number"
                            placeholder="e.g. IB1234"
                            name="departureFlight"
                            autoComplete="off"
                        />
                        <FormInput
                            labelText="Date"
                            placeholder='30/01/2021'
                            name="departureDate"
                            autoComplete="off"
                            formatType="date"
                        />
                        <FormInput
                            labelText="Time"
                            placeholder='11:35'
                            name="departureTime"
                            autoComplete="off"
                            formatType="time"
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-border/40 bg-white/70 p-5 dark:bg-white/5">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">
                        Return
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <FormInput
                            labelText="Country"
                            placeholder="e.g. Spain"
                            name="arrivalCountry"
                            autoComplete="off"
                        />
                        <FormInput
                            labelText="Airport code"
                            placeholder="e.g. MAD"
                            name="arrivalAirport"
                            autoComplete="off"
                        />
                        <FormInput
                            labelText="Flight number"
                            placeholder="e.g. IB5678"
                            name="arrivalFlight"
                            autoComplete="off"
                        />
                        <FormInput
                            labelText="Date"
                            placeholder='30/01/2021'
                            name="arrivalDate"
                            autoComplete="off"
                            formatType="date"
                        />
                        <FormInput
                            labelText="Time"
                            placeholder='11:35'
                            name="arrivalTime"
                            autoComplete="off"
                            formatType="time"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
