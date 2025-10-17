import FormInput from '@/components/ui/form-input';

export const StaySection = () => {
    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Stay</h2>
                <p className="text-sm text-foreground/60">Where travellers will be staying during the tour.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <FormInput
                    labelText="Hotel name"
                    placeholder="Resort or hotel name"
                    name="hotelName"
                    autoComplete="off"
                />
                <FormInput
                    labelText="Check-in"
                    placeholder='30/01/2021'
                    name="hotelCheckIn"
                    autoComplete="off"
                />
                <FormInput
                    labelText="Check-out"
                    placeholder='30/01/2021'
                    name="hotelCheckOut"
                    autoComplete="off"
                />
                <FormInput
                    labelText="Room type"
                    placeholder="e.g. Double deluxe"
                    name="roomType"
                    autoComplete="off"
                />
            </div>
        </section>
    );
};
