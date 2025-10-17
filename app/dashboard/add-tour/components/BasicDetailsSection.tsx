import FormInput from '@/components/ui/form-input';

export const BasicDetailsSection = () => {
    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Basic details</h2>
                <p className="text-sm text-foreground/60">Start with the headline facts about this getaway.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <FormInput
                    labelText="Destination"
                    placeholder="Spain, Italy, Greece..."
                    name="country"
                    autoComplete="off"
                />
                <FormInput
                    labelText="Hotel nights"
                    placeholder="e.g. 7"
                    name="hotelNights"
                    inputMode="numeric"
                    pattern="[0-9]*"
                />
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <FormInput
                    labelText="Departure date"
                    placeholder='30/01/2021'
                    name="tripStartDate"
                    autoComplete="off"
                />
                <FormInput
                    labelText="Return date"
                    placeholder='30/01/2021'
                    name="tripEndDate"
                    autoComplete="off"
                />
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-foreground/80">Meal plan</label>
                <select
                    name="food"
                    defaultValue=""
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                    <option value="" disabled>
                        Select an option
                    </option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Half Board">Half board</option>
                    <option value="Full Board">Full board</option>
                    <option value="All Inclusive">All inclusive</option>
                </select>
            </div>
        </section>
    );
};
