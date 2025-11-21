import { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { Tourist } from '@/types';

type TravellerSectionProps = {
    variant?: 'create' | 'edit';
    tourists?: Tourist[];
    onChange?: (index: number, field: keyof Tourist, value: string) => void;
    onAdd?: () => void;
    onRemove?: (index: number) => void;
};

export const TravellerSection = ({
    variant = 'create',
    tourists,
    onChange,
    onAdd,
    onRemove,
}: TravellerSectionProps) => {
    if (variant === 'create') {
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
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-foreground">Travellers</h2>
                    <p className="text-sm text-foreground/60">Adjust traveller details or add new participants.</p>
                </div>
                {onAdd && (
                    <Button type="button" variant="outline" onClick={onAdd}>
                        Add traveller
                    </Button>
                )}
            </div>
            <div className="mt-6 grid gap-6">
                {tourists?.map((tourist, index) => (
                    <div key={index} className="rounded-2xl border border-border/40 bg-white/60 p-4 dark:bg-white/10">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-foreground">Traveller #{index + 1}</h3>
                            {tourists.length > 1 && onRemove && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onRemove(index)}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormInput
                                labelText="First name"
                                value={tourist.name ?? ''}
                                onChange={(e) => onChange?.(index, 'name', e.target.value)}
                                required
                            />
                            <FormInput
                                labelText="Surname"
                                value={tourist.surname ?? ''}
                                onChange={(e) => onChange?.(index, 'surname', e.target.value)}
                                required
                            />
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground/80">Sex</label>
                                <select
                                    value={tourist.sex ?? ''}
                                    onChange={(e) => onChange?.(index, 'sex', e.target.value)}
                                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    required
                                >
                                    <option value="" disabled>Select an option</option>
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <FormInput
                                labelText="Date of birth"
                                value={tourist.DOB ?? ''}
                                onChange={(e) => onChange?.(index, 'DOB', e.target.value)}
                                formatType="date"
                                required
                            />
                            <FormInput
                                labelText="Passport expiry"
                                value={tourist.pasportExpiryDate ?? ''}
                                onChange={(e) => onChange?.(index, 'pasportExpiryDate', e.target.value)}
                                formatType="date"
                                required
                            />
                            <FormInput
                                labelText="Passport number"
                                value={tourist.PasportNumber ?? ''}
                                onChange={(e) => onChange?.(index, 'PasportNumber', e.target.value)}
                                required
                            />
                            <FormInput
                                labelText="Passport series"
                                value={tourist.PasportSeries ?? ''}
                                onChange={(e) => onChange?.(index, 'PasportSeries', e.target.value)}
                                required
                            />
                            <FormInput
                                labelText="Passport issue date"
                                value={tourist.PasportIsueDate ?? ''}
                                onChange={(e) => onChange?.(index, 'PasportIsueDate', e.target.value)}
                                formatType="date"
                                required
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
