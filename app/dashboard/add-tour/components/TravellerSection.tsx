import { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { TourFormValues } from '../schema';
import { Tourist } from '@/types';

type TravellerSectionProps = {
    variant?: 'create' | 'edit';
    tourists?: Tourist[];
    onChange?: (index: number, field: keyof Tourist, value: string) => void;
    onAdd?: () => void;
    onRemove?: (index: number) => void;
};

const TravellerSectionCreate = ({
    onAdd,
    onRemove,
}: TravellerSectionProps) => {
    const { register, control, formState: { errors } } = useFormContext<TourFormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "travellers",
    });

    useEffect(() => {
        if (fields.length === 0) {
            append({
                firstName: '',
                lastName: '',
                sex: 'unspecified',
                passportExpiry: '',
                dob: '',
                passportNumber: '',
                passportSeries: '',
                passportIssueDate: '',
            });
        }
    }, [fields.length, append]);

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-foreground">Travellers</h2>
                    <p className="text-sm text-foreground/60">Main traveller details — at least name and passport expiry.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => append({
                    firstName: '',
                    lastName: '',
                    sex: 'unspecified',
                    passportExpiry: '',
                    dob: '',
                    passportNumber: '',
                    passportSeries: '',
                    passportIssueDate: '',
                })}>
                    Add traveller
                </Button>
            </div>
            <div className="mt-6 grid gap-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="rounded-2xl border border-border/40 bg-white/60 p-4 dark:bg-white/10">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-foreground">Traveller #{index + 1}</h3>
                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => remove(index)}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
                            <div className="space-y-1">
                                <FormInput
                                    labelText="First name"
                                    placeholder="e.g. John"
                                    autoComplete="off"
                                    {...register(`travellers.${index}.firstName`)}
                                />
                                {errors.travellers?.[index]?.firstName && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.firstName?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <FormInput
                                    labelText="Surname"
                                    placeholder="e.g. Doe"
                                    autoComplete="off"
                                    {...register(`travellers.${index}.lastName`)}
                                />
                                {errors.travellers?.[index]?.lastName && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.lastName?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground/80">
                                    Sex
                                </label>
                                <select
                                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    {...register(`travellers.${index}.sex`)}
                                >
                                    <option value="unspecified" disabled>
                                        Select an option
                                    </option>
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <FormInput
                                    labelText="Passport expiry"
                                    placeholder='30/01/2021'
                                    autoComplete="off"
                                    formatType="date"
                                    {...register(`travellers.${index}.passportExpiry`)}
                                />
                                {errors.travellers?.[index]?.passportExpiry && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.passportExpiry?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <FormInput
                                    labelText="DOB"
                                    placeholder='30/01/2021'
                                    autoComplete="off"
                                    formatType="date"
                                    {...register(`travellers.${index}.dob`)}
                                />
                                {errors.travellers?.[index]?.dob && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.dob?.message}</p>
                                )}
                            </div>
                            <FormInput
                                labelText="Pasport number"
                                placeholder='127485153'
                                autoComplete="off"
                                {...register(`travellers.${index}.passportNumber`)}
                            />
                            <FormInput
                                labelText="Pasport series"
                                placeholder='AA123456'
                                autoComplete="off"
                                {...register(`travellers.${index}.passportSeries`)}
                            />
                            <FormInput
                                labelText="Pasport issue date"
                                placeholder='30/01/2021'
                                autoComplete="off"
                                formatType="date"
                                {...register(`travellers.${index}.passportIssueDate`)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

const TravellerSectionEdit = ({
    tourists,
    onChange,
    onAdd,
    onRemove,
}: TravellerSectionProps) => {
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

export const TravellerSection = (props: TravellerSectionProps) => {
    if (props.variant === 'create') {
        return <TravellerSectionCreate {...props} />;
    }
    return <TravellerSectionEdit {...props} />;
};
