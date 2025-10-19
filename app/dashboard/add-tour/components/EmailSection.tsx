import FormInput from '@/components/ui/form-input';

export const EmailSection = () => {
    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Email</h2>
                <p className="text-sm text-foreground/60">Who is the primary contact for this tour?</p>
            </div>

            <FormInput
                labelText="Email"
                placeholder="e.g. john.doe@example.com"
                name="ownerEmail"
                type="email"
                autoComplete="off"
                formatType="email"
            />
        </section>
    );
};
