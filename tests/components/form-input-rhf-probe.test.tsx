// @vitest-environment jsdom
// Isolated probe: does a date-formatted FormInput registered via RHF + zodResolver
// actually update form state on change? (paymentDeadline was observed lost in the
// real add-tour page; tripStartDate with requiredDateSchema worked.)
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/ui/form-input";
import { tourSchema, TourFormValues } from "@/app/dashboard/add-tour/schema";

const defaultValues: TourFormValues = {
    number: "",
    country: "",
    region: "",
    hotelNights: 0,
    tripStartDate: "",
    tripEndDate: "",
    food: "",
    bookingDate: "",
    hotelName: "",
    hotelCheckIn: "",
    hotelCheckOut: "",
    roomType: "",
    departureCountry: "",
    departureAirport: "",
    departureFlight: "",
    departureDate: "",
    departureTime: "",
    arrivalCountry: "",
    arrivalAirport: "",
    arrivalFlight: "",
    arrivalDate: "",
    arrivalTime: "",
    travellers: [{
        firstName: "",
        lastName: "",
        sex: "unspecified" as const,
        passportExpiry: "",
        dob: "",
        passportNumber: "",
        passportSeries: "",
        passportIssueDate: "",
    }],
    insurance: false,
    transfer: false,
    paymentTotal: 0,
    paymentPaid: 0,
    paymentDeadline: "",
    promoCode: "",
    ownerPhone: "",
};

type FormType = ReturnType<typeof useForm<TourFormValues>>;
afterEach(() => {
  cleanup();
});

/** Instrumented register: logs every call RHF's onChange receives. */
function DateField({ form, name, label }: { form: FormType; name: "paymentDeadline" | "tripStartDate"; label: string }) {
    const reg = form.register(name);
    return (
        <FormInput
            labelText={label}
            formatType="date"
            {...reg}
            onChange={(e: any) => {
                console.log(`[probe] wrapper for ${name}: target.name=${JSON.stringify(e?.target?.name)} value=${JSON.stringify(e?.target?.value)}`);
                reg.onChange(e);
                console.log(`[probe] after reg.onChange, getValues(${name}) =`, JSON.stringify(form.getValues(name)));
            }}
        />
    );
}

function Probe({ onReady }: { onReady: (f: FormType) => void }) {
    const form = useForm<TourFormValues>({
        resolver: zodResolver(tourSchema) as any,
        defaultValues,
        mode: "onChange",
    });
    return (
        <form>
            {onReady(form)}
            <DateField form={form} name="paymentDeadline" label="Термін оплати" />
            <DateField form={form} name="tripStartDate" label="Дата вильоту" />
        </form>
    );
}

describe("FormInput + RHF zodResolver date fields", () => {
    it("updates paymentDeadline (optionalDateSchema union) on change", async () => {
        let formRef: FormType | null = null;
        render(<Probe onReady={(f) => { formRef = f; return null; }} />);
        const input = document.querySelector("#paymentDeadline") as HTMLInputElement;
        expect(input).toBeTruthy();

        fireEvent.change(input, { target: { value: "19/09/2026" } });

        await waitFor(() => {
            expect(formRef!.getValues("paymentDeadline")).toBe("19/09/2026");
        }, { timeout: 3000 });
    });

    it("updates tripStartDate (requiredDateSchema) on change", async () => {
        let formRef: FormType | null = null;
        render(<Probe onReady={(f) => { formRef = f; return null; }} />);
        const input = document.querySelector("#tripStartDate") as HTMLInputElement;
        expect(input).toBeTruthy();

        fireEvent.change(input, { target: { value: "15/09/2026" } });

        await waitFor(() => {
            expect(formRef!.getValues("tripStartDate")).toBe("15/09/2026");
        }, { timeout: 3000 });
    });
});
