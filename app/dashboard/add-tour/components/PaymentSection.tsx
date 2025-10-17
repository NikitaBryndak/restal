import FormInput from '@/components/ui/form-input';

export const PaymentSection = () => {
    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Payment</h2>
                <p className="text-sm text-foreground/60">Capture the financials to keep billing clear.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <FormInput
                    labelText="Total amount"
                    placeholder="e.g. 1299.99"
                    name="paymentTotal"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                />
                <FormInput
                    labelText="Paid amount"
                    placeholder="e.g. 500"
                    name="paymentPaid"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                />
                <FormInput
                    labelText="Payment deadline"
                    placeholder='30/01/2021'
                    name="paymentDeadline"
                    autoComplete="off"
                />
            </div>
        </section>
    );
};
