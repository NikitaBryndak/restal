import FormInput from '@/components/ui/form-input';

export const TravellerSection = () => {
    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Primary traveller</h2>
                <p className="text-sm text-foreground/60">Main traveller details — at least name and passport expiry.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
                <FormInput
                    labelText="First name"
                    placeholder="e.g. John"
                    name="travellerName"
                    autoComplete="off"
                />
                <FormInput
                    labelText="Surname"
                    placeholder="e.g. Doe"
                    name="travellerSurname"
                    autoComplete="off"
                />
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80" htmlFor="travellerSex">
                        Sex
                    </label>
                    <select
                        id="travellerSex"
                        name="travellerSex"
                        defaultValue=""
                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="" disabled>
                            Select an option
                        </option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <FormInput
                    labelText="Passport expiry"
                    placeholder='30/01/2021'
                    name="travellerPassportExpiry"
                    autoComplete="off"
                    formatType="date"
                />
                <FormInput
                    labelText="DOB"
                    placeholder='30/01/2021'
                    name="travellerDOB"
                    autoComplete="off"
                    formatType="date"
                />
                <FormInput
                    labelText="Pasport number"
                    placeholder='127485153'
                    name="travellerPassportNumber"
                    autoComplete="off"
                />
                <FormInput
                    labelText="Pasport series"
                    placeholder='AA123456'
                    name="travellerPassportSeries"
                    autoComplete="off"
                />
                <FormInput
                    labelText="Pasport issue date"
                    placeholder='30/01/2021'
                    name="travellerPassportIssueDate"
                    autoComplete="off"
                    formatType="date"
                />
            </div>
        </section>
    );
};
