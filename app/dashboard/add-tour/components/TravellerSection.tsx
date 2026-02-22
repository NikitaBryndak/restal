import { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { TourFormValues } from '../schema';
import { Tourist } from '@/types';
import { Users, UserPlus } from 'lucide-react';

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
                <div className="flex items-start gap-4 flex-1 p-4 rounded-xl bg-linear-to-r from-rose-500/10 via-pink-500/10 to-fuchsia-500/10 border border-rose-500/20">
                    <div className="p-2 rounded-lg bg-rose-500/20">
                        <Users className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-white">Подорожуючі</h2>
                        <p className="text-sm text-white/50">Дані основного подорожуючого — мінімум імʼя та термін дії паспорта.</p>
                    </div>
                </div>
                <Button type="button" variant="outline" className="flex items-center gap-2" onClick={() => append({
                    firstName: '',
                    lastName: '',
                    sex: 'unspecified',
                    passportExpiry: '',
                    dob: '',
                    passportNumber: '',
                    passportSeries: '',
                    passportIssueDate: '',
                })}>
                    <UserPlus className="w-4 h-4" />
                    Додати подорожуючого
                </Button>
            </div>
            {/* Array-level error (e.g. "at least one traveller required") */}
            {errors.travellers?.root?.message && (
                <p className="text-sm text-red-500 font-medium">{errors.travellers.root.message}</p>
            )}
            {errors.travellers?.message && (
                <p className="text-sm text-red-500 font-medium">{errors.travellers.message}</p>
            )}
            <div className="mt-6 grid gap-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Подорожуючий #{index + 1}</h3>
                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => remove(index)}
                                >
                                    Видалити
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
                            <div className="space-y-1">
                                <FormInput
                                    labelText="Ім'я"
                                    placeholder="напр. Іван"
                                    autoComplete="off"
                                    {...register(`travellers.${index}.firstName`)}
                                />
                                {errors.travellers?.[index]?.firstName && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.firstName?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <FormInput
                                    labelText="Прізвище"
                                    placeholder="напр. Шевченко"
                                    autoComplete="off"
                                    {...register(`travellers.${index}.lastName`)}
                                />
                                {errors.travellers?.[index]?.lastName && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.lastName?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/60">
                                    Стать
                                </label>
                                <select
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                                    {...register(`travellers.${index}.sex`)}
                                >
                                    <option value="unspecified" disabled>
                                        Виберіть опцію
                                    </option>
                                    <option value="female">Жіноча</option>
                                    <option value="male">Чоловіча</option>
                                    <option value="other">Інша</option>
                                </select>
                                {errors.travellers?.[index]?.sex && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.sex?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <FormInput
                                    labelText="Термін дії паспорта"
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
                                    labelText="Дата народження"
                                    placeholder='30/01/2021'
                                    autoComplete="off"
                                    formatType="date"
                                    {...register(`travellers.${index}.dob`)}
                                />
                                {errors.travellers?.[index]?.dob && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.dob?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <FormInput
                                    labelText="Номер паспорта"
                                    placeholder='127485153'
                                    autoComplete="off"
                                    {...register(`travellers.${index}.passportNumber`)}
                                />
                                {errors.travellers?.[index]?.passportNumber && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.passportNumber?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <FormInput
                                    labelText="Серія паспорта"
                                    placeholder='AA123456'
                                    autoComplete="off"
                                    {...register(`travellers.${index}.passportSeries`)}
                                />
                                {errors.travellers?.[index]?.passportSeries && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.passportSeries?.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <FormInput
                                    labelText="Дата видачі паспорта"
                                    placeholder='30/01/2021'
                                    autoComplete="off"
                                    formatType="date"
                                    {...register(`travellers.${index}.passportIssueDate`)}
                                />
                                {errors.travellers?.[index]?.passportIssueDate && (
                                    <p className="text-xs text-red-500">{errors.travellers[index]?.passportIssueDate?.message}</p>
                                )}
                            </div>
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
                <div className="flex items-start gap-4 flex-1 p-4 rounded-xl bg-linear-to-r from-rose-500/10 via-pink-500/10 to-fuchsia-500/10 border border-rose-500/20">
                    <div className="p-2 rounded-lg bg-rose-500/20">
                        <Users className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-white">Подорожуючі</h2>
                        <p className="text-sm text-white/50">Редагуйте дані подорожуючих або додайте нових учасників.</p>
                    </div>
                </div>
                {onAdd && (
                    <Button type="button" variant="outline" className="flex items-center gap-2" onClick={onAdd}>
                        <UserPlus className="w-4 h-4" />
                        Додати подорожуючого
                    </Button>
                )}
            </div>
            <div className="mt-6 grid gap-6">
                {tourists?.map((tourist, index) => (
                    <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Подорожуючий #{index + 1}</h3>
                            {tourists.length > 1 && onRemove && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onRemove(index)}
                                >
                                    Видалити
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormInput
                                labelText="Ім'я"
                                value={tourist.name ?? ''}
                                onChange={(e) => onChange?.(index, 'name', e.target.value)}
                                required
                            />
                            <FormInput
                                labelText="Прізвище"
                                value={tourist.surname ?? ''}
                                onChange={(e) => onChange?.(index, 'surname', e.target.value)}
                                required
                            />
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/60">Стать</label>
                                <select
                                    value={tourist.sex ?? ''}
                                    onChange={(e) => onChange?.(index, 'sex', e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                                    required
                                >
                                    <option value="" disabled>Виберіть опцію</option>
                                    <option value="female">Жіноча</option>
                                    <option value="male">Чоловіча</option>
                                    <option value="other">Інша</option>
                                </select>
                            </div>
                            <FormInput
                                labelText="Дата народження"
                                value={tourist.dob ?? ''}
                                onChange={(e) => onChange?.(index, 'dob', e.target.value)}
                                formatType="date"
                                required
                            />
                            <FormInput
                                labelText="Термін дії паспорта"
                                value={tourist.passportExpiryDate ?? ''}
                                onChange={(e) => onChange?.(index, 'passportExpiryDate', e.target.value)}
                                formatType="date"
                                required
                            />
                            <FormInput
                                labelText="Номер паспорта"
                                value={tourist.passportNumber ?? ''}
                                onChange={(e) => onChange?.(index, 'passportNumber', e.target.value)}
                                required
                            />
                            <FormInput
                                labelText="Серія паспорта"
                                value={tourist.passportSeries ?? ''}
                                onChange={(e) => onChange?.(index, 'passportSeries', e.target.value)}
                                required
                            />
                            <FormInput
                                labelText="Дата видачі паспорта"
                                value={tourist.passportIssueDate ?? ''}
                                onChange={(e) => onChange?.(index, 'passportIssueDate', e.target.value)}
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
